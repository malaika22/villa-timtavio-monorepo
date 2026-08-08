import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PusherService } from '../pusher/pusher.service';

/**
 * Booking the vendor — the step that used to happen entirely on Rodrigo's
 * phone.
 *
 * Nothing here automates the conversation, and it shouldn't: every vendor is
 * booked by WhatsApp, by a person, and that works. What was missing was any
 * record of whether it had happened, so a guest could be told "confirmed" for
 * an experience nobody had been asked about, and a request waiting on a vendor
 * looked exactly like one nobody had opened.
 *
 * Two acts, then: ask, and write down what they said.
 */
@Injectable()
export class VendorBookingService {
  private readonly logger = new Logger(VendorBookingService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private pusher: PusherService,
  ) {}

  private include = {
    catalogItem: { include: { vendor: true } },
    booking: { include: { primaryGuest: true } },
  };

  private async load(id: string) {
    const request = await this.prisma.experienceRequest.findUnique({
      where: { id },
      include: this.include,
    });
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  /**
   * The message, written for them.
   *
   * Composed server-side so the estate says the same thing every time, and so
   * a change of wording doesn't need three apps redeployed. The estate opens
   * it in their own WhatsApp and sends it themselves — the vendor should see a
   * person, not an integration.
   */
  async draftMessage(id: string) {
    const request = await this.load(id);
    const vendor = request.catalogItem.vendor;

    if (!vendor) {
      throw new BadRequestException(
        'This experience has no vendor — the estate runs it, so there is nobody to ask.',
      );
    }
    if (!vendor.phone) {
      throw new BadRequestException(
        `${vendor.name} has no phone number on file. Add one on the vendor's profile.`,
      );
    }
    // Set in the dashboard and, until now, consulted by nothing — so an estate
    // could book someone who told them last week they were away.
    if (vendor.status !== 'ACTIVE') {
      throw new BadRequestException(
        `${vendor.name} is marked ${vendor.status.toLowerCase().replace('_', ' ')}. Change their status before booking them.`,
      );
    }

    const when = request.confirmedDate ?? request.preferredDate;
    const time = request.confirmedTime ?? request.preferredTime;
    const day = when.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    });

    const lines = [
      `Hola ${vendor.name} — Villa TimTavio.`,
      '',
      `Could you take ${request.catalogItem.name} on ${day} at ${time}, for ${request.guestCount} ${request.guestCount === 1 ? 'guest' : 'guests'}?`,
      '',
      `Guest: ${request.requestedByName}`,
    ];
    if (request.specialRequests?.trim()) {
      lines.push(`Note: “${request.specialRequests.trim()}”`);
    }
    lines.push('', 'Could you confirm availability and the price? Gracias.');

    const message = lines.join('\n');

    return {
      vendorId: vendor.id,
      vendorName: vendor.name,
      phone: vendor.phone,
      message,
      // wa.me wants digits only. A number stored as "+52 322 123 4567" is
      // perfectly readable and completely unusable as a link.
      whatsappUrl: `https://wa.me/${vendor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`,
    };
  }

  /** Record that the estate has actually asked. */
  async markAsked(id: string, askedBy: string) {
    const request = await this.load(id);
    if (!request.catalogItem.vendorId) {
      throw new BadRequestException('This experience has no vendor.');
    }

    const updated = await this.prisma.experienceRequest.update({
      where: { id },
      data: { vendorAskedAt: new Date(), vendorAskedBy: askedBy },
    });

    // The guest has been sitting on "Requested" with no idea anything is
    // moving. This is the first honest thing the estate can tell them.
    await this.notifications.send({
      bookingId: request.bookingId,
      recipientEmail: request.requestedByEmail,
      type: 'REQUEST_CONFIRMED',
      title: 'We’re arranging it',
      body: `${request.catalogItem.name} — we’re checking with ${request.catalogItem.vendor?.name ?? 'the provider'} and will confirm shortly.`,
      deepLink: `/status/${id}`,
    });

    await this.pusher.experienceStatusChanged(request.bookingId, {
      requestId: id,
      status: request.status,
    });

    this.logger.log(`Vendor asked about request ${id} by ${askedBy}`);
    return updated;
  }

  /**
   * What they said.
   *
   * Three answers, because there are three. The estate could previously only
   * confirm or decline, so "they can't do six but could do seven" had to be
   * forced into one of those — usually by the estate quietly moving the
   * booking and telling the guest afterwards.
   */
  async recordReply(
    id: string,
    dto: {
      outcome: 'CONFIRMED' | 'DECLINED' | 'ALTERNATIVE';
      quotedCost?: number;
      note?: string;
      proposedDate?: string;
      proposedTime?: string;
    },
    recordedBy: string,
  ) {
    const request = await this.load(id);
    if (!request.catalogItem.vendorId) {
      throw new BadRequestException('This experience has no vendor.');
    }

    const now = new Date();
    const note = dto.note?.trim() || null;

    if (dto.outcome === 'CONFIRMED') {
      const updated = await this.prisma.experienceRequest.update({
        where: { id },
        data: {
          vendorRepliedAt: now,
          vendorConfirmedAt: now,
          vendorDeclinedAt: null,
          vendorProposedDate: null,
          vendorProposedTime: null,
          vendorQuotedCost: dto.quotedCost ?? null,
          vendorNote: note,
        },
      });
      this.logger.log(`Vendor confirmed request ${id} (${recordedBy})`);
      return updated;
    }

    if (dto.outcome === 'ALTERNATIVE') {
      if (!dto.proposedDate || !dto.proposedTime) {
        throw new BadRequestException(
          'Give the date and time they offered, so the guest has something to accept.',
        );
      }

      const updated = await this.prisma.experienceRequest.update({
        where: { id },
        data: {
          vendorRepliedAt: now,
          vendorConfirmedAt: null,
          vendorDeclinedAt: null,
          vendorProposedDate: new Date(dto.proposedDate),
          vendorProposedTime: dto.proposedTime,
          vendorQuotedCost: dto.quotedCost ?? null,
          vendorNote: note,
        },
      });

      // Theirs to accept, not the estate's to impose. Moving someone's booking
      // and telling them afterwards is how a guest arrives at the wrong hour.
      const day = new Date(dto.proposedDate).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      });
      await this.notifications.send({
        bookingId: request.bookingId,
        recipientEmail: request.requestedByEmail,
        type: 'REQUEST_CONFIRMED',
        title: 'A different time is available',
        body: `${request.catalogItem.name} isn’t available then, but ${day} at ${dto.proposedTime} is. Tap to accept or let it go.`,
        deepLink: `/status/${id}`,
      });

      await this.pusher.experienceStatusChanged(request.bookingId, {
        requestId: id,
        status: request.status,
      });

      this.logger.log(`Vendor offered an alternative on request ${id}`);
      return updated;
    }

    // DECLINED — the vendor can't, so neither can the estate.
    const updated = await this.prisma.experienceRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        statusUpdatedAt: now,
        vendorRepliedAt: now,
        vendorDeclinedAt: now,
        vendorConfirmedAt: null,
        vendorNote: note,
        declineReason:
          note ?? `${request.catalogItem.vendor?.name ?? 'The provider'} isn’t available then.`,
      },
    });

    await this.notifications.send({
      bookingId: request.bookingId,
      recipientEmail: request.requestedByEmail,
      type: 'REQUEST_CANCELLED',
      title: 'We couldn’t arrange it',
      body: `${request.catalogItem.name} — ${note ?? 'the provider isn’t available then'}. Speak to your concierge and we’ll find something.`,
      deepLink: `/status/${id}`,
    });

    await this.pusher.experienceStatusChanged(request.bookingId, {
      requestId: id,
      status: 'CANCELLED',
    });

    this.logger.log(`Vendor declined request ${id}`);
    return updated;
  }

  /**
   * The guest's answer to an offered time.
   *
   * Accepting moves the request onto the new slot and puts it back exactly
   * where a vendor-confirmed request sits, so the estate carries on as normal.
   */
  async respondToAlternative(id: string, accept: boolean, guestEmail: string) {
    const request = await this.load(id);
    if (!request.vendorProposedDate) {
      throw new BadRequestException('There is no alternative time to answer.');
    }

    if (!accept) {
      const updated = await this.prisma.experienceRequest.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          statusUpdatedAt: new Date(),
          vendorProposedDate: null,
          vendorProposedTime: null,
          declineReason: 'The guest preferred not to move it.',
        },
      });
      await this.pusher.experienceStatusChanged(request.bookingId, {
        requestId: id,
        status: 'CANCELLED',
      });
      return updated;
    }

    const now = new Date();
    const updated = await this.prisma.experienceRequest.update({
      where: { id },
      data: {
        preferredDate: request.vendorProposedDate,
        preferredTime: request.vendorProposedTime ?? request.preferredTime,
        confirmedDate: request.vendorProposedDate,
        confirmedTime: request.vendorProposedTime ?? request.confirmedTime,
        vendorConfirmedAt: now,
        vendorProposedDate: null,
        vendorProposedTime: null,
      },
    });

    // The estate still has to price and confirm it — accepting a time is not
    // accepting a cost, and the folio must not move without that.
    await this.notifications.send({
      bookingId: request.bookingId,
      recipientEmail:
        request.booking.primaryGuest.email ?? request.requestedByEmail,
      type: 'REQUEST_CONFIRMED',
      title: 'New time accepted',
      body: `${request.catalogItem.name} — ${guestEmail} took the later slot. The estate will confirm the price.`,
      deepLink: `/status/${id}`,
    });

    this.logger.log(`Guest accepted the alternative on request ${id}`);
    return updated;
  }

  /**
   * The gate.
   *
   * Called before anything tells a guest an experience is confirmed. An item
   * the estate runs itself has no vendor and passes straight through — this
   * only bites where somebody outside the villa has to turn up.
   */
  async assertVendorBooked(id: string) {
    const request = await this.load(id);
    if (!request.catalogItem.vendorId) return;
    if (request.vendorConfirmedAt) return;

    const vendor = request.catalogItem.vendor?.name ?? 'the provider';
    throw new BadRequestException(
      request.vendorAskedAt
        ? `${vendor} hasn’t come back yet. Record their answer before confirming this to the guest.`
        : `${vendor} hasn’t been asked yet. Ask them first — confirming now promises the guest something nobody has agreed to.`,
    );
  }
}
