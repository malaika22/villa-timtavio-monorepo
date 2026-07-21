// apps/api/src/breezeway/breezeway.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

// Breezeway public API. Auth mints a 24h JWT from client_id/client_secret and
// every request carries it as `Authorization: JWT <token>` (NOT Bearer).
// Docs: https://developer.breezeway.io/docs/authentication
const BREEZEWAY_BASE = 'https://api.breezeway.io/public';
const BREEZEWAY_AUTH_URL = 'https://api.breezeway.io/public/auth/v1/';

@Injectable()
export class BreezeWayService {
  private readonly logger = new Logger(BreezeWayService.name);
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;
  // The token endpoint is rate-limited to 1 req/min, so concurrent callers must
  // share a single in-flight fetch rather than each POSTing their own.
  private tokenPromise: Promise<string> | null = null;

  constructor(private config: ConfigService) {
    this.client = axios.create({ baseURL: BREEZEWAY_BASE });

    // Inject a fresh JWT before every request.
    this.client.interceptors.request.use(async (cfg) => {
      const token = await this.getToken();
      cfg.headers = cfg.headers ?? {};
      cfg.headers['Authorization'] = `JWT ${token}`;
      cfg.headers['Content-Type'] = 'application/json';
      return cfg;
    });
  }

  private async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.accessToken;
    }
    if (this.tokenPromise) return this.tokenPromise;
    this.tokenPromise = this.fetchToken().finally(() => {
      this.tokenPromise = null;
    });
    return this.tokenPromise;
  }

  private async fetchToken(): Promise<string> {
    const clientId = this.config.get<string>('BREEZEWAY_CLIENT_ID');
    const clientSecret = this.config.get<string>('BREEZEWAY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('BREEZEWAY_CLIENT_ID / BREEZEWAY_CLIENT_SECRET not set');
    }

    const res = await axios.post(
      BREEZEWAY_AUTH_URL,
      { client_id: clientId, client_secret: clientSecret },
      { headers: { 'Content-Type': 'application/json' } },
    );

    this.accessToken = res.data.access_token as string;
    // Access tokens live 24h; getToken applies a 60s refresh skew. We don't use
    // the refresh_token — re-authing is simpler and well within the rate limit.
    this.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
    this.logger.log('Breezeway token refreshed');
    return this.accessToken;
  }

  async createTask(data: {
    title: string;
    description: string;
    propertyId: string;
    assigneeId: string;
    dueDate: string; // ISO datetime — split into scheduled_date + scheduled_time
    requirePhoto: boolean; // kept for signature compat; not a create-task field
    templateId?: string;
    metadata?: Record<string, any>;
  }) {
    const due = new Date(data.dueDate);
    const scheduledDate = due.toISOString().slice(0, 10); // YYYY-MM-DD
    const scheduledTime = due.toISOString().slice(11, 19); // HH:MM:SS

    const body: Record<string, any> = {
      name: data.title,
      description: data.description,
      // BREEZEWAY_PROPERTY_ID is the villa's Breezeway home id (numeric).
      home_id: Number(data.propertyId),
      type_department:
        process.env.BREEZEWAY_TASK_DEPARTMENT || 'housekeeping',
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
    };

    // Only send real (positive) ids — Number(null)/Number('') === 0, which is
    // finite, so a missing template/assignee would otherwise send id 0 and
    // Breezeway 500s trying to resolve it.
    const assignee = Number(data.assigneeId);
    if (Number.isFinite(assignee) && assignee > 0) body.assignments = [assignee];

    const template = Number(data.templateId);
    if (Number.isFinite(template) && template > 0) body.template_id = template;

    try {
      const response = await this.client.post('/inventory/v1/task', body);
      return response.data;
    } catch (error: any) {
      // Surface Breezeway's actual validation/error body + what we sent, so a
      // failed create is diagnosable instead of a bare "status code 500".
      this.logger.error(
        `Breezeway createTask ${error?.response?.status ?? '?'}: ` +
          `${JSON.stringify(error?.response?.data ?? error?.message)} — sent ${JSON.stringify(body)}`,
      );
      throw error;
    }
  }

  async getTask(taskId: string) {
    const response = await this.client.get(`/inventory/v1/task/${taskId}`);
    return response.data;
  }

  /**
   * Lists staff (people) so the EM can pick who a given experience routes to.
   * Returns only active people.
   */
  async getStaff(): Promise<
    Array<{
      id: string;
      name: string;
      department: string | null;
      email: string | null;
    }>
  > {
    const res = await this.client.get('/inventory/v1/people');
    const people: any[] = Array.isArray(res.data)
      ? res.data
      : (res.data?.data ?? res.data?.results ?? []);

    return people
      .filter((p) => p?.active !== false)
      .map((p) => ({
        id: String(p.id),
        name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || `#${p.id}`,
        department: p.type_departments?.[0] ?? p.type_role ?? null,
        email: p.emails?.[0] ?? null,
      }));
  }

  validateWebhookSignature(
    payload: string | Buffer,
    signature: string,
  ): boolean {
    const secret = this.config.get<string>('BREEZEWAY_WEBHOOK_SECRET');
    if (!secret) {
      // Missing secret rejects in production; skips only for local testing.
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(
          'BREEZEWAY_WEBHOOK_SECRET is not set — rejecting webhook in production',
        );
        return false;
      }
      this.logger.warn(
        'BREEZEWAY_WEBHOOK_SECRET is not set — skipping validation (non-production only)',
      );
      return true;
    }
    if (!signature) return false;

    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Timing-safe comparison (avoids leaking signature via response timing).
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
}
