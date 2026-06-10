import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  CreateInquiryDto,
  ReviewInquiryDto,
  DeclineInquiryDto,
} from './dto/create-inquiry.dto';
import { Resend } from 'resend';
import { PrismaService } from '../../prisma/prisma.service';
import { getErrorMessage, toError } from '../../commons/utils/error.util';

@Injectable()
export class InquiriesService {
  private readonly logger = new Logger(InquiriesService.name);
  private resend = new Resend(process.env.RESEND_API_KEY);

  constructor(private prisma: PrismaService) {}

  // ─── Public: Submit inquiry from teaser website ───────────────────────────

  async submit(dto: CreateInquiryDto) {
    console.log('HIT INQUIRIES POST');
    const inquiry = await this.prisma.inquiry.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        preferredFrom: dto.preferredFrom
          ? new Date(dto.preferredFrom)
          : undefined,
        preferredTo: dto.preferredTo ? new Date(dto.preferredTo) : undefined,
        guestCount: dto.guestCount,
        purposeOfStay: dto.purposeOfStay,
        socialHandle: dto.socialHandle,
        source: dto.source || 'Website',
        message: dto.message,
        status: 'NEW',
      },
    });

    // Send holding email to visitor
    await this.sendHoldingEmail(dto.email, dto.firstName);

    // Send alert to Rodrigo
    await this.sendInternalAlert(inquiry);

    // Create system alert in dashboard
    await this.prisma.systemAlert.create({
      data: {
        severity: 'WARNING',
        title: 'New inquiry received',
        message: `${dto.firstName} ${dto.lastName} · ${dto.guestCount || '?'} guests · ${dto.purposeOfStay || 'Purpose not specified'}`,
        category: 'BOOKING',
        entityType: 'Inquiry',
        entityId: inquiry.id,
      },
    });

    this.logger.log(`New inquiry from ${dto.email}`);
    return { success: true, message: 'Inquiry received' };
  }

  // ─── EM: Get all inquiries ────────────────────────────────────────────────

  async findAll(status?: string) {
    return this.prisma.inquiry.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundException(`Inquiry ${id} not found`);
    return inquiry;
  }

  // ─── EM: Approve inquiry (passes vibe check) ──────────────────────────────

  async approve(id: string, dto: ReviewInquiryDto, reviewedBy: string) {
    const inquiry = await this.findOne(id);

    const updated = await this.prisma.inquiry.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedBy,
        reviewedAt: new Date(),
        notes: dto.notes,
      },
    });

    // Dismiss the system alert
    await this.prisma.systemAlert.updateMany({
      where: { entityType: 'Inquiry', entityId: id, isDismissed: false },
      data: {
        isDismissed: true,
        dismissedBy: reviewedBy,
        dismissedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'BOOKING_UPDATED',
        entityType: 'Inquiry',
        entityId: id,
        performedBy: reviewedBy,
        performedByRole: 'estate_manager',
        metadata: { action: 'approved', notes: dto.notes } as any,
      },
    });

    this.logger.log(`Inquiry ${id} approved by ${reviewedBy}`);
    return updated;
  }

  // ─── EM: Decline inquiry ──────────────────────────────────────────────────

  async decline(id: string, dto: DeclineInquiryDto, reviewedBy: string) {
    const inquiry = await this.findOne(id);

    const updated = await this.prisma.inquiry.update({
      where: { id },
      data: {
        status: 'DECLINED',
        reviewedBy,
        reviewedAt: new Date(),
        declineReason: dto.declineReason,
      },
    });

    // Send polite decline email
    await this.sendDeclineEmail(inquiry.email, inquiry.firstName);

    await this.prisma.systemAlert.updateMany({
      where: { entityType: 'Inquiry', entityId: id, isDismissed: false },
      data: {
        isDismissed: true,
        dismissedBy: reviewedBy,
        dismissedAt: new Date(),
      },
    });

    return updated;
  }

  // ─── Link inquiry to booking after Lodgify sync ───────────────────────────

  async linkToBooking(email: string, bookingId: string) {
    await this.prisma.inquiry.updateMany({
      where: { email, status: 'APPROVED' },
      data: { status: 'CONVERTED', convertedToBookingId: bookingId },
    });
  }

  // ─── Email helpers ────────────────────────────────────────────────────────

  private async sendHoldingEmail(email: string, firstName: string) {
    try {
      await this.resend.emails.send({
        from: `Villa TimTavio <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Your inquiry has been received — Villa TimTavio',
        html: `
          <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #1A1A18;">
            <p style="font-size: 18px;">Dear ${firstName},</p>
            <p style="font-size: 15px; line-height: 1.7; color: #5F5E5A;">
              Your inquiry has been received by our Estate Management team.
            </p>
            <p style="font-size: 15px; line-height: 1.7; color: #5F5E5A;">
              Due to the exclusive nature of Villa TimTavio, all requests are 
              subject to a private review. We will contact you shortly.
            </p>
            <p style="font-size: 14px; color: #8A8880; margin-top: 32px;">
              Villa TimTavio<br>Puerto Escondido, Oaxaca
            </p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send holding email to ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async sendInternalAlert(inquiry: any) {
    try {
      const emails = process.env.TO_EMAILS?.split(',') || [];
      await this.resend.emails.send({
        from: `Villa TimTavio <${process.env.EMAIL_FROM}>`,
        to: emails,
        subject: `New Inquiry — ${inquiry.firstName} ${inquiry.lastName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
            <h2>New inquiry received</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; color: #888;">Name</td>
                  <td style="padding: 8px;">${inquiry.firstName} ${inquiry.lastName}</td></tr>
              <tr><td style="padding: 8px; color: #888;">Email</td>
                  <td style="padding: 8px;">${inquiry.email}</td></tr>
              <tr><td style="padding: 8px; color: #888;">Phone</td>
                  <td style="padding: 8px;">${inquiry.phone || 'Not provided'}</td></tr>
              <tr><td style="padding: 8px; color: #888;">Guests</td>
                  <td style="padding: 8px;">${inquiry.guestCount || 'Not specified'}</td></tr>
              <tr><td style="padding: 8px; color: #888;">Dates</td>
                  <td style="padding: 8px;">${inquiry.preferredFrom ? new Date(inquiry.preferredFrom).toLocaleDateString() : 'TBD'} — ${inquiry.preferredTo ? new Date(inquiry.preferredTo).toLocaleDateString() : 'TBD'}</td></tr>
              <tr><td style="padding: 8px; color: #888;">Purpose</td>
                  <td style="padding: 8px;">${inquiry.purposeOfStay || 'Not specified'}</td></tr>
              <tr><td style="padding: 8px; color: #888;">Social</td>
                  <td style="padding: 8px;">${inquiry.socialHandle || 'Not provided'}</td></tr>
              <tr><td style="padding: 8px; color: #888;">Message</td>
                  <td style="padding: 8px;">${inquiry.message || 'None'}</td></tr>
            </table>
            <a href="${process.env.DASHBOARD_URL}/inquiries/${inquiry.id}"
               style="display: inline-block; margin-top: 20px; padding: 12px 24px;
                      background: #1A1A18; color: white; text-decoration: none;
                      border-radius: 6px; font-size: 13px;">
              Review in Dashboard
            </a>
          </div>
        `,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send internal alert: ${getErrorMessage(error)}`,
      );
    }
  }

  private async sendDeclineEmail(email: string, firstName: string) {
    try {
      await this.resend.emails.send({
        from: `Villa TimTavio <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Villa TimTavio — Regarding Your Inquiry',
        html: `
          <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #1A1A18;">
            <p style="font-size: 18px;">Dear ${firstName},</p>
            <p style="font-size: 15px; line-height: 1.7; color: #5F5E5A;">
              Thank you for your interest in Villa TimTavio.
            </p>
            <p style="font-size: 15px; line-height: 1.7; color: #5F5E5A;">
              At this time we are unable to accommodate your request. 
              We appreciate your understanding.
            </p>
            <p style="font-size: 14px; color: #8A8880; margin-top: 32px;">
              Villa TimTavio<br>Puerto Escondido, Oaxaca
            </p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send decline email: ${getErrorMessage(error)}`,
      );
    }
  }
}
