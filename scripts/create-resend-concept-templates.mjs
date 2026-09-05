/**
 * Five marketing concept templates for Restore result emails.
 * Not wired to live sends. Marketing can keep, edit, or delete them in Resend.
 *
 *   node scripts/create-resend-concept-templates.mjs
 *   node scripts/create-resend-concept-templates.mjs --preview-only
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://conferences.restoreworklife.com";
const LOGO_ON_LIGHT = `${SITE}/static/images/restore-wordmark-light.png`;
const LOGO_ON_DARK = `${SITE}/static/images/restore-wordmark-dark.png`;
const LINKEDIN_URL = "https://www.linkedin.com/company/restore-enterprises-corporation";
const CONTACT_EMAIL = "michelle@restoreworklife.com";
const CONTACT_URL = `mailto:${CONTACT_EMAIL}`;
const TEST_TO = "devarshanpatel@gmail.com";

const DEFAULT_INTRO =
  "Thank you for taking the Restore chronotype survey. We hope your results sparked some insights into how <strong>you</strong> naturally work best.";

function loadEnvFile(path) {
  const env = {};
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const idx = trimmed.indexOf("=");
      env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // missing file is fine
  }
  return env;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fill(html, vars) {
  let out = html;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{{{${key}}}}`).join(value);
  }
  return out;
}

function head(title, extraCss = "") {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<title>${escapeHtml(title)}</title>
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
  ${extraCss}
</style>
</head>`;
}

function dossierHtml() {
  const paper = "#E7DCC8";
  const ink = "#1B1712";
  const rule = "#102539";
  const oxide = "#7E3A2C";
  return `${head("Classification: {{{CHRONOTYPE_NAME}}}", `
  @media only screen and (max-width: 640px) {
    .wrap{width:100% !important;max-width:100% !important;}
    .pad{padding-left:22px !important;padding-right:22px !important;}
    .sched{width:100% !important;max-width:100% !important;height:auto !important;}
  }
`)}
<body style="margin:0;padding:0;background:${paper};width:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${paper};opacity:0;">{{{PREHEADER}}}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${paper};">
  <tr>
    <td align="center" style="padding:28px 12px 40px;">
      <!--[if mso]><table role="presentation" width="560" align="center"><tr><td><![endif]-->
      <table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:${paper};">
        <tr>
          <td class="pad" style="padding:0 8px 18px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${oxide};">Field note · {{{CHRONOTYPE_NAME}}}</td>
                <td valign="middle" align="right">
                  <img src="${LOGO_ON_LIGHT}" width="132" alt="Restore" style="width:132px;height:auto;">
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 8px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${rule};border-bottom:1px solid ${rule};">
              <tr>
                <td class="pad" style="padding:18px 8px 16px;">
                  <p style="margin:0 0 8px;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${oxide};">Classification</p>
                  <p style="margin:0 0 6px;font-family:Georgia,'Iowan Old Style',Palatino,'Times New Roman',serif;font-size:42px;line-height:1;color:${rule};letter-spacing:-0.02em;">{{{CHRONOTYPE_NAME}}}</p>
                  <p style="margin:0;font-family:Georgia,Palatino,'Times New Roman',serif;font-size:16px;font-style:italic;color:${ink};">{{{CHRONOTYPE_KICKER}}}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:22px 8px 10px;font-family:Georgia,Palatino,'Times New Roman',serif;font-size:16px;line-height:1.55;color:${ink};">
            {{{GREETING}}}
            <p style="margin:0 0 14px;">{{{INTRO}}}</p>
            <p style="margin:0;">This file is not a personality type. It is a schedule: when your cognition is cheapest to spend, and when it is expensive. You are ${""}{{{CHRONOTYPE_ARTICLE}}} <strong>{{{CHRONOTYPE_NAME}}}</strong>, {{{CHRONOTYPE_PATTERN}}}.</p>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:16px 8px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${rule};">
              <tr>
                <td style="padding:10px;background:#102539;">
                  <img class="sched" src="{{{SCHEDULE_IMAGE_URL}}}" width="520" alt="{{{SCHEDULE_ALT}}}" style="width:100%;max-width:520px;height:auto;">
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:6px 8px 18px;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${rule};">
            Plate I · {{{CHRONOTYPE_NAME}}} day
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 8px 22px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${rule};">
              <tr>
                <td width="50%" valign="top" style="padding:14px 16px;border-right:1px solid ${rule};font-family:Georgia,Palatino,serif;color:${ink};">
                  <p style="margin:0 0 4px;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${oxide};">{{{FIRST_LABEL}}}</p>
                  <p style="margin:0;font-size:18px;line-height:1.25;">{{{FIRST_WINDOW}}}</p>
                </td>
                <td width="50%" valign="top" style="padding:14px 16px;font-family:Georgia,Palatino,serif;color:${ink};">
                  <p style="margin:0 0 4px;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${oxide};">{{{SECOND_LABEL}}}</p>
                  <p style="margin:0;font-size:18px;line-height:1.25;">{{{SECOND_WINDOW}}}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 8px 22px;font-family:Georgia,Palatino,'Times New Roman',serif;font-size:16px;line-height:1.55;color:${ink};">
            <p style="margin:0;">Hold deep work, invention, and hard decisions inside those windows. Put administration, status meetings, and ten-minute resets in the hours around them.</p>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 8px 10px;border-top:1px solid ${rule};">
            <p style="margin:16px 0 8px;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${oxide};">Correspondence</p>
            <p style="margin:0 0 8px;font-family:Georgia,Palatino,serif;font-size:15px;line-height:1.5;color:${ink};">
              If you build a product that schedules people, write <a href="${CONTACT_URL}" style="color:${rule};text-decoration:underline;">${CONTACT_EMAIL}</a>.
            </p>
            <p style="margin:0 0 18px;font-family:Georgia,Palatino,serif;font-size:15px;line-height:1.5;color:${ink};">
              <a href="${LINKEDIN_URL}" style="color:${rule};text-decoration:underline;">The Restore index on LinkedIn</a>
            </p>
            <p style="margin:0 0 6px;font-family:Georgia,Palatino,serif;font-size:15px;color:${ink};">The Restore desk</p>
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${oxide};">Concept 01 · The Dossier · not in live send</p>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`;
}

function atelierHtml() {
  const cream = "#F3EDE1";
  const ink = "#2C261C";
  const navy = "#102539";
  const hair = "#8FA9A6";
  return `${head("A note on your {{{CHRONOTYPE_NAME}}} map", `
  @media only screen and (max-width: 640px) {
    .wrap{width:100% !important;max-width:100% !important;}
    .pad{padding-left:24px !important;padding-right:24px !important;}
    .sched{width:100% !important;max-width:100% !important;height:auto !important;}
  }
`)}
<body style="margin:0;padding:0;background:${cream};width:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${cream};opacity:0;">{{{PREHEADER}}}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${cream};">
  <tr>
    <td align="center" style="padding:36px 16px 48px;">
      <!--[if mso]><table role="presentation" width="520" align="center"><tr><td><![endif]-->
      <table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:520px;">
        <tr>
          <td class="pad" style="padding:0 12px 28px;">
            <img src="${LOGO_ON_LIGHT}" width="118" alt="Restore" style="width:118px;height:auto;">
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 12px 22px;border-top:1px solid ${hair};">
            <p style="margin:22px 0 0;font-family:Georgia,'Iowan Old Style',Palatino,'Times New Roman',serif;font-size:28px;line-height:1.25;color:${navy};">We kept your map.</p>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 12px 18px;font-family:Georgia,Palatino,'Times New Roman',serif;font-size:17px;line-height:1.65;color:${ink};">
            <p style="margin:0 0 16px;">Dear {{{RECIPIENT_NAME}}},</p>
            <p style="margin:0 0 16px;">{{{INTRO}}}</p>
            <p style="margin:0 0 16px;">Most calendars treat every hour as the same metal. Yours is not. You are {{{CHRONOTYPE_ARTICLE}}} <strong>{{{CHRONOTYPE_NAME}}}</strong>, {{{CHRONOTYPE_PATTERN}}}.</p>
            <p style="margin:0;">Use the two windows below for the work that actually needs you. Let the rest of the day be shallower: mail, check-ins, a ten-minute walk.</p>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:8px 12px 20px;">
            <p style="margin:0 0 10px;font-family:Georgia,Palatino,serif;font-size:16px;line-height:1.5;color:${navy};"><strong>{{{FIRST_WINDOW}}}</strong> · {{{FIRST_LABEL}}}</p>
            <p style="margin:0;font-family:Georgia,Palatino,serif;font-size:16px;line-height:1.5;color:${navy};"><strong>{{{SECOND_WINDOW}}}</strong> · {{{SECOND_LABEL}}}</p>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 12px 8px;">
            <img class="sched" src="{{{SCHEDULE_IMAGE_URL}}}" width="496" alt="{{{SCHEDULE_ALT}}}" style="width:100%;max-width:496px;height:auto;">
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 12px 26px;font-family:Georgia,Palatino,serif;font-size:13px;font-style:italic;color:${hair};">
            Fig. 1 · Enclosure · {{{CHRONOTYPE_NAME}}} day
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 12px 8px;font-family:Georgia,Palatino,'Times New Roman',serif;font-size:17px;line-height:1.65;color:${ink};">
            <p style="margin:0 0 16px;">If you want to talk about putting this kind of map inside a product, reply to this letter. It comes to ${""}<a href="${CONTACT_URL}" style="color:${navy};text-decoration:underline;">${CONTACT_EMAIL}</a>.</p>
            <p style="margin:0 0 22px;">With care,<br>The Restore team</p>
            <p style="margin:0 0 14px;font-size:15px;">P.S. We keep a quieter stream on <a href="${LINKEDIN_URL}" style="color:${navy};text-decoration:underline;">LinkedIn</a>.</p>
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${hair};">Concept 02 · The Atelier · not in live send</p>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`;
}

function midnightHtml() {
  const night = "#08141C";
  const cream = "#E7DCC8";
  const brass = "#C4A36A";
  const mute = "#8EA8A9";
  return `${head("{{{CHRONOTYPE_NAME}}}. Two windows.", `
  @media only screen and (max-width: 640px) {
    .wrap{width:100% !important;max-width:100% !important;}
    .pad{padding-left:22px !important;padding-right:22px !important;}
    .sched{width:100% !important;max-width:100% !important;height:auto !important;}
    .name{font-size:44px !important;}
  }
`)}
<body style="margin:0;padding:0;background:${night};width:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${night};opacity:0;">{{{PREHEADER}}}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${night};">
  <tr>
    <td align="center" style="padding:0;">
      <!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->
      <table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${night};">
        <tr>
          <td class="pad" style="padding:28px 32px 18px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle">
                  <img src="${LOGO_ON_DARK}" width="128" alt="Restore" style="width:128px;height:auto;">
                </td>
                <td valign="middle" align="right" style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${brass};">Brief</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:12px 32px 6px;">
            <p class="name" style="margin:0;font-family:Georgia,'Iowan Old Style',Palatino,'Times New Roman',serif;font-size:56px;line-height:0.95;color:${cream};font-style:italic;letter-spacing:-0.03em;">{{{CHRONOTYPE_NAME}}}</p>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:10px 32px 22px;font-family:Georgia,Palatino,'Times New Roman',serif;font-size:18px;line-height:1.45;color:${mute};">
            {{{CHRONOTYPE_KICKER}}}
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 32px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:0 0 14px;border-left:2px solid ${brass};">
                  <p style="margin:0 0 2px 16px;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${brass};">{{{FIRST_LABEL}}}</p>
                  <p style="margin:0 0 0 16px;font-family:Georgia,Palatino,serif;font-size:22px;line-height:1.2;color:${cream};">{{{FIRST_WINDOW}}}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0;border-left:2px solid ${brass};">
                  <p style="margin:0 0 2px 16px;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${brass};">{{{SECOND_LABEL}}}</p>
                  <p style="margin:0 0 0 16px;font-family:Georgia,Palatino,serif;font-size:22px;line-height:1.2;color:${cream};">{{{SECOND_WINDOW}}}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 32px 18px;font-family:Georgia,Palatino,serif;font-size:16px;line-height:1.55;color:${cream};">
            <p style="margin:0 0 12px;">{{{INTRO}}}</p>
            <p style="margin:0;">Guard those two windows. Put shallow work everywhere else. You are {{{CHRONOTYPE_ARTICLE}}} {{{CHRONOTYPE_NAME}}}, {{{CHRONOTYPE_PATTERN}}}.</p>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:8px 32px 20px;">
            <img class="sched" src="{{{SCHEDULE_IMAGE_URL}}}" width="536" alt="{{{SCHEDULE_ALT}}}" style="width:100%;max-width:536px;height:auto;">
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:4px 32px 36px;">
            <p style="margin:0 0 18px;font-family:Georgia,Palatino,serif;font-size:16px;line-height:1.55;color:${mute};">If your product still treats people as flat hours, write us.</p>
            <p style="margin:0 0 6px;font-family:Georgia,Palatino,serif;font-size:16px;">
              <a href="${CONTACT_URL}" style="color:${brass};text-decoration:underline;">${CONTACT_EMAIL}</a>
            </p>
            <p style="margin:0 0 20px;font-family:Georgia,Palatino,serif;font-size:14px;">
              <a href="${LINKEDIN_URL}" style="color:${mute};text-decoration:underline;">LinkedIn</a>
            </p>
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${brass};">Concept 03 · Midnight Brief · not in live send</p>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`;
}

function plateHtml() {
  const wall = "#F6F1E7";
  const ink = "#1A1814";
  const navy = "#102539";
  const quiet = "#6B6458";
  return `${head("{{{CHRONOTYPE_NAME}}}, plotted", `
  @media only screen and (max-width: 640px) {
    .wrap{width:100% !important;max-width:100% !important;}
    .pad{padding-left:18px !important;padding-right:18px !important;}
    .sched{width:100% !important;max-width:100% !important;height:auto !important;}
  }
`)}
<body style="margin:0;padding:0;background:${wall};width:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${wall};opacity:0;">{{{PREHEADER}}}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${wall};">
  <tr>
    <td align="center" style="padding:44px 16px 52px;">
      <!--[if mso]><table role="presentation" width="560" align="center"><tr><td><![endif]-->
      <table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
        <tr>
          <td class="pad" align="center" style="padding:0 8px 28px;">
            <img src="${LOGO_ON_LIGHT}" width="108" alt="Restore" style="width:108px;height:auto;">
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 8px 14px;">
            <img class="sched" src="{{{SCHEDULE_IMAGE_URL}}}" width="544" alt="{{{SCHEDULE_ALT}}}" style="width:100%;max-width:544px;height:auto;">
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:10px 8px 6px;font-family:Georgia,'Iowan Old Style',Palatino,'Times New Roman',serif;font-size:22px;line-height:1.2;color:${navy};">
            {{{CHRONOTYPE_NAME}}}
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 8px 18px;font-family:'Courier New',Courier,monospace;font-size:12px;letter-spacing:0.04em;color:${quiet};">
            {{{FIRST_LABEL}}} {{{FIRST_WINDOW}}}<br>
            {{{SECOND_LABEL}}} {{{SECOND_WINDOW}}}
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 8px 22px;font-family:Georgia,Palatino,'Times New Roman',serif;font-size:16px;line-height:1.6;color:${ink};">
            <p style="margin:0 0 12px;">{{{INTRO}}}</p>
            <p style="margin:0;">You are {{{CHRONOTYPE_ARTICLE}}} <strong>{{{CHRONOTYPE_NAME}}}</strong>, {{{CHRONOTYPE_PATTERN}}}. Deep work belongs in the two windows. Administration, meetings, and short resets belong around them.</p>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:16px 8px 0;border-top:1px solid #D5CCBB;font-family:Georgia,Palatino,serif;font-size:14px;line-height:1.55;color:${quiet};">
            <p style="margin:14px 0 10px;">
              <a href="${CONTACT_URL}" style="color:${navy};text-decoration:underline;">${CONTACT_EMAIL}</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="${LINKEDIN_URL}" style="color:${navy};text-decoration:underline;">LinkedIn</a>
            </p>
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#A39886;">Concept 04 · The Plate · not in live send</p>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`;
}

function folioHtml() {
  const paper = "#F7F4EC";
  const navy = "#102539";
  const mist = "#B7C9C6";
  const ink = "#102539";
  return `${head("Folio: {{{CHRONOTYPE_NAME}}}", `
  @media only screen and (max-width: 640px) {
    .wrap{width:100% !important;max-width:100% !important;}
    .pad{padding-left:20px !important;padding-right:20px !important;}
    .rail{display:block !important;width:100% !important;max-width:100% !important;}
    .sched{width:100% !important;max-width:100% !important;height:auto !important;}
    .name{font-size:40px !important;}
  }
`)}
<body style="margin:0;padding:0;background:${paper};width:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${paper};opacity:0;">{{{PREHEADER}}}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${paper};">
  <tr>
    <td align="center" style="padding:0 0 36px;">
      <!--[if mso]><table role="presentation" width="640" align="center"><tr><td><![endif]-->
      <table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background:${paper};">
        <tr>
          <td style="background:${navy};padding:18px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle">
                  <img src="${LOGO_ON_DARK}" width="140" alt="Restore" style="width:140px;height:auto;">
                </td>
                <td valign="middle" align="right" style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#B7D0D1;">Folio · {{{CHRONOTYPE_NAME}}}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="font-size:0;text-align:left;padding:0;">
            <!--[if mso]><table role="presentation" width="640"><tr><td width="220" valign="top"><![endif]-->
            <div class="rail" style="display:inline-block;width:100%;max-width:220px;vertical-align:top;background:${mist};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="pad" style="padding:28px 22px 32px;">
                    <p style="margin:0 0 10px;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${navy};">Chronotype</p>
                    <p class="name" style="margin:0 0 14px;font-family:Georgia,'Iowan Old Style',Palatino,'Times New Roman',serif;font-size:46px;line-height:0.95;color:${navy};letter-spacing:-0.03em;">{{{CHRONOTYPE_NAME}}}</p>
                    <p style="margin:0;font-family:Georgia,Palatino,serif;font-size:14px;line-height:1.45;color:${navy};">{{{CHRONOTYPE_KICKER}}}</p>
                  </td>
                </tr>
              </table>
            </div>
            <!--[if mso]></td><td width="420" valign="top"><![endif]-->
            <div class="rail" style="display:inline-block;width:100%;max-width:420px;vertical-align:top;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="pad" style="padding:28px 28px 20px;font-family:Georgia,Palatino,'Times New Roman',serif;font-size:16px;line-height:1.55;color:${ink};">
                    <p style="margin:0 0 12px;">{{{INTRO}}}</p>
                    <p style="margin:0 0 12px;">Platforms still schedule people as if every hour were equal. Yours are not. You are {{{CHRONOTYPE_ARTICLE}}} <strong>{{{CHRONOTYPE_NAME}}}</strong>, {{{CHRONOTYPE_PATTERN}}}.</p>
                    <p style="margin:0 0 4px;"><strong>{{{FIRST_WINDOW}}}</strong> · {{{FIRST_LABEL}}}</p>
                    <p style="margin:0;"><strong>{{{SECOND_WINDOW}}}</strong> · {{{SECOND_LABEL}}}</p>
                  </td>
                </tr>
              </table>
            </div>
            <!--[if mso]></td></tr></table><![endif]-->
          </td>
        </tr>
        <tr>
          <td style="padding:0;background:${navy};">
            <img class="sched" src="{{{SCHEDULE_IMAGE_URL}}}" width="640" alt="{{{SCHEDULE_ALT}}}" style="width:100%;max-width:640px;height:auto;">
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:22px 28px 10px;font-family:Georgia,Palatino,serif;font-size:16px;line-height:1.55;color:${ink};">
            Deep work, invention, and hard calls belong in those two windows. Administration, check-ins, and ten-minute resets belong around them.
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:8px 28px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${navy};">
              <tr>
                <td style="padding:16px 0 0;font-family:'Courier New',Courier,monospace;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;line-height:1.8;color:${navy};">
                  01&nbsp;&nbsp;<a href="${LINKEDIN_URL}" style="color:${navy};text-decoration:underline;">Follow the work on LinkedIn</a><br>
                  02&nbsp;&nbsp;<a href="${CONTACT_URL}" style="color:${navy};text-decoration:underline;">Write ${CONTACT_EMAIL}</a><br>
                  03&nbsp;&nbsp;<a href="${CONTACT_URL}" style="color:${navy};text-decoration:underline;">Funding, biotech, life sciences</a>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0 0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#7A7568;">
                  Concept 05 · The Folio · not in live send
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`;
}

const CHRONOTYPES = {
  horizon: {
    article: "a",
    name: "Horizon",
    kicker: "You work best in the morning.",
    pattern: "with one large peak in the first half of the day and a smaller peak in the second half of the day",
    firstLabel: "main",
    secondLabel: "secondary",
    firstWindow: "7:30 AM - 10:00 AM",
    secondWindow: "2:00 PM - 4:00 PM",
    image: `${SITE}/static/images/email/horizon-schedule.jpg`,
    imageLight: `${SITE}/static/images/email/horizon-schedule-light.jpg`,
  },
  apex: {
    article: "an",
    name: "Apex",
    kicker: "You are aligned with the sun.",
    pattern: "with one large peak in the first half of the day and a smaller peak in the second half of the day",
    firstLabel: "main",
    secondLabel: "secondary",
    firstWindow: "9:00 AM - 11:30 AM",
    secondWindow: "3:30 PM - 5:30 PM",
    image: `${SITE}/static/images/email/apex-schedule.jpg`,
    imageLight: `${SITE}/static/images/email/apex-schedule-light.jpg`,
  },
  aurora: {
    article: "an",
    name: "Aurora",
    kicker: "You work best in the afternoon.",
    pattern: "with one smaller peak late morning and your main peak in the evening",
    firstLabel: "energy building",
    secondLabel: "main",
    firstWindow: "10:30 AM - 1:00 PM",
    secondWindow: "6:00 PM - 8:00 PM",
    image: `${SITE}/static/images/email/aurora-schedule.jpg`,
    imageLight: `${SITE}/static/images/email/aurora-schedule-light.jpg`,
  },
};

function sampleVars(type, firstName, event, introOverride, tone = "light") {
  const copy = CHRONOTYPES[type];
  const showName = firstName && firstName.toLowerCase() !== "there";
  const intro = introOverride || (event
    ? `Thank you for demoing Restore at ${escapeHtml(event)}. We loved meeting you and hope your cognitive chronotype results sparked some insights into how <strong>you</strong> naturally work best.`
    : DEFAULT_INTRO);
  return {
    RECIPIENT_NAME: firstName,
    GREETING: showName ? `<p style="margin:0 0 12px;">Hi ${escapeHtml(firstName)},</p>` : "",
    INTRO: intro,
    EVENT_NAME: event || " ",
    CHRONOTYPE_NAME: copy.name,
    CHRONOTYPE_ARTICLE: copy.article,
    CHRONOTYPE_KICKER: copy.kicker,
    CHRONOTYPE_PATTERN: copy.pattern,
    PEAK_LINE: `${copy.name}: ${copy.firstWindow} (${copy.firstLabel}) and ${copy.secondWindow} (${copy.secondLabel})`,
    FIRST_WINDOW: copy.firstWindow,
    SECOND_WINDOW: copy.secondWindow,
    FIRST_LABEL: copy.firstLabel,
    SECOND_LABEL: copy.secondLabel,
    SCHEDULE_IMAGE_URL: tone === "dark" ? copy.image : copy.imageLight,
    SCHEDULE_ALT: `${copy.name} Schedule: ${copy.firstWindow} and ${copy.secondWindow}`,
    PREHEADER: `You are ${copy.article} ${copy.name}. Peak windows: ${copy.firstWindow} and ${copy.secondWindow}.`,
  };
}

const CONCEPTS = [
  {
    key: "dossier",
    name: "Restore Concept: The Dossier",
    alias: "restore-concept-dossier",
    subject: "Classification: {{{CHRONOTYPE_NAME}}}",
    html: dossierHtml,
    sample: {
      type: "horizon",
      firstName: "Devarshan",
      event: null,
      intro: "The survey is filed. What follows is the usable part: when your mind is available, and when it is not.",
    },
  },
  {
    key: "atelier",
    name: "Restore Concept: The Atelier",
    alias: "restore-concept-atelier",
    subject: "A note on your {{{CHRONOTYPE_NAME}}} map",
    html: atelierHtml,
    sample: {
      type: "apex",
      firstName: "Devarshan",
      event: "Future of Work",
      intro: "We met at Future of Work. I kept the hours your mind asked for.",
    },
  },
  {
    key: "midnight",
    name: "Restore Concept: Midnight Brief",
    alias: "restore-concept-midnight",
    subject: "{{{CHRONOTYPE_NAME}}}. Two windows.",
    html: midnightHtml,
    sample: {
      type: "aurora",
      firstName: "Devarshan",
      event: null,
      intro: "Two windows. That is the whole result.",
    },
  },
  {
    key: "plate",
    name: "Restore Concept: The Plate",
    alias: "restore-concept-plate",
    subject: "{{{CHRONOTYPE_NAME}}}, plotted",
    html: plateHtml,
    sample: {
      type: "horizon",
      firstName: "Devarshan",
      event: null,
      intro: "A plot of when you are expensive to interrupt.",
    },
  },
  {
    key: "folio",
    name: "Restore Concept: The Folio",
    alias: "restore-concept-folio",
    subject: "Folio: {{{CHRONOTYPE_NAME}}}",
    html: folioHtml,
    sample: {
      type: "apex",
      firstName: "Devarshan",
      event: "Future of Work",
      intro: "You sat the survey at Future of Work. This is the chapter that matters: your hours, drawn.",
    },
  },
];

const VARIABLE_DEFS = [
  { key: "RECIPIENT_NAME", type: "string", fallback_value: "there" },
  { key: "GREETING", type: "string", fallback_value: " " },
  { key: "INTRO", type: "string", fallback_value: DEFAULT_INTRO },
  { key: "EVENT_NAME", type: "string", fallback_value: " " },
  { key: "CHRONOTYPE_NAME", type: "string", fallback_value: "Apex" },
  { key: "CHRONOTYPE_ARTICLE", type: "string", fallback_value: "an" },
  { key: "CHRONOTYPE_KICKER", type: "string", fallback_value: "You are aligned with the sun." },
  { key: "CHRONOTYPE_PATTERN", type: "string", fallback_value: "with one large peak in the first half of the day and a smaller peak in the second half of the day" },
  { key: "PEAK_LINE", type: "string", fallback_value: "Apex: 9:00 AM - 11:30 AM (main) and 3:30 PM - 5:30 PM (secondary)" },
  { key: "FIRST_WINDOW", type: "string", fallback_value: "9:00 AM - 11:30 AM" },
  { key: "SECOND_WINDOW", type: "string", fallback_value: "3:30 PM - 5:30 PM" },
  { key: "FIRST_LABEL", type: "string", fallback_value: "main" },
  { key: "SECOND_LABEL", type: "string", fallback_value: "secondary" },
  { key: "SCHEDULE_IMAGE_URL", type: "string", fallback_value: `${SITE}/static/images/email/apex-schedule.jpg` },
  { key: "SCHEDULE_ALT", type: "string", fallback_value: "Apex Schedule" },
  { key: "PREHEADER", type: "string", fallback_value: "Your Restore chronotype windows." },
];

async function resend(apiKey, method, path, body) {
  const response = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "restore-survey-concept-templates/1.0",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 400) };
  }
  return { status: response.status, json };
}

function writePreviews() {
  const dir = join(root, "scripts/email-concepts/previews");
  mkdirSync(dir, { recursive: true });
  const indexRows = [];
  for (const concept of CONCEPTS) {
    const vars = sampleVars(concept.sample.type, concept.sample.firstName, concept.sample.event, concept.sample.intro, concept.key === "midnight" ? "dark" : "light");
    const html = fill(concept.html(), vars);
    const file = join(dir, `${concept.key}.html`);
    writeFileSync(file, html);
    indexRows.push(`<p style="margin:0 0 12px;"><a href="${concept.key}.html">${concept.name}</a> · ${concept.sample.type}</p>`);
    console.log(`preview ${file}`);
  }
  writeFileSync(join(dir, "index.html"), `<!DOCTYPE html><html><body style="font-family:Georgia,serif;padding:32px;background:#f4efe6;">${indexRows.join("")}</body></html>`);
  return dir;
}

const previewOnly = process.argv.includes("--preview-only");
const previewDir = writePreviews();
if (previewOnly) {
  console.log(`preview_dir=${previewDir}`);
  process.exit(0);
}

const fileEnv = {
  ...loadEnvFile(join(root, ".env.supabase.local")),
  ...loadEnvFile(join(root, ".env.company.secrets")),
  ...loadEnvFile(join(root, ".env.resend.setup")),
};
const from = process.env.RESEND_FROM || fileEnv.RESEND_FROM || "Restore <results@restoreworklife.com>";
const apiKey = process.env.RESEND_API_KEY_FULL || fileEnv.RESEND_API_KEY_FULL || process.env.RESEND_API_KEY || fileEnv.RESEND_API_KEY;
if (!apiKey) {
  console.error("RESEND_API_KEY missing");
  process.exit(1);
}

const listed = await resend(apiKey, "GET", "/templates?limit=50");
console.log(`list_templates status=${listed.status} name=${listed.json?.name || ""} message=${listed.json?.message || ""}`);
if (listed.status >= 400) process.exit(1);

const existing = new Map();
for (const row of listed.json?.data || []) {
  existing.set(row.alias, row);
  console.log(`existing alias=${row.alias} id=${row.id} status=${row.status}`);
}

const created = [];
for (const concept of CONCEPTS) {
  const payload = {
    name: concept.name,
    alias: concept.alias,
    from,
    subject: concept.subject.includes("{{{") ? concept.subject.replace("{{{CHRONOTYPE_NAME}}}", "Apex") : concept.subject,
    html: concept.html(),
    variables: VARIABLE_DEFS,
  };
  const already = existing.get(concept.alias);
  let id = already?.id;
  if (already) {
    const updated = await resend(apiKey, "PATCH", `/templates/${already.id}`, payload);
    console.log(`update alias=${concept.alias} status=${updated.status} id=${updated.json?.id || already.id} message=${updated.json?.message || ""}`);
    id = updated.json?.id || already.id;
  } else {
    const made = await resend(apiKey, "POST", "/templates", payload);
    console.log(`create alias=${concept.alias} status=${made.status} id=${made.json?.id || ""} message=${made.json?.message || ""}`);
    id = made.json?.id;
  }
  if (!id) {
    created.push({ alias: concept.alias, status: "failed", message: "no id" });
    continue;
  }
  const published = await resend(apiKey, "POST", `/templates/${id}/publish`);
  console.log(`publish alias=${concept.alias} status=${published.status} id=${published.json?.id || id} message=${published.json?.message || ""}`);
  created.push({ alias: concept.alias, id, status: "published" });
}

const sent = [];
for (const concept of CONCEPTS) {
  const vars = sampleVars(concept.sample.type, concept.sample.firstName, concept.sample.event, concept.sample.intro, concept.key === "midnight" ? "dark" : "light");
  const subject = fill(concept.subject, vars);
  const result = await resend(apiKey, "POST", "/emails", {
    from,
    to: [TEST_TO],
    subject,
    template: {
      id: concept.alias,
      variables: vars,
    },
    tags: [
      { name: "campaign", value: "concept-preview" },
      { name: "concept", value: concept.key },
    ],
  });
  console.log(`send alias=${concept.alias} status=${result.status} id=${result.json?.id || ""} message=${result.json?.message || ""}`);
  sent.push({ alias: concept.alias, status: result.status, id: result.json?.id || null, subject });
}

console.log(JSON.stringify({ created, sent }, null, 2));
