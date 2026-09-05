import { CHRONOTYPE_WINDOWS, isChronotype, type ChronotypeName } from "./chronotype.ts";
import { bytesToBase64, type EmailAttachment } from "./resend.ts";

interface EmailVars {
  templateKey: string;
  campaignName: string;
  firstName: string;
  chronotype: string;
  peakHours: string;
}

interface ChronotypeCopy {
  article: "a" | "an";
  kicker: string;
  pattern: string;
  firstLabel: string;
  secondLabel: string;
}

const SITE = "https://conferences.restoreworklife.com";
const LOGO_SRC = `${SITE}/static/images/restore-wordmark-light.png`;
const LINKEDIN_URL = "https://www.linkedin.com/company/restore-enterprises-corporation";
const CONTACT_EMAIL = "michelle@restoreworklife.com";
const CONTACT_URL = `mailto:${CONTACT_EMAIL}`;
export const SCHEDULE_CID = "chronotype-schedule";
const NAVY = "#102539";
const LINK = "#2F6FED";
const TEXT = "#111111";

const COPY: Record<ChronotypeName, ChronotypeCopy> = {
  horizon: {
    article: "a",
    kicker: "You work best in the morning.",
    pattern:
      "with one large peak in the first half of the day and a smaller peak in the second half of the day",
    firstLabel: "main",
    secondLabel: "secondary",
  },
  apex: {
    article: "an",
    kicker: "You are aligned with the sun.",
    pattern:
      "with one large peak in the first half of the day and a smaller peak in the second half of the day",
    firstLabel: "main",
    secondLabel: "secondary",
  },
  aurora: {
    article: "an",
    kicker: "You work best in the afternoon.",
    pattern: "with one smaller peak late morning and your main peak in the evening",
    firstLabel: "energy building",
    secondLabel: "main",
  },
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function namedEvent(campaignName: string): string | null {
  const name = campaignName.trim();
  if (!name) return null;
  if (/^(restore|conference|default)$/i.test(name)) return null;
  return name;
}

function resolveChronotype(value: string): ChronotypeName {
  const key = value.trim().toLowerCase();
  return isChronotype(key) ? key : "apex";
}

function range(start: string, end: string): string {
  return `${start} - ${end}`;
}

function link(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="color:${LINK};text-decoration:underline;" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

export async function scheduleAttachment(chronotype: string): Promise<EmailAttachment> {
  const type = resolveChronotype(chronotype);
  const bytes = await Deno.readFile(new URL(`./assets/${type}-schedule.jpg`, import.meta.url));
  return {
    filename: `${type}-schedule.jpg`,
    content: bytesToBase64(bytes),
    content_id: SCHEDULE_CID,
    content_type: "image/jpeg",
    content_disposition: "inline",
  };
}

export function buildResultsEmail(vars: EmailVars): { subject: string; html: string } {
  const type = resolveChronotype(vars.chronotype);
  const copy = COPY[type];
  const windows = CHRONOTYPE_WINDOWS[type];
  const name = type.charAt(0).toUpperCase() + type.slice(1);
  const event = namedEvent(vars.campaignName) ||
    (vars.templateKey === "future-of-work" ? "Future of Work" : null);
  const firstName = vars.firstName.trim();
  const showName = firstName.length > 0 && firstName.toLowerCase() !== "there";
  const firstRange = range(windows.firstPeakStart, windows.firstPeakEnd);
  const secondRange = range(windows.secondPeakStart, windows.secondPeakEnd);
  const peakLine = `${name}: ${firstRange} (${copy.firstLabel}) and ${secondRange} (${copy.secondLabel})`;

  const intro = event
    ? `Thank you for demoing Restore at ${escapeHtml(event)}. We loved meeting you and hope your cognitive chronotype results sparked some insights into how <strong>you</strong> naturally work best.`
    : "Thank you for taking the Restore chronotype survey. We hope your results sparked some insights into how <strong>you</strong> naturally work best.";

  const preheader = `You are ${copy.article} ${name}. Peak windows: ${firstRange} and ${secondRange}.`;
  const subject = event
    ? `You Found Us at ${event}, Now Restore Your Workday`
    : "You Found Us, Now Restore Your Workday";

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<title>${escapeHtml(subject)}</title>
<!--[if gte mso 9]>
<xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
<![endif]-->
<style type="text/css">
  html,body{margin:0 !important;padding:0 !important;width:100% !important;height:100% !important;}
  *{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
  table{border-collapse:collapse !important;}
  img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;display:block;}
  a{color:${LINK};}
  @media only screen and (max-width: 660px) {
    .email-wrap{width:100% !important;max-width:100% !important;}
    .email-col{display:block !important;float:none !important;width:100% !important;max-width:100% !important;}
    .email-pad{padding-left:20px !important;padding-right:20px !important;}
    .email-schedule{width:100% !important;max-width:100% !important;height:auto !important;}
    .email-logo{width:220px !important;max-width:70% !important;height:auto !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;width:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background:#ffffff;">
  <tr>
    <td align="center" valign="top" style="margin:0;padding:0;">
      <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="660" align="center"><tr><td width="660"><![endif]-->
      <table role="presentation" class="email-wrap" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:660px;background:#ffffff;">
        <tr>
          <td align="center" class="email-pad" style="padding:20px 24px 12px;">
            <img class="email-logo" src="${LOGO_SRC}" width="240" alt="Restore" style="width:240px;max-width:70%;height:auto;">
          </td>
        </tr>
        <tr>
          <td align="center" valign="top" style="padding:0;font-size:0;text-align:center;">
            <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="660"><tr><td width="330" valign="top"><![endif]-->
            <div class="email-col" style="display:inline-block;width:100%;max-width:330px;vertical-align:top;text-align:left;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;">
              <tr>
                <td class="email-pad" valign="top" style="padding:8px 16px 16px 24px;font-family:Arial,Helvetica,sans-serif;color:${TEXT};font-size:15px;line-height:1.45;text-align:left;">
                  ${showName ? `<p style="margin:0 0 12px;">Hi ${escapeHtml(firstName)},</p>` : ""}
                  <p style="margin:0 0 12px;">${intro}</p>
                  <p style="margin:0 0 12px;">Here is more information about when your brain is at its most productive:</p>
                  <p style="margin:0 0 12px;">You are ${copy.article} <strong>${name}</strong>, ${copy.pattern}.</p>
                  <p style="margin:0 0 12px;"><strong>${escapeHtml(peakLine)}</strong></p>
                  <p style="margin:0;">These peaks are your windows for deep work, creative flow, and problem-solving. In the surrounding hours, prioritize administrative work, check-in meetings, and 10-minute breaks to reset your cognitive performance.</p>
                </td>
              </tr>
            </table>
            </div>
            <!--[if mso]></td><td width="330" valign="top"><![endif]-->
            <div class="email-col" style="display:inline-block;width:100%;max-width:330px;vertical-align:top;text-align:left;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;">
              <tr>
                <td class="email-pad" valign="top" style="padding:8px 20px 16px 10px;">
                  <img class="email-schedule" src="cid:${SCHEDULE_CID}" width="300" alt="${name} Schedule: ${firstRange} and ${secondRange}" style="display:block;width:100%;max-width:300px;height:auto;border:0;">
                </td>
              </tr>
            </table>
            </div>
            <!--[if mso]></td></tr></table><![endif]-->
          </td>
        </tr>
        <tr>
          <td align="left" valign="top" style="padding:0 0 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background:${NAVY};">
              <tr>
                <td class="email-pad" style="padding:18px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#ffffff;text-align:center;">
                  Restore is a B2B API that helps platforms increase productivity and measure burnout with energy-intelligent scheduling.
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="email-pad" align="left" style="padding:12px 24px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${TEXT};text-align:left;">
            <p style="margin:0 0 12px;"><strong>Join the future of work today.</strong></p>
            <p style="margin:0 0 10px;">1. ${link(LINKEDIN_URL, "Follow us on LinkedIn")} to join the movement.</p>
            <p style="margin:0 0 10px;">2. Contact us at ${link(CONTACT_URL, CONTACT_EMAIL)} to discuss how Restore can make your product or platform energy intelligent.</p>
            <p style="margin:0 0 18px;">3. Are you passionate about funding for the future of work, biotech, or life sciences? Email us at ${link(CONTACT_URL, CONTACT_EMAIL)} and we can talk more.</p>
            <p style="margin:0;">Best,<br>The Restore Team</p>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`;

  return { subject, html };
}

export function renderResultsEmail(vars: EmailVars): string {
  return buildResultsEmail(vars).html;
}
