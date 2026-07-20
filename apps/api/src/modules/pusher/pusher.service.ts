import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Pusher from 'pusher';
import { getErrorMessage } from '../../commons/utils/error.util';

export interface PusherTriggerPayload {
  channel: string;
  event: string;
  data: Record<string, any>;
}

// All channel names used across the system
export const PUSHER_CHANNELS = {
  // Per-booking guest channel
  guestBooking: (bookingId: string) => `private-booking-${bookingId}`,

  // Estate Manager shared dashboard channel
  emDashboard: 'private-em-dashboard',

  // Owner dashboard channel
  ownerDashboard: 'private-owner-dashboard',
};

// All event names used across the system
export const PUSHER_EVENTS = {
  // Folio events (guest channel)
  FOLIO_UPDATED: 'folio.updated',

  // Experience request events (guest channel)
  EXPERIENCE_STATUS_CHANGED: 'experience.status_changed',
  EXPERIENCE_READY: 'experience.ready',
  SECONDARY_REQUEST_PENDING: 'secondary_request_pending',

  // Booking lifecycle events (guest channel)
  BOOKING_STATUS_CHANGED: 'booking.status_changed',
  BOOKING_CHECKED_OUT: 'booking.checked_out',

  // Estate Manager dashboard events (EM channel)
  NEW_REQUEST: 'new_request',
  NEW_INQUIRY: 'new_inquiry',
  MANIFEST_SUBMITTED: 'manifest.submitted',
  BOOKING_ARRIVED: 'booking.arrived',
  REQUEST_RESOLVED: 'request.resolved',
  BREEZEWAY_TASK_OVERDUE: 'breezeway.task_overdue',

  // Owner dashboard events (owner channel)
  NEW_BOOKING: 'new_booking',
  REVENUE_UPDATED: 'revenue.updated',
};

@Injectable()
export class PusherService implements OnModuleInit {
  private readonly logger = new Logger(PusherService.name);
  private pusher!: Pusher;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.pusher = new Pusher({
      appId: this.config.get('PUSHER_APP_ID') || '',
      key: this.config.get('PUSHER_KEY') || '',
      secret: this.config.get('PUSHER_SECRET') || '',
      cluster: this.config.get('PUSHER_CLUSTER') || '',
      useTLS: true,
    });

    this.logger.log('Pusher client initialised');
  }

  // ─── Trigger a single event on a channel ─────────────────────────────────

  async trigger(
    channel: string,
    event: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      await this.pusher.trigger(channel, event, data);
      this.logger.debug(`Pusher triggered: ${channel} → ${event}`);
    } catch (error) {
      this.logger.error(
        `Pusher trigger failed: ${channel} → ${event}: ${getErrorMessage(error)}`,
      );
      // Do not throw — Pusher failure should never break the main flow
    }
  }

  // ─── Trigger multiple events in one batch (max 10 per batch) ─────────────

  async triggerBatch(events: PusherTriggerPayload[]): Promise<void> {
    if (events.length === 0) return;

    // Pusher batch limit is 10 events
    const batches: PusherTriggerPayload[][] = [];
    for (let i = 0; i < events.length; i += 10) {
      batches.push(events.slice(i, i + 10));
    }

    for (const batch of batches) {
      try {
        await this.pusher.triggerBatch(
          batch.map((e) => ({
            channel: e.channel,
            name: e.event,
            data: JSON.stringify(e.data),
          })),
        );
        this.logger.debug(`Pusher batch triggered: ${batch.length} events`);
      } catch (error) {
        this.logger.error(`Pusher batch failed: ${getErrorMessage(error)}`);
      }
    }
  }

  // ─── Authenticate a private channel subscription ──────────────────────────

  authenticateGuestChannel(
    socketId: string,
    channel: string,
    bookingId: string,
  ): any {
    // Validate the guest is subscribing to their own booking channel
    const expectedChannel = PUSHER_CHANNELS.guestBooking(bookingId);

    if (channel !== expectedChannel) {
      throw new Error(
        `Channel mismatch: expected ${expectedChannel}, got ${channel}`,
      );
    }

    return this.pusher.authorizeChannel(socketId, channel, {
      user_id: bookingId,
    });
  }

  authenticateEmChannel(socketId: string, channel: string): any {
    const allowedChannels = [
      PUSHER_CHANNELS.emDashboard,
      PUSHER_CHANNELS.ownerDashboard,
    ];

    if (!allowedChannels.includes(channel)) {
      throw new Error(`Channel not allowed: ${channel}`);
    }

    return this.pusher.authorizeChannel(socketId, channel, {
      user_id: 'estate_manager',
    });
  }

  // ─── Convenience methods — fires correct channel + event combinations ─────

  // Folio updated — fires to guest booking channel (primary member only)
  async folioUpdated(
    bookingId: string,
    data: {
      newItem: {
        id: string;
        description: string;
        amount: number;
        quantity: number;
        total: number;
        type: string;
      };
    },
  ) {
    await this.trigger(
      PUSHER_CHANNELS.guestBooking(bookingId),
      PUSHER_EVENTS.FOLIO_UPDATED,
      data,
    );
  }

  // Experience status changed — fires to guest booking channel
  async experienceStatusChanged(
    bookingId: string,
    data: {
      requestId: string;
      status: string;
      message?: string;
    },
  ) {
    await this.trigger(
      PUSHER_CHANNELS.guestBooking(bookingId),
      PUSHER_EVENTS.EXPERIENCE_STATUS_CHANGED,
      data,
    );
  }

  // Experience ready — fires to guest booking channel + triggers Web Push
  async experienceReady(
    bookingId: string,
    data: {
      requestId: string;
      experienceName: string;
      location?: string;
      photoUrl?: string;
    },
  ) {
    await this.trigger(
      PUSHER_CHANNELS.guestBooking(bookingId),
      PUSHER_EVENTS.EXPERIENCE_READY,
      data,
    );
  }

  // Secondary guest requested an upgrade — fires to primary member only
  async secondaryRequestPending(
    bookingId: string,
    data: {
      requestId: string;
      guestName: string;
      experienceName: string;
      preferredDate: string;
      preferredTime: string;
      guestCount: number;
    },
  ) {
    await this.trigger(
      PUSHER_CHANNELS.guestBooking(bookingId),
      PUSHER_EVENTS.SECONDARY_REQUEST_PENDING,
      data,
    );
  }

  // Booking status changed — fires to all guests on this booking
  async bookingStatusChanged(
    bookingId: string,
    data: {
      status: string;
      message?: string;
    },
  ) {
    await this.trigger(
      PUSHER_CHANNELS.guestBooking(bookingId),
      PUSHER_EVENTS.BOOKING_STATUS_CHANGED,
      data,
    );
  }

  // Booking checked out — fires to all guests
  async bookingCheckedOut(
    bookingId: string,
    data: {
      grandTotal: number;
      chargedAt: string;
    },
  ) {
    await this.trigger(
      PUSHER_CHANNELS.guestBooking(bookingId),
      PUSHER_EVENTS.BOOKING_CHECKED_OUT,
      data,
    );
  }

  // New experience request — fires to EM dashboard
  async newRequestToEm(data: {
    requestId: string;
    guestName: string;
    experienceName: string;
    preferredDate: string;
    preferredTime: string;
    bookingId: string;
    isPrimaryApproved: boolean;
  }) {
    await this.trigger(
      PUSHER_CHANNELS.emDashboard,
      PUSHER_EVENTS.NEW_REQUEST,
      data,
    );
  }

  // New inquiry — fires to EM dashboard
  async newInquiryToEm(data: {
    inquiryId: string;
    guestName: string;
    guestCount: number;
    purposeOfStay: string;
    preferredDates: string;
  }) {
    await this.trigger(
      PUSHER_CHANNELS.emDashboard,
      PUSHER_EVENTS.NEW_INQUIRY,
      data,
    );
  }

  // Manifest submitted — fires to EM dashboard
  async manifestSubmittedToEm(data: {
    bookingId: string;
    primaryGuestName: string;
    guestCount: number;
  }) {
    await this.trigger(
      PUSHER_CHANNELS.emDashboard,
      PUSHER_EVENTS.MANIFEST_SUBMITTED,
      data,
    );
  }

  // Guest arrived — fires to EM dashboard
  async bookingArrivedToEm(data: {
    bookingId: string;
    guestName: string;
    partySize: number;
  }) {
    await this.trigger(
      PUSHER_CHANNELS.emDashboard,
      PUSHER_EVENTS.BOOKING_ARRIVED,
      data,
    );
  }

  // Request resolved (approved/declined) — fires to EM to update badge count
  async requestResolvedToEm(data: {
    requestId: string;
    action: 'approved' | 'declined' | 'conflict';
    remainingPendingCount: number;
  }) {
    await this.trigger(
      PUSHER_CHANNELS.emDashboard,
      PUSHER_EVENTS.REQUEST_RESOLVED,
      data,
    );
  }

  // Breezeway task overdue — fires to EM dashboard
  async breezeWayTaskOverdue(data: {
    taskId: string;
    requestId: string;
    experienceName: string;
    guestName: string;
    minutesOverdue: number;
  }) {
    await this.trigger(
      PUSHER_CHANNELS.emDashboard,
      PUSHER_EVENTS.BREEZEWAY_TASK_OVERDUE,
      data,
    );
  }
}
