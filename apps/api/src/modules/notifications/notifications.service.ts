import { Injectable, Logger } from '@nestjs/common';
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

  constructor(private prisma: PrismaService) {}

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

    // TODO: Send web push notification here using VAPID
    // This is handled by the push subscription stored per device

    return notification;
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
