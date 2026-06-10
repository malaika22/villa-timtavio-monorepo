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

  validateWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', this.config.get('BREEZEWAY_WEBHOOK_SECRET'))
      .update(payload)
      .digest('hex');
    return signature === expected;
  }
}
