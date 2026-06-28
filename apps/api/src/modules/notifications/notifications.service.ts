import { Injectable, Logger } from '@nestjs/common';
import webpush from 'web-push';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

interface SendNotificationDto {
  bookingId: string;
  recipientEmail: string;
  type: NotificationType;
  title: string;
  body: string;
  deepLink?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly vapidReady: boolean;

  constructor(private prisma: PrismaService) {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    this.vapidReady = Boolean(pub && priv);
    if (this.vapidReady) {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT ??
          process.env.VAPID_EMAIL ??
          'mailto:estate@villatimtavio.com',
        pub!,
        priv!,
      );
    }
  }

  async send(dto: SendNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        bookingId: dto.bookingId,
        recipientEmail: dto.recipientEmail,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        deepLink: dto.deepLink,
      },
    });

    // Best-effort web push to the recipient's registered devices.
    void this.sendWebPush(dto).catch((err) =>
      this.logger.error(`Web push failed: ${String(err)}`),
    );

    return notification;
  }

  private async sendWebPush(dto: SendNotificationDto) {
    if (!this.vapidReady) return; // No VAPID keys configured — skip silently.

    const subs = await this.prisma.pushSubscription.findMany({
      where: { bookingId: dto.bookingId, guestEmail: dto.recipientEmail },
    });
    if (subs.length === 0) return;

    const payload = JSON.stringify({
      title: dto.title,
      body: dto.body,
      deepLink: dto.deepLink ?? '/',
    });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dhKey, auth: sub.authKey },
            },
            payload,
          );
        } catch (err: unknown) {
          // 404/410 → the subscription is dead; prune it.
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await this.prisma.pushSubscription
              .delete({ where: { endpoint: sub.endpoint } })
              .catch(() => undefined);
          } else {
            this.logger.warn(`Push to ${sub.endpoint} failed: ${String(err)}`);
          }
        }
      }),
    );
  }

  async getForGuest(bookingId: string, email: string) {
    return this.prisma.notification.findMany({
      where: { bookingId, recipientEmail: email },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(bookingId: string, email: string) {
    const count = await this.prisma.notification.count({
      where: { bookingId, recipientEmail: email, status: 'UNREAD' },
    });
    return { count };
  }

  async markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async markAllRead(bookingId: string, email: string) {
    return this.prisma.notification.updateMany({
      where: { bookingId, recipientEmail: email, status: 'UNREAD' },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async savePushSubscription(
    guestEmail: string,
    bookingId: string,
    subscription: {
      endpoint: string;
      p256dhKey: string;
      authKey: string;
      userAgent?: string;
    },
  ) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: { guestEmail, bookingId },
      create: {
        guestEmail,
        bookingId,
        endpoint: subscription.endpoint,
        p256dhKey: subscription.p256dhKey,
        authKey: subscription.authKey,
        userAgent: subscription.userAgent,
      },
    });
  }
}
