// apps/api/src/breezeway/breezeway.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class BreezeWayService {
  private readonly logger = new Logger(BreezeWayService.name);
  private client: AxiosInstance;

  constructor(private config: ConfigService) {
    this.client = axios.create({
      baseURL: 'https://api.breezeway.io/v1',
      headers: {
        Authorization: `Bearer ${config.get('BREEZEWAY_API_KEY')}`,
        'Content-Type': 'application/json',
      },
    });
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
