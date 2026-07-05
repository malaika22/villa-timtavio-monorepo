// apps/api/src/breezeway/breezeway.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class BreezeWayService {
  private readonly logger = new Logger(BreezeWayService.name);
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private config: ConfigService) {
    this.client = axios.create({
      baseURL: 'https://api.breezeway.io/v1',
    });

    // Inject a fresh Bearer token before every request.
    this.client.interceptors.request.use(async (cfg) => {
      const token = await this.getToken();
      cfg.headers = cfg.headers ?? {};
      cfg.headers['Authorization'] = `Bearer ${token}`;
      cfg.headers['Content-Type'] = 'application/json';
      return cfg;
    });
  }

  private async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.accessToken;
    }

    const clientId = this.config.get<string>('BREEZEWAY_CLIENT_ID');
    const clientSecret = this.config.get<string>('BREEZEWAY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('BREEZEWAY_CLIENT_ID / BREEZEWAY_CLIENT_SECRET not set');
    }

    const res = await axios.post(
      'https://auth.breezeway.io/oauth/token',
      { grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret },
      { headers: { 'Content-Type': 'application/json' } },
    );

    this.accessToken = res.data.access_token as string;
    // expires_in is in seconds; fall back to 23 h if not provided.
    const expiresIn: number = res.data.expires_in ?? 82_800;
    this.tokenExpiresAt = Date.now() + expiresIn * 1_000;
    this.logger.log('Breezeway token refreshed');
    return this.accessToken;
  }

  async createTask(data: {
    title: string;
    description: string;
    propertyId: string;
    teamId: string;
    dueDate: string;
    requirePhoto: boolean;
    templateId?: string;
    metadata?: Record<string, any>;
  }) {
    const response = await this.client.post('/tasks', {
      name: data.title,
      description: data.description,
      property_id: data.propertyId,
      team_id: data.teamId,
      due_date: data.dueDate,
      require_photo: data.requirePhoto,
      template_id: data.templateId,
      custom_fields: data.metadata,
    });
    return response.data;
  }

  async getTask(taskId: string) {
    const response = await this.client.get(`/tasks/${taskId}`);
    return response.data;
  }

  async getTeams() {
    const response = await this.client.get(
      `/organizations/${this.config.get('BREEZEWAY_ORG_ID')}/teams`,
    );
    return response.data;
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
