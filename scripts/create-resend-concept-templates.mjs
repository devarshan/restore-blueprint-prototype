/**
 * Restore result email concepts. Same brand as the survey: navy, mist, the real clock.
 *
 * Writes HTML previews by default.
 *   node scripts/create-resend-concept-templates.mjs
 *   node scripts/create-resend-concept-templates.mjs --send
 *   node scripts/create-resend-concept-templates.mjs --publish
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
const NAVY = "#102539";
const MIST = "#bee1e3";
const MUTED = "#5a6b75";
const FONT = "Arial,Helvetica,sans-serif";

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

function head(title) {
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
  a{color:${NAVY};}
  @media only screen and (max-width: 640px) {
    .wrap{width:100% !important;max-width:100% !important;}
    .pad{padding-left:20px !important;padding-right:20px !important;}
    .sched{width:100% !important;max-width:100% !important;height:auto !important;}
    .rail{display:block !important;width:100% !important;max-width:100% !important;}
    .hours{font-size:28px !important;line-height:1.15 !important;}
  }
</style>
</head>`;
}

function pills() {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 4px;">
    <tr>
      <td style="padding:10px 14px;background:${MIST};border-radius:12px;font-family:${FONT};font-size:14px;font-weight:700;color:${NAVY};">{{{FIRST_WINDOW}}}</td>
    </tr>
  </table>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding:10px 14px;background:${MIST};border-radius:12px;font-family:${FONT};font-size:14px;font-weight:700;color:${NAVY};">{{{SECOND_WINDOW}}}</td>
    </tr>
  </table>`;
}

function footerLinks(onDark) {
  const color = onDark ? MIST : NAVY;
  return `<p style="margin:0 0 8px;font-family:${FONT};font-size:14px;line-height:1.5;">
    <a href="${LINKEDIN_URL}" style="color:${color};text-decoration:underline;">LinkedIn</a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="${CONTACT_URL}" style="color:${color};text-decoration:underline;">${CONTACT_EMAIL}</a>
  </p>`;
}

function whiteHtml() {
  return `${head("Your {{{CHRONOTYPE_NAME}}} hours")}
<body style="margin:0;padding:0;background:#f4f6f7;width:100%;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f6f7;opacity:0;">{{{PREHEADER}}}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f7;">
  <tr>
    <td align="center" style="padding:28px 12px 40px;">
      <table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;">
        <tr>
          <td class="pad" style="padding:28px 28px 8px;">
            <img src="${LOGO_ON_LIGHT}" width="132" alt="Restore" style="width:132px;height:auto;">
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:16px 28px 8px;font-family:${FONT};font-size:26px;line-height:1.2;font-weight:700;color:${NAVY};">
            {{{CHRONOTYPE_NAME}}}
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 28px 16px;font-family:${FONT};font-size:16px;line-height:1.45;color:${MUTED};">
            {{{CHRONOTYPE_KICKER}}}
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 28px 16px;font-family:${FONT};font-size:15px;line-height:1.55;color:${NAVY};">
            {{{GREETING}}}
            <p style="margin:0;">{{{INTRO}}}</p>
          </td>
        </tr>
        <tr>
          <td align="center" class="pad" style="padding:8px 20px 16px;">
            <img class="sched" src="{{{SCHEDULE_IMAGE_URL}}}" width="400" alt="{{{SCHEDULE_ALT}}}" style="width:100%;max-width:400px;height:auto;">
          </td>
        </tr>
        <tr>
          <td class="pad" align="center" style="padding:0 28px 20px;">
            ${pills()}
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 28px 20px;font-family:${FONT};font-size:15px;line-height:1.55;color:${NAVY};">
            Hold deep work inside those windows. Put meetings, admin, and a ten-minute reset around them.
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:16px 28px 24px;background:${NAVY};font-family:${FONT};font-size:14px;line-height:1.5;color:#ffffff;">
            Restore is a B2B API for energy-intelligent scheduling.
            ${footerLinks(true)}
            <p style="margin:12px 0 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${MIST};">White</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function mistHtml() {
  return `${head("{{{CHRONOTYPE_NAME}}}. {{{CHRONOTYPE_KICKER}}}")}
<body style="margin:0;padding:0;background:${MIST};width:100%;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${MIST};opacity:0;">{{{PREHEADER}}}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${MIST};">
  <tr>
    <td align="center" style="padding:0 0 36px;">
      <table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${MIST};">
        <tr>
          <td class="pad" style="padding:28px 28px 8px;">
            <img src="${LOGO_ON_LIGHT}" width="132" alt="Restore" style="width:132px;height:auto;">
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:20px 28px 4px;font-family:${FONT};font-size:34px;line-height:1.1;font-weight:700;color:${NAVY};">
            {{{CHRONOTYPE_NAME}}}
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 28px 20px;font-family:${FONT};font-size:18px;line-height:1.4;color:${NAVY};">
            {{{CHRONOTYPE_KICKER}}}
          </td>
        </tr>
        <tr>
          <td style="padding:0;background:#ffffff;">
            <img class="sched" src="{{{SCHEDULE_IMAGE_URL}}}" width="560" alt="{{{SCHEDULE_ALT}}}" style="width:100%;max-width:560px;height:auto;">
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:22px 28px 8px;background:#ffffff;font-family:${FONT};font-size:15px;line-height:1.55;color:${NAVY};">
            {{{GREETING}}}
            <p style="margin:0 0 12px;">{{{INTRO}}}</p>
            <p style="margin:0 0 16px;">You are {{{CHRONOTYPE_ARTICLE}}} <strong>{{{CHRONOTYPE_NAME}}}</strong>, {{{CHRONOTYPE_PATTERN}}}.</p>
            <p style="margin:0 0 6px;font-weight:700;">{{{FIRST_WINDOW}}} · {{{FIRST_LABEL}}}</p>
            <p style="margin:0 0 16px;font-weight:700;">{{{SECOND_WINDOW}}} · {{{SECOND_LABEL}}}</p>
            <p style="margin:0 0 18px;">Deep work in those hours. Admin and check-ins around them.</p>
            ${footerLinks(false)}
            <p style="margin:12px 0 8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">Mist</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function hoursHtml() {
  return `${head("{{{FIRST_WINDOW}}}")}
<body style="margin:0;padding:0;background:#ffffff;width:100%;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#ffffff;opacity:0;">{{{PREHEADER}}}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:32px 16px 48px;">
      <table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
        <tr>
          <td class="pad" style="padding:0 8px 20px;">
            <img src="${LOGO_ON_LIGHT}" width="120" alt="Restore" style="width:120px;height:auto;">
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 8px 6px;font-family:${FONT};font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">
            {{{CHRONOTYPE_NAME}}}
          </td>
        </tr>
        <tr>
          <td class="pad hours" style="padding:0 8px 8px;font-family:${FONT};font-size:36px;line-height:1.1;font-weight:700;color:${NAVY};">
            {{{FIRST_WINDOW}}}
          </td>
        </tr>
        <tr>
          <td class="pad hours" style="padding:0 8px 18px;font-family:${FONT};font-size:36px;line-height:1.1;font-weight:700;color:${NAVY};">
            {{{SECOND_WINDOW}}}
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 8px 16px;font-family:${FONT};font-size:16px;line-height:1.5;color:${NAVY};">
            {{{CHRONOTYPE_KICKER}}} You are {{{CHRONOTYPE_ARTICLE}}} {{{CHRONOTYPE_NAME}}}, {{{CHRONOTYPE_PATTERN}}}.
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 8px 16px;">
            <img class="sched" src="{{{SCHEDULE_IMAGE_URL}}}" width="280" alt="{{{SCHEDULE_ALT}}}" style="width:100%;max-width:280px;height:auto;">
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 8px 16px;font-family:${FONT};font-size:15px;line-height:1.55;color:${NAVY};">
            {{{INTRO}}}
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 8px;">
            ${footerLinks(false)}
            <p style="margin:12px 0 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">Hours</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function nightHtml() {
  return `${head("{{{CHRONOTYPE_NAME}}}")}
<body style="margin:0;padding:0;background:${NAVY};width:100%;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${NAVY};opacity:0;">{{{PREHEADER}}}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${NAVY};">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:${NAVY};">
        <tr>
          <td class="pad" style="padding:24px 24px 8px;">
            <img src="${LOGO_ON_DARK}" width="128" alt="Restore" style="width:128px;height:auto;">
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:8px 24px 4px;font-family:${FONT};font-size:32px;line-height:1.1;font-weight:700;color:#ffffff;">
            {{{CHRONOTYPE_NAME}}}
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 24px 14px;font-family:${FONT};font-size:16px;color:${MIST};">
            {{{CHRONOTYPE_KICKER}}}
          </td>
        </tr>
        <tr>
          <td align="center" class="pad" style="padding:0 24px 12px;">
            <img class="sched" src="{{{SCHEDULE_IMAGE_URL}}}" width="320" alt="{{{SCHEDULE_ALT}}}" style="width:100%;max-width:320px;height:auto;">
          </td>
        </tr>
        <tr>
          <td class="pad" align="center" style="padding:0 24px 16px;">
            ${pills()}
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:0 24px 28px;font-family:${FONT};font-size:14px;line-height:1.5;color:#ffffff;">
            Deep work in those windows.
            ${footerLinks(true)}
            <p style="margin:12px 0 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${MIST};">Night</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function splitHtml() {
  return `${head("You are {{{CHRONOTYPE_ARTICLE}}} {{{CHRONOTYPE_NAME}}}")}
<body style="margin:0;padding:0;background:#f4f6f7;width:100%;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f6f7;opacity:0;">{{{PREHEADER}}}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f7;">
  <tr>
    <td align="center" style="padding:24px 10px 40px;">
      <table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background:#ffffff;">
        <tr>
          <td class="pad" colspan="2" style="padding:22px 24px 12px;">
            <img src="${LOGO_ON_LIGHT}" width="132" alt="Restore" style="width:132px;height:auto;">
          </td>
        </tr>
        <tr>
          <td valign="top" class="rail" style="width:50%;padding:8px 12px 16px 24px;font-family:${FONT};color:${NAVY};">
            {{{GREETING}}}
            <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">{{{INTRO}}}</p>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">You are {{{CHRONOTYPE_ARTICLE}}} <strong>{{{CHRONOTYPE_NAME}}}</strong>, {{{CHRONOTYPE_PATTERN}}}.</p>
            <p style="margin:0 0 14px;font-size:15px;line-height:1.5;">Deep work in these windows. Admin and breaks around them.</p>
            ${pills()}
          </td>
          <td valign="top" class="rail" style="width:50%;padding:8px 20px 16px 8px;">
            <img class="sched" src="{{{SCHEDULE_IMAGE_URL}}}" width="280" alt="{{{SCHEDULE_ALT}}}" style="width:100%;max-width:280px;height:auto;">
          </td>
        </tr>
        <tr>
          <td class="pad" colspan="2" style="padding:16px 24px 22px;background:${NAVY};font-family:${FONT};font-size:14px;line-height:1.5;color:#ffffff;">
            Restore is a B2B API for energy-intelligent scheduling.
            ${footerLinks(true)}
            <p style="margin:12px 0 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${MIST};">Split</p>
          </td>
        </tr>
      </table>
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
  },
};

function sampleVars(type, firstName, event) {
  const copy = CHRONOTYPES[type];
  const showName = firstName && firstName.toLowerCase() !== "there";
  const intro = event
    ? `Thank you for demoing Restore at ${escapeHtml(event)}. We loved meeting you and hope your cognitive chronotype results sparked some insights into how <strong>you</strong> naturally work best.`
    : DEFAULT_INTRO;
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
    SCHEDULE_IMAGE_URL: copy.image,
    SCHEDULE_ALT: `${copy.name} Schedule: ${copy.firstWindow} and ${copy.secondWindow}`,
    PREHEADER: `You are ${copy.article} ${copy.name}. Peak windows: ${copy.firstWindow} and ${copy.secondWindow}.`,
  };
}

const CONCEPTS = [
  { key: "dossier", name: "Restore White", alias: "restore-concept-dossier", subject: "Your {{{CHRONOTYPE_NAME}}} hours", html: whiteHtml, sample: { type: "horizon", firstName: "Devarshan", event: null } },
  { key: "atelier", name: "Restore Mist", alias: "restore-concept-atelier", subject: "{{{CHRONOTYPE_NAME}}}. {{{CHRONOTYPE_KICKER}}}", html: mistHtml, sample: { type: "apex", firstName: "Devarshan", event: "Future of Work" } },
  { key: "plate", name: "Restore Hours", alias: "restore-concept-plate", subject: "{{{FIRST_WINDOW}}}", html: hoursHtml, sample: { type: "horizon", firstName: "Devarshan", event: null } },
  { key: "midnight", name: "Restore Night", alias: "restore-concept-midnight", subject: "{{{CHRONOTYPE_NAME}}}", html: nightHtml, sample: { type: "aurora", firstName: "Devarshan", event: null } },
  { key: "folio", name: "Restore Split", alias: "restore-concept-folio", subject: "You are {{{CHRONOTYPE_ARTICLE}}} {{{CHRONOTYPE_NAME}}}", html: splitHtml, sample: { type: "apex", firstName: "Devarshan", event: "Future of Work" } },
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
      "User-Agent": "restore-survey-concept-templates/2.0",
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
    const vars = sampleVars(concept.sample.type, concept.sample.firstName, concept.sample.event);
    const html = fill(concept.html(), vars);
    const file = join(dir, `${concept.key}.html`);
    writeFileSync(file, html);
    indexRows.push(`<p style="margin:0 0 10px;font-family:Arial,sans-serif;"><a href="${concept.key}.html">${concept.name}</a></p>`);
    console.log(`preview ${file}`);
  }
  writeFileSync(join(dir, "index.html"), `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:32px;background:#f4f6f7;">${indexRows.join("")}</body></html>`);
  return dir;
}

const previewDir = writePreviews();
const shouldSend = process.argv.includes("--send") || process.argv.includes("--publish");
if (!shouldSend) {
  console.log(`preview_dir=${previewDir}`);
  console.log("wrote previews. pass --send to email tests, --publish to update Resend.");
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

if (process.argv.includes("--publish")) {
  const listed = await resend(apiKey, "GET", "/templates?limit=50");
  console.log(`list_templates status=${listed.status} message=${listed.json?.message || ""}`);
  const existing = new Map();
  for (const row of listed.json?.data || []) existing.set(row.alias, row);
  for (const concept of CONCEPTS) {
    const payload = {
      name: concept.name,
      alias: concept.alias,
      from,
      subject: fill(concept.subject, sampleVars("apex", "there", null)),
      html: concept.html(),
      variables: VARIABLE_DEFS,
    };
    const already = existing.get(concept.alias);
    const saved = already
      ? await resend(apiKey, "PATCH", `/templates/${already.id}`, payload)
      : await resend(apiKey, "POST", "/templates", payload);
    console.log(`${already ? "update" : "create"} alias=${concept.alias} status=${saved.status} message=${saved.json?.message || ""}`);
    const id = saved.json?.id || already?.id;
    if (id) {
      const published = await resend(apiKey, "POST", `/templates/${id}/publish`);
      console.log(`publish alias=${concept.alias} status=${published.status}`);
    }
  }
}

if (process.argv.includes("--send")) {
  const sent = [];
  for (const concept of CONCEPTS) {
    const vars = sampleVars(concept.sample.type, concept.sample.firstName, concept.sample.event);
    const subject = `v2 ${concept.name.replace("Restore ", "")}: ${fill(concept.subject, vars)}`;
    const result = await resend(apiKey, "POST", "/emails", {
      from,
      to: [TEST_TO],
      subject,
      html: fill(concept.html(), vars),
      tags: [
        { name: "campaign", value: "concept-v2" },
        { name: "concept", value: concept.key },
      ],
    });
    console.log(`send alias=${concept.alias} status=${result.status} id=${result.json?.id || ""} message=${result.json?.message || ""}`);
    sent.push({ alias: concept.alias, status: result.status, id: result.json?.id || null, subject });
  }
  console.log(JSON.stringify({ sent }, null, 2));
}
