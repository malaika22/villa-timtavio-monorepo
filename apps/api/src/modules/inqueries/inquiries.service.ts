// apps/api/src/inquiries/inquiries.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PusherService } from '../pusher/pusher.service';
import {
  CreateInquiryDto,
  ReviewInquiryDto,
  DeclineInquiryDto,
} from './dto/create-inquiry.dto';
import { Resend } from 'resend';
import { PrismaService } from '../../prisma/prisma.service';
import { getErrorMessage } from '../../commons/utils/error.util';
import {
  brandedEmail,
  emailButton,
  emailCopy,
  emailParagraph,
  emailRow,
  emailRows,
} from '../../common/email-template.util';

/** The estate's public lookbook. */
const LOOKBOOK_URL = 'https://www.villatimtavio.com/lookbook';

@Injectable()
export class InquiriesService {
  private readonly logger = new Logger(InquiriesService.name);
  private resend = new Resend(process.env.RESEND_API_KEY);

  constructor(
    private prisma: PrismaService,
    private pusherService: PusherService,
  ) {}

  // ─── Public: Submit inquiry from teaser website ───────────────────────────

  async submit(dto: CreateInquiryDto) {
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

    // Send internal alert email to Rodrigo
    await this.sendInternalAlertEmail(inquiry);

    // System alert in dashboard
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

    // Real-time push to Rodrigo's dashboard
    await this.pusherService.newInquiryToEm({
      inquiryId: inquiry.id,
      guestName: `${dto.firstName} ${dto.lastName}`,
      guestCount: dto.guestCount || 0,
      purposeOfStay: dto.purposeOfStay || 'Not specified',
      preferredDates:
        dto.preferredFrom && dto.preferredTo
          ? `${new Date(dto.preferredFrom).toLocaleDateString()} — ${new Date(dto.preferredTo).toLocaleDateString()}`
          : 'Dates not specified',
    });

    this.logger.log(`New inquiry from ${dto.email} — ${dto.purposeOfStay}`);

    return { success: true, message: 'Inquiry received' };
  }

  // ─── EM: find all inquiries ───────────────────────────────────────────────

  async findAll(status?: string) {
    return this.prisma.inquiry.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      throw new NotFoundException(`Inquiry ${id} not found`);
    }

    // If inquiry is converted, fetch the linked booking separately
    let linkedBooking = null;
    if (inquiry.convertedToBookingId) {
      linkedBooking = await this.prisma.booking.findUnique({
        where: { id: inquiry.convertedToBookingId },
        include: {
          primaryGuest: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              auth0Id: true,
            },
          },
        },
      });
    }

    return { ...inquiry, linkedBooking };
  }

  // ─── EM: Approve inquiry (passes vibe check) ──────────────────────────────

  async approve(id: string, dto: ReviewInquiryDto, reviewedBy: string) {
    const inquiry = await this.findOne(id);

    if (inquiry.status !== 'NEW') {
      throw new BadRequestException(
        `Inquiry is already ${inquiry.status.toLowerCase()}`,
      );
    }

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
      where: {
        entityType: 'Inquiry',
        entityId: id,
        isDismissed: false,
      },
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

    if (inquiry.status === 'CONVERTED') {
      throw new BadRequestException(
        'Cannot decline an inquiry that has been converted to a booking',
      );
    }

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
      where: {
        entityType: 'Inquiry',
        entityId: id,
        isDismissed: false,
      },
      data: {
        isDismissed: true,
        dismissedBy: reviewedBy,
        dismissedAt: new Date(),
      },
    });

    return updated;
  }

  // ─── EM: mark lookbook sent (after Rodrigo manually emails it) ───────────

  async markLookbookSent(id: string, markedBy: string) {
    await this.findOne(id);

    return this.prisma.inquiry.update({
      where: { id },
      data: {
        lookbookSentAt: new Date(),
        lookbookSentBy: markedBy,
      },
    });
  }

  // ─── EM: send the lookbook + payment link ────────────────────────────────
  // This is the guest's reservation confirmation. Nothing is emailed when the
  // Lodgify booking is created, so this single message carries the stay
  // details, the lookbook and the Stripe link that secures the reservation.

  async sendLookbookEmail(id: string, sentBy: string) {
    const inquiry = await this.findOne(id);

    const paymentLink = inquiry.stripePaymentLink?.trim();
    if (!paymentLink) {
      throw new BadRequestException(
        'Save the Stripe payment link before sending — it goes in the email.',
      );
    }

    const fmt = (d: Date | null) =>
      d
        ? d.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          })
        : null;

    const arrival = fmt(inquiry.preferredFrom);
    const departure = fmt(inquiry.preferredTo);

    const rows = [
      arrival ? emailRow('Arrival', arrival) : '',
      departure ? emailRow('Departure', departure) : '',
      inquiry.guestCount
        ? emailRow(
            'Guests',
            `${inquiry.guestCount} ${inquiry.guestCount === 1 ? 'guest' : 'guests'}`,
          )
        : '',
    ].join('');

    const html = brandedEmail({
      heading: `Welcome, ${inquiry.firstName}.`,
      body: [
        emailCopy([
          emailParagraph(
            'Your reservation at Villa TimTavio is confirmed. We are already preparing the estate for your arrival in Puerto Escondido.',
          ),
        ]),
        rows ? emailRows(rows) : '',
        emailCopy([
          emailParagraph(
            `Explore the estate in our lookbook — the villa, the suites, and the experiences we curate for each stay: <a href="${LOOKBOOK_URL}" style="color:#8c7261;">view the lookbook</a>.`,
          ),
          emailParagraph(
            'To secure your reservation, complete payment using the private link below.',
            { muted: true, small: true },
          ),
        ]),
        emailButton('Complete Your Reservation', paymentLink),
        emailCopy([
          emailParagraph(
            'Closer to your arrival we will send a private link to your guest portal, where you can introduce your party, choose rooms and share any preferences.',
            { small: true },
          ),
        ]),
      ].join(''),
      note: 'Should anything need attention before then, simply reply to this message — our estate team will take care of it.',
    });

    await this.resend.emails.send({
      from: process.env.EMAIL_FROM || 'reservations@villatimtavio.com',
      to: inquiry.email,
      subject: `Your Villa TimTavio reservation — ${inquiry.firstName}`,
      html,
    });

    this.logger.log(`Lookbook + payment email sent to ${inquiry.email}`);

    return this.prisma.inquiry.update({
      where: { id },
      data: { lookbookSentAt: new Date(), lookbookSentBy: sentBy },
    });
  }

  // ─── EM: mark payment link sent (logs the Stripe link for reference) ──────

  async markPaymentLinkSent(
    id: string,
    stripePaymentLink: string,
    markedBy: string,
  ) {
    await this.findOne(id);

    return this.prisma.inquiry.update({
      where: { id },
      data: {
        paymentLinkSentAt: new Date(),
        paymentLinkSentBy: markedBy,
        stripePaymentLink,
      },
    });
  }

  // ─── EM: delete inquiry ───────────────────────────────────────────────────

  async remove(id: string, deletedBy: string) {
    const inquiry = await this.findOne(id);

    if (inquiry.status === 'CONVERTED') {
      throw new BadRequestException(
        'Cannot delete an inquiry that has been converted to a booking',
      );
    }

    await this.prisma.systemAlert.updateMany({
      where: {
        entityType: 'Inquiry',
        entityId: id,
        isDismissed: false,
      },
      data: {
        isDismissed: true,
        dismissedBy: deletedBy,
        dismissedAt: new Date(),
      },
    });

    await this.prisma.inquiry.delete({ where: { id } });

    this.logger.log(`Inquiry ${id} deleted by ${deletedBy}`);

    return { success: true };
  }

  // ─── Most recent inquiry for an email (used to backfill a booking's guest
  //     name when Lodgify provides none) ────────────────────────────────────

  async findLatestByEmail(email: string) {
    return this.prisma.inquiry.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Link inquiry to booking after Lodgify webhook fires ─────────────────

  async linkToBooking(email: string, bookingId: string) {
    const result = await this.prisma.inquiry.updateMany({
      where: {
        email: { equals: email, mode: 'insensitive' },
        status: 'APPROVED',
      },
      data: {
        status: 'CONVERTED',
        convertedToBookingId: bookingId,
      },
    });

    if (result.count > 0) {
      this.logger.log(`Inquiry converted to booking ${bookingId} for ${email}`);
    }
  }

  // ─── Email helpers ────────────────────────────────────────────────────────

  private async sendHoldingEmail(email: string, firstName: string) {
    const logoUrl =
      process.env.EMAIL_LOGO_URL ??
      'https://www.villatimtavio.com/images/logo-dark.png';
    try {
      await this.resend.emails.send({
        from: `Villa TimTavio <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Your inquiry has been received — Villa TimTavio',
        html: `
          <style>
            @media only screen and (max-width:600px) {
              .tt-pad { padding-left:22px !important; padding-right:22px !important; }
              .tt-h1 { font-size:19px !important; }
              .tt-body { font-size:14px !important; line-height:1.65 !important; }
            }
          </style>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background-color:#f5f3f0;margin:0;padding:0;">
            <tr>
              <td align="center" style="padding:28px 12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                       style="max-width:560px;background-color:#ffffff;border:1px solid #e8e6e0;border-radius:10px;">
                  <tr>
                    <td align="center" class="tt-pad" style="padding:36px 32px 0 32px;">
                      <img src="${logoUrl}" alt="Villa TimTavio" width="132"
                           style="display:block;width:132px;max-width:60%;height:auto;margin:0 auto;" />
                    </td>
                  </tr>
                  <tr>
                    <td align="center" class="tt-pad" style="padding:16px 32px 0 32px;">
                      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:12px;
                                letter-spacing:0.2em;text-transform:uppercase;color:#8c7261;">
                        Villa TimTavio
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:18px 32px 0 32px;">
                      <div style="width:40px;height:2px;background-color:#c4a882;margin:0 auto;line-height:2px;font-size:0;">&nbsp;</div>
                    </td>
                  </tr>
                  <tr>
                    <td class="tt-pad" style="padding:24px 32px 8px 32px;font-family:Georgia,'Times New Roman',serif;">
                      <p class="tt-h1" style="margin:0 0 20px 0;font-size:20px;color:#0f1f2e;">Dear ${firstName},</p>
                      <p class="tt-body" style="margin:0 0 16px 0;font-size:15px;line-height:1.75;color:#5f5e5a;">
                        Your inquiry has been received by our Estate Management team.
                      </p>
                      <p class="tt-body" style="margin:0;font-size:15px;line-height:1.75;color:#5f5e5a;">
                        Due to the exclusive nature of Villa TimTavio, all requests are
                        subject to a private review. We will be in touch shortly.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td class="tt-pad" style="padding:28px 32px 36px 32px;">
                      <div style="border-top:1px solid #e8e6e0;padding-top:20px;">
                        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;
                                  font-size:13px;color:#b4b2a9;">
                          Villa TimTavio &middot; Puerto Escondido, Oaxaca
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send holding email to ${email}: ${getErrorMessage(error)}`,
      );
    }
  }

  private async sendInternalAlertEmail(inquiry: any) {
    if (!process.env.RODRIGO_EMAIL) return;

    try {
      const dates =
        inquiry.preferredFrom && inquiry.preferredTo
          ? `${new Date(inquiry.preferredFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${new Date(inquiry.preferredTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          : 'Not specified';

      await this.resend.emails.send({
        from: `Villa TimTavio System <${process.env.EMAIL_FROM}>`,
        to: (process.env.TO_EMAILS ?? process.env.RODRIGO_EMAIL ?? '')
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean),
        subject: `New inquiry — ${inquiry.firstName} ${inquiry.lastName} · ${inquiry.guestCount || '?'} guests`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; 
                      margin: 0 auto; color: #1A1A18;">
            <div style="background: #1A1A18; padding: 24px 28px; 
                        border-radius: 8px 8px 0 0;">
              <p style="font-size: 11px; font-weight: 500; 
                        letter-spacing: 0.18em; color: rgba(255,255,255,0.5); 
                        margin: 0 0 4px;">VILLA TIMTAVIO</p>
              <p style="font-size: 18px; color: white; margin: 0; 
                        font-family: Georgia, serif;">
                New inquiry received
              </p>
            </div>
            <div style="background: #F8F7F4; padding: 28px; 
                        border-radius: 0 0 8px 8px; 
                        border: 1px solid #E8E6E0; border-top: none;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E8E6E0; 
                              font-size: 12px; color: #888780; width: 140px; 
                              font-weight: 500; letter-spacing: 0.06em; 
                              text-transform: uppercase;">
                    Name
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E8E6E0; 
                              font-size: 14px; color: #1A1A18;">
                    ${inquiry.firstName} ${inquiry.lastName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E8E6E0; 
                              font-size: 12px; color: #888780; font-weight: 500; 
                              letter-spacing: 0.06em; text-transform: uppercase;">
                    Email
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E8E6E0; 
                              font-size: 14px; color: #1A1A18;">
                    ${inquiry.email}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E8E6E0; 
                              font-size: 12px; color: #888780; font-weight: 500; 
                              letter-spacing: 0.06em; text-transform: uppercase;">
                    Phone
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E8E6E0; 
                              font-size: 14px; color: #1A1A18;">
                    ${inquiry.phone || 'Not provided'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E8E6E0; 
                              font-size: 12px; color: #888780; font-weight: 500; 
                              letter-spacing: 0.06em; text-transform: uppercase;">
                    Dates
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E8E6E0; 
                              font-size: 14px; color: #1A1A18;">
                    ${dates}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E8E6E0; 
                              font-size: 12px; color: #888780; font-weight: 500; 
                              letter-spacing: 0.06em; text-transform: uppercase;">
                    Guests
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E8E6E0; 
                              font-size: 14px; color: #1A1A18;">
                    ${inquiry.guestCount || 'Not specified'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E8E6E0; 
                              font-size: 12px; color: #888780; font-weight: 500; 
                              letter-spacing: 0.06em; text-transform: uppercase;">
                    Purpose
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E8E6E0; 
                              font-size: 14px; color: #1A1A18;">
                    ${inquiry.purposeOfStay || 'Not specified'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E8E6E0; 
                              font-size: 12px; color: #888780; font-weight: 500; 
                              letter-spacing: 0.06em; text-transform: uppercase;">
                    Social
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #E8E6E0; 
                              font-size: 14px;">
                    ${
                      inquiry.socialHandle
                        ? `<a href="${inquiry.socialHandle.startsWith('http') ? inquiry.socialHandle : 'https://' + inquiry.socialHandle}" 
                               style="color: #1A1A18;">${inquiry.socialHandle}</a>`
                        : 'Not provided'
                    }
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 12px; color: #888780; 
                              font-weight: 500; letter-spacing: 0.06em; 
                              text-transform: uppercase; vertical-align: top;">
                    Message
                  </td>
                  <td style="padding: 10px 0; font-size: 14px; color: #1A1A18; 
                              line-height: 1.6;">
                    ${inquiry.message || 'No message provided'}
                  </td>
                </tr>
              </table>

              <a href="${process.env.DASHBOARD_URL}/inquiries/${inquiry.id}"
                 style="display: inline-block; margin-top: 28px; 
                        padding: 14px 28px; background: #1A1A18; color: white; 
                        text-decoration: none; border-radius: 7px; 
                        font-size: 12px; font-weight: 600; 
                        letter-spacing: 0.12em; text-transform: uppercase;">
                Review in Dashboard →
              </a>
            </div>
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
          <div style="font-family: Georgia, serif; max-width: 520px; 
                      margin: 0 auto; color: #1A1A18; padding: 40px 0;">
            <p style="font-size: 13px; font-weight: 500; 
                      letter-spacing: 0.18em; text-transform: uppercase; 
                      color: #888780; margin-bottom: 32px;">
              VILLA TIMTAVIO
            </p>
            <p style="font-size: 18px; font-weight: 300; margin-bottom: 24px;">
              Dear ${firstName},
            </p>
            <p style="font-size: 15px; line-height: 1.8; 
                      color: #5F5E5A; margin-bottom: 16px;">
              Thank you for your interest in Villa TimTavio.
            </p>
            <p style="font-size: 15px; line-height: 1.8; color: #5F5E5A;">
              At this time we are unable to accommodate your request. 
              We appreciate your understanding.
            </p>
            <div style="margin-top: 48px; padding-top: 24px; 
                        border-top: 1px solid #E8E6E0;">
              <p style="font-size: 13px; color: #B4B2A9; font-style: italic;">
                Villa TimTavio · Puerto Escondido, Oaxaca
              </p>
            </div>
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
