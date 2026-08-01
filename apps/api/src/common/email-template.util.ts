// The Villa TimTavio email shell.
//
// Lifted verbatim from the magic-link email, which is the estate's established
// look: the logo mark, the letterspaced serif wordmark beneath it, a gold rule,
// serif copy centred on a warm off-white card. Every guest-facing email routes
// through here so they are visibly the same house — a second, competing shell
// is how the confirmation email ended up looking like a different brand.

const LOGO_URL =
  process.env.EMAIL_LOGO_URL ||
  'https://www.villatimtavio.com/images/logo-dark.png';

export interface BrandedEmailOptions {
  /** Serif greeting, e.g. "Welcome, Malaika." */
  heading: string;
  /** Pre-rendered HTML for the card body — paragraphs, rows, buttons. */
  body: string;
  /** Small print above the footer rule. Optional. */
  note?: string;
}

/** Centred serif paragraph — the default voice of these emails. */
export function emailParagraph(
  text: string,
  opts: { muted?: boolean; small?: boolean } = {},
): string {
  const color = opts.muted ? '#8c7261' : '#5f5e5a';
  const size = opts.small ? '13px' : '15px';
  return `<p class="tt-body" style="margin:14px 0 0 0;font-size:${size};line-height:1.7;color:${color};">${text}</p>`;
}

/** Label/value row for stay details. Left label, right value. */
export function emailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:9px 0;font-family:Georgia,'Times New Roman',serif;color:#8c7261;font-size:14px;text-align:left;">${label}</td>
    <td align="right" style="padding:9px 0;font-family:Georgia,'Times New Roman',serif;color:#0f1f2e;font-size:14px;">${value}</td>
  </tr>`;
}

/** Wraps emailRow output in its table, boxed off by hairlines. */
export function emailRows(rows: string): string {
  return `<tr>
    <td class="tt-pad" style="padding:26px 32px 0 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="border-top:1px solid #e8e6e0;border-bottom:1px solid #e8e6e0;">
        ${rows}
      </table>
    </td>
  </tr>`;
}

/** The estate's call-to-action button. */
export function emailButton(label: string, href: string): string {
  return `<tr>
    <td align="center" style="padding:28px 24px 4px 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" class="tt-btn" style="margin:0 auto;">
        <tr>
          <td align="center" style="background-color:#0f1f2e;border-radius:8px;">
            <a href="${href}"
               style="display:inline-block;padding:15px 36px;color:#ffffff;text-decoration:none;
                      font-family:Arial,sans-serif;font-size:12px;font-weight:600;
                      letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap;">${label}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

export function brandedEmail({
  heading,
  body,
  note,
}: BrandedEmailOptions): string {
  return `
  <style>
    @media only screen and (max-width:600px) {
      .tt-pad { padding-left:22px !important; padding-right:22px !important; }
      .tt-h1 { font-size:19px !important; }
      .tt-body { font-size:14px !important; line-height:1.6 !important; }
      .tt-btn a { padding:14px 30px !important; }
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
              <img src="${LOGO_URL}" alt="Villa TimTavio" width="132"
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
            <td align="center" class="tt-pad" style="padding:24px 32px 0 32px;font-family:Georgia,'Times New Roman',serif;">
              <p class="tt-h1" style="margin:0 0 12px 0;font-size:20px;color:#0f1f2e;">${heading}</p>
            </td>
          </tr>
          ${body}
          ${
            note
              ? `<tr>
            <td align="center" class="tt-pad" style="padding:22px 32px 0 32px;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#b0a898;line-height:1.6;">${note}</p>
            </td>
          </tr>`
              : ''
          }
          <tr>
            <td class="tt-pad" style="padding:28px 32px 36px 32px;">
              <div style="border-top:1px solid #e8e6e0;padding-top:20px;text-align:center;">
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
  </table>`;
}

/** Centred serif copy block, for paragraphs between structural elements. */
export function emailCopy(paragraphs: string[]): string {
  return `<tr>
    <td align="center" class="tt-pad" style="padding:0 32px;font-family:Georgia,'Times New Roman',serif;">
      ${paragraphs.join('')}
    </td>
  </tr>`;
}
