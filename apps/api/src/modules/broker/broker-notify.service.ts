import { Injectable, Logger } from '@nestjs/common';
import { BrokerHold } from '@prisma/client';
import { Resend } from 'resend';
import { PrismaService } from '../../prisma/prisma.service';
import {
  brandedEmail,
  emailCopy,
  emailParagraph,
  emailRow,
  emailRows,
} from '../../common/email-template.util';
import { HOLD_HOURS } from './broker.types';

const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const fmtMoney = (n: number) =>
  `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

/**
 * Everything a broker hold has to tell somebody.
 *
 * Inbound, to the estate: the dashboard bell so it's there when Rodrigo next
 * looks, and email because a 48-hour clock is already running and he may not
 * look today.
 *
 * Outbound, to the broker: that a hold they were given has been released.
 *
 * Nothing here is allowed to fail the action that triggered it. The broker has
 * been told the dates are theirs, or that they aren't any more, and neither
 * promise depends on our SMTP.
 */
@Injectable()
export class BrokerNotifyService {
  private readonly logger = new Logger(BrokerNotifyService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  constructor(private prisma: PrismaService) {}

  async holdPlaced(hold: BrokerHold): Promise<void> {
    await Promise.allSettled([this.alert(hold), this.email(hold)]);
  }

  /**
   * Telling the broker their dates are no longer held.
   *
   * The first mail this system sends to an address it did not vet. The
   * availability page needs no login and the email field is whatever a visitor
   * typed, so anyone can make the estate's domain send to an address of their
   * choosing — place a hold, wait for it to be resolved.
   *
   * Kept harmless by carrying nothing: no reply-to, and not a word of the
   * broker's note or the estate's release reason echoed back. What goes out is
   * the dates and the fact they are open again, so the worst use of it is
   * making us send someone a notice about a villa they never enquired about.
   *
   * The release reason is withheld for a second reason too — it is Rodrigo's
   * internal shorthand, written for the dashboard, and "test row" is not a
   * sentence to put in front of the broker it belongs to.
   */
  async holdReleased(hold: BrokerHold): Promise<void> {
    if (!hold.brokerEmail) {
      this.logger.log(`Hold ${hold.id} released — no broker email on record`);
      return;
    }
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn(
        `No RESEND_API_KEY — hold ${hold.id} release not mailed`,
      );
      return;
    }

    const html = brandedEmail({
      heading: 'Your held dates have been released',
      body: [
        emailCopy([
          emailParagraph(
            `The dates you were holding at Villa TimTavio are no longer reserved for you, and are open to other enquiries.`,
          ),
        ]),
        emailRows(
          [
            emailRow('Arrival', fmtDate(hold.checkIn)),
            emailRow('Departure', fmtDate(hold.checkOut)),
            emailRow('Nights', String(hold.nights)),
          ].join(''),
        ),
        emailCopy([
          emailParagraph(
            'If your client is still interested, the estate can talk it through — these dates may well still be available.',
            { small: true },
          ),
        ]),
      ].join(''),
      note: 'Villa TimTavio',
    });

    try {
      await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'reservations@villatimtavio.com',
        to: [hold.brokerEmail],
        subject: `Villa TimTavio — dates released, ${fmtDate(hold.checkIn)}`,
        html,
      });
      this.logger.log(`Release email sent for hold ${hold.id}`);
    } catch (error) {
      // Never rethrown: the hold is already released and the nights are
      // already sellable. A bounced notice must not undo that.
      this.logger.error(
        `Release email failed for ${hold.id}: ${String(error)}`,
      );
    }
  }

  private async alert(hold: BrokerHold): Promise<void> {
    try {
      await this.prisma.systemAlert.create({
        data: {
          severity: 'WARNING',
          title: 'Broker holding dates',
          message: `${hold.brokerName} · ${fmtDate(hold.checkIn)} → ${fmtDate(
            hold.checkOut,
          )} · ${hold.nights} nights · expires in ${HOLD_HOURS}h`,
          category: 'BOOKING',
          entityType: 'BrokerHold',
          entityId: hold.id,
        },
      });
    } catch (error) {
      this.logger.error(
        `Bell alert failed for hold ${hold.id}: ${String(error)}`,
      );
    }
  }

  private async email(hold: BrokerHold): Promise<void> {
    const to = (process.env.TO_EMAILS ?? process.env.RODRIGO_EMAIL ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!process.env.RESEND_API_KEY || to.length === 0) {
      this.logger.warn(
        `No email recipients configured — hold ${hold.id} not mailed`,
      );
      return;
    }

    const estimate =
      hold.estimatedTotal == null ? null : Number(hold.estimatedTotal);

    const rows = [
      emailRow('Broker', hold.brokerName),
      emailRow('Arrival', fmtDate(hold.checkIn)),
      emailRow('Departure', fmtDate(hold.checkOut)),
      emailRow('Nights', String(hold.nights)),
      estimate == null
        ? emailRow('Estimate', 'Not priced — no rate for those nights')
        : emailRow('Estimate', `${fmtMoney(estimate)} (indicative)`),
    ].join('');

    const html = brandedEmail({
      heading: 'A broker is holding dates',
      body: [
        emailCopy([
          emailParagraph(
            `${hold.brokerName} has held these dates while their client decides. The hold lapses on its own in ${HOLD_HOURS} hours if nothing is done.`,
          ),
        ]),
        emailRows(rows),
        hold.note
          ? emailCopy([
              emailParagraph(`Their note: “${hold.note}”`, {
                muted: true,
                small: true,
              }),
            ])
          : '',
        emailCopy([
          emailParagraph(
            'These nights are <strong>not</strong> blocked in Lodgify — a direct booking can still land on top of them. Confirm or release the hold from the dashboard.',
            { small: true },
          ),
        ]),
      ].join(''),
      note: 'Broker holds · Villa TimTavio',
    });

    try {
      await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'reservations@villatimtavio.com',
        to,
        subject: `Broker hold — ${hold.brokerName} · ${fmtDate(hold.checkIn)}`,
        html,
      });
    } catch (error) {
      this.logger.error(`Hold email failed for ${hold.id}: ${String(error)}`);
    }
  }
}
