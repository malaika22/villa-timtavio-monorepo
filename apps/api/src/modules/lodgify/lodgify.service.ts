import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class LodgifyService {
  private readonly logger = new Logger(LodgifyService.name);
  private client: AxiosInstance;

  constructor(private config: ConfigService) {
    this.client = axios.create({
      baseURL: 'https://api.lodgify.com/v2',
      headers: {
        'X-ApiKey': config.get('LODGIFY_API_KEY'),
        'Content-Type': 'application/json',
      },
    });
  }

  async getBookings(from?: string, to?: string) {
    const response = await this.client.get('/reservations', {
      params: {
        propertyId: this.config.get('LODGIFY_PROPERTY_ID'),
        dateArrivalMin: from,
        dateDepartureMax: to,
        size: 100,
      },
    });
    return response.data;
  }

  async getBookingById(lodgifyId: string) {
    const response = await this.client.get(`/reservations/${lodgifyId}`);
    return response.data;
  }

  async blockDates(from: string, to: string, reason: string) {
    const response = await this.client.post('/availability/block', {
      propertyId: this.config.get('LODGIFY_PROPERTY_ID'),
      from,
      to,
      reason,
    });
    return response.data;
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', this.config.get('LODGIFY_WEBHOOK_SECRET'))
      .update(payload)
      .digest('hex');
    return signature === expected;
  }
}
