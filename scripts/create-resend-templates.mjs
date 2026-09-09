/**
 * Bootstrap Restore chronotype templates in Resend.
 * Requires RESEND_API_KEY with Full access (sending-access keys cannot create templates).
 *
 *   RESEND_API_KEY=... node scripts/create-resend-templates.mjs
 *   RESEND_API_KEY=... node scripts/create-resend-templates.mjs --send
 *
 * Keep this HTML in lockstep with supabase/functions/api/emails.ts.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://conferences.restoreworklife.com";
const LOGO_SRC = `${SITE}/static/images/restore-wordmark-light.png`;
const LINKEDIN_URL = "https://www.linkedin.com/company/restore-enterprises-corporation";
const NEWSLETTER_URL = `${SITE}/newsletter`;
const CONTACT_EMAIL = "michelle@restoreworklife.com";
const CONTACT_URL = `mailto:${CONTACT_EMAIL}`;
const NAVY = "#102539";
const LINK = "#2F6FED";
const TEXT = "#111111";
const TEST_TO = "devarshanpatel@gmail.com";
const PRODUCT_LINE =
  "Restore is a workplace solution that brings energy-intelligent scheduling to the workplace. Using calendar and energy insights, we help reduce burnout, protect focus time, and improve sustainable performance.";
const DEFAULT_INTRO =
  "Thank you for taking the Restore chronotype survey. We hope your results sparked some insights into how <strong>you</strong> naturally work best.";
const RESULTS_EMAIL_SUBJECT = "Restore: Your workday has a rhythm. Here's yours:";

const COPY = {
  horizon: {
    article: "a",
    name: "Horizon",
    pattern:
      "with one large peak in the first half of the day and a smaller peak in the second half of the day",
    firstLabel: "main",
    secondLabel: "secondary",
    firstPeakStart: "7:30 AM",
    firstPeakEnd: "10:00 AM",
    secondPeakStart: "2:00 PM",
    secondPeakEnd: "4:00 PM",
  },
  apex: {
    article: "an",
    name: "Apex",
    pattern:
      "with one large peak in the first half of the day and a smaller peak in the second half of the day",
    firstLabel: "main",
    secondLabel: "secondary",
    firstPeakStart: "9:00 AM",
    firstPeakEnd: "11:30 AM",
    secondPeakStart: "3:30 PM",
    secondPeakEnd: "5:30 PM",
  },
  aurora: {
    article: "an",
    name: "Aurora",
    pattern: "with one smaller peak late morning and your main peak in the evening",
    firstLabel: "energy building",
    secondLabel: "main",
    firstPeakStart: "10:30 AM",
    firstPeakEnd: "1:00 PM",
    secondPeakStart: "6:00 PM",
    secondPeakEnd: "8:00 PM",
  },
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function link(href, label) {
  return `<a href="${escapeHtml(href)}" style="color:${LINK};text-decoration:underline;" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function templateHtml(type) {
  const copy = COPY[type];
  const firstRange = `${copy.firstPeakStart} - ${copy.firstPeakEnd}`;
  const secondRange = `${copy.secondPeakStart} - ${copy.secondPeakEnd}`;
  const peakLine = `${copy.name}: ${firstRange} (${copy.firstLabel}) and ${secondRange} (${copy.secondLabel})`;
  const preheader = `You are ${copy.article} ${copy.name} Chronotype. Peak windows: ${firstRange} and ${secondRange}.`;
  const scheduleAlt = `${copy.name} Schedule: ${firstRange} and ${secondRange}`;
  const subject = RESULTS_EMAIL_SUBJECT;
  return `<!DOCTYPE html>
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
                  {{{GREETING}}}
                  <p style="margin:0 0 12px;">{{{INTRO}}}</p>
                  <p style="margin:0 0 12px;">Here is more information about when your brain is at its most productive:</p>
                  <p style="margin:0 0 12px;">You are ${copy.article} <strong>${copy.name} Chronotype</strong>, ${copy.pattern}.</p>
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
                  <img class="email-schedule" src="{{{SCHEDULE_IMAGE_URL}}}" width="300" alt="${escapeHtml(scheduleAlt)}" style="display:block;width:100%;max-width:300px;height:auto;border:0;">
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
                  ${PRODUCT_LINE}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="email-pad" align="left" style="padding:12px 24px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${TEXT};text-align:left;">
            <p style="margin:0 0 12px;"><strong>Join the future of work today.</strong></p>
            <p style="margin:0 0 10px;">1. ${link(LINKEDIN_URL, "Follow us on LinkedIn")} to join the movement.</p>
            <p style="margin:0 0 10px;">2. ${link(NEWSLETTER_URL, "Sign up for our newsletter")}.</p>
            <p style="margin:0 0 18px;">3. Contact us at ${link(CONTACT_URL, CONTACT_EMAIL)} to discuss how Restore can make your product or platform energy intelligent.</p>
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
}

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

async function resend(apiKey, method, path, body) {
  const response = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "restore-survey-template-setup/1.0",
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

const TEMPLATES = [
  { type: "apex", name: "Restore Apex schedule", alias: "restore-apex-schedule" },
  { type: "aurora", name: "Restore Aurora schedule", alias: "restore-aurora-schedule" },
  { type: "horizon", name: "Restore Horizon schedule", alias: "restore-horizon-schedule" },
];

if (process.argv.includes("--dump")) {
  const dir = "/tmp/restore-email-templates";
  mkdirSync(dir, { recursive: true });
  for (const spec of TEMPLATES) {
    const file = join(dir, `${spec.type}.html`);
    writeFileSync(file, templateHtml(spec.type));
    console.log(`dump ${file}`);
  }
  process.exit(0);
}

async function sendChronotypeTests(apiKey, fromAddress) {
  const firstName = "Devarshan";
  const greeting = `<p style="margin:0 0 12px;">Hi ${firstName},</p>`;
  const sent = [];
  for (const spec of TEMPLATES) {
    const result = await resend(apiKey, "POST", "/emails", {
      from: fromAddress,
      to: [TEST_TO],
      template: {
        id: spec.alias,
        variables: {
          GREETING: greeting,
          INTRO: DEFAULT_INTRO,
          RECIPIENT_NAME: firstName,
          EVENT_NAME: " ",
          SCHEDULE_IMAGE_URL: `${SITE}/static/images/email/${spec.type}-schedule.jpg`,
        },
      },
      tags: [
        { name: "campaign", value: "copy-review" },
        { name: "chronotype", value: spec.type },
      ],
    });
    console.log(`send alias=${spec.alias} status=${result.status} id=${result.json?.id || ""} message=${result.json?.message || ""}`);
    sent.push({ alias: spec.alias, status: result.status, id: result.json?.id || null });
  }
  console.log(JSON.stringify({ sent }, null, 2));
  return sent;
}

const fileEnv = {
  ...loadEnvFile(join(root, ".env.supabase.local")),
  ...loadEnvFile(join(root, ".env.company.secrets")),
  ...loadEnvFile(join(root, ".env.resend.setup")),
};
const from = process.env.RESEND_FROM || fileEnv.RESEND_FROM || "Restore <results@restoreworklife.com>";
const keyCandidates = [
  process.env.RESEND_API_KEY_FULL,
  fileEnv.RESEND_API_KEY_FULL,
  fileEnv.RESEND_API_KEY_FULL_ALT,
  process.env.RESEND_API_KEY,
  fileEnv.RESEND_API_KEY,
].filter((value, index, all) => value && all.indexOf(value) === index);

if (!keyCandidates.length) {
  console.error("RESEND_API_KEY missing");
  process.exit(1);
}

if (process.argv.includes("--send-only")) {
  await sendChronotypeTests(keyCandidates[0], from);
  process.exit(0);
}

let apiKey = "";
let listed = { status: 0, json: {} };
for (const candidate of keyCandidates) {
  const probe = await resend(candidate, "GET", "/templates?limit=50");
  console.log(`list_templates prefix=${candidate.slice(0, 6)} len=${candidate.length} status=${probe.status} name=${probe.json?.name || ""} message=${probe.json?.message || ""}`);
  listed = probe;
  apiKey = candidate;
  if (probe.status < 400) break;
  if (probe.status === 401 && /restricted/i.test(probe.json?.message || probe.json?.name || "")) {
    continue;
  }
  if (probe.status === 401) continue;
}
if (!apiKey || listed.status >= 400) {
  console.error("no usable full-access Resend key");
  process.exit(1);
}
const existing = new Map();
for (const row of listed.json?.data || []) {
  existing.set(row.alias, row);
  existing.set(row.name, row);
  console.log(`existing id=${row.id} alias=${row.alias} name=${row.name} status=${row.status}`);
}

function templatePayload(spec) {
  return {
    name: spec.name,
    alias: spec.alias,
    from,
    subject: RESULTS_EMAIL_SUBJECT,
    html: templateHtml(spec.type),
    variables: [
      { key: "GREETING", type: "string", fallback_value: " " },
      { key: "INTRO", type: "string", fallback_value: DEFAULT_INTRO },
      { key: "RECIPIENT_NAME", type: "string", fallback_value: "there" },
      { key: "EVENT_NAME", type: "string", fallback_value: " " },
      { key: "SCHEDULE_IMAGE_URL", type: "string", fallback_value: `${SITE}/static/images/email/${spec.type}-schedule.jpg` },
    ],
  };
}

const created = [];
for (const spec of TEMPLATES) {
  const already = existing.get(spec.alias);
  const payload = templatePayload(spec);
  const saved = already
    ? await resend(apiKey, "PATCH", `/templates/${already.id}`, payload)
    : await resend(apiKey, "POST", "/templates", payload);
  console.log(`${already ? "update" : "create"} alias=${spec.alias} status=${saved.status} id=${saved.json?.id || already?.id || ""} message=${saved.json?.message || ""}`);
  const id = saved.json?.id || already?.id;
  if (id) {
    const published = await resend(apiKey, "POST", `/templates/${id}/publish`);
    console.log(`publish alias=${spec.alias} status=${published.status} id=${published.json?.id || id} message=${published.json?.message || ""}`);
    created.push({ ...spec, id, status: "published" });
  } else {
    created.push({ ...spec, id: null, status: "failed", message: saved.json?.message || saved.json?.name });
  }
}

const verify = await resend(apiKey, "GET", "/templates?limit=50");
console.log(`verify_list status=${verify.status}`);
for (const row of verify.json?.data || []) {
  console.log(`verify id=${row.id} alias=${row.alias} name=${row.name} status=${row.status}`);
}
console.log(JSON.stringify({ created }, null, 2));

if (process.argv.includes("--send")) {
  await sendChronotypeTests(apiKey, from);
}
