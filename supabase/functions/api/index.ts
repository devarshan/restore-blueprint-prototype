import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { calculateChronotype } from "./chronotype.ts";
import { buildResultsEmail, scheduleAttachment } from "./emails.ts";
import { sendEmail } from "./resend.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const MAX_JSON_BYTES = 32 * 1024;
const LEAD_LIST_LIMIT = 200;
const LEAD_EXPORT_LIMIT = 5000;
const TRACK_INTERACTIONS = new Set(["view", "next", "back", "complete", "abandon"]);
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function text(body: string, status = 200, type = "text/plain"): Response {
  return new Response(body, { status, headers: { ...cors, "Content-Type": type } });
}

function db(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function adminTokenSecret(): string {
  return Deno.env.get("ADMIN_TOKEN_SECRET") || "";
}

async function requireAdmin(req: Request): Promise<Response | null> {
  const token = req.headers.get("x-admin-token") || "";
  const secret = adminTokenSecret();
  if (!token || !secret) return json({ error: "Unauthorized" }, 401);
  const [expRaw, signature] = token.split(".");
  const exp = Number(expRaw);
  if (!exp || Date.now() / 1000 > exp) return json({ error: "Unauthorized" }, 401);
  const expected = await hmac(secret, `admin:${exp}`);
  if (!timingSafeEqual(signature, expected)) return json({ error: "Unauthorized" }, 401);
  return null;
}

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "0.0.0.0";
}

async function hashIp(req: Request): Promise<string> {
  const salt = Deno.env.get("IP_HASH_SALT") || "restore-survey";
  return hmac(salt, clientIp(req));
}

async function allowRate(
  client: SupabaseClient,
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const { data, error } = await client.rpc("take_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_ms: windowMs,
  });
  if (error) {
    console.error("rate limit rpc", error.message);
    return false;
  }
  return data === true;
}

function searchNeedle(raw: string): string | null {
  const trimmed = raw.trim().slice(0, 80);
  if (!trimmed) return null;
  const safe = trimmed.replace(/[%_*,()\\]/g, " ").replace(/\s+/g, " ").trim();
  return safe || null;
}

async function readJson(req: Request): Promise<{ body: Record<string, unknown> } | Response> {
  const buffer = await req.arrayBuffer();
  if (buffer.byteLength > MAX_JSON_BYTES) return json({ error: "Payload too large" }, 413);
  try {
    const parsed = JSON.parse(new TextDecoder().decode(buffer)) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return json({ error: "Invalid JSON" }, 400);
    }
    return { body: parsed as Record<string, unknown> };
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
}

function clip(value: unknown, max: number): string {
  return String(value ?? "").slice(0, max);
}

function isValidEmail(email: string): boolean {
  return email.length > 0 && email.length <= 254 && EMAIL_RE.test(email);
}

async function getCampaign(client: SupabaseClient, slug: string) {
  const { data } = await client.from("campaigns").select("*").eq("slug", slug).maybeSingle();
  return data as { id: number; name: string; slug: string; email_template_key: string } | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = new URL(req.url);
  const path = url.pathname
    .replace(/^\/functions\/v1\/api/, "")
    .replace(/^\/api/, "") || "/";
  const client = db();
  const ipKey = await hashIp(req);

  try {
    if (req.method === "GET" && path.startsWith("/campaigns/") && !path.startsWith("/admin")) {
      const slug = decodeURIComponent(path.slice("/campaigns/".length)).slice(0, 80);
      const campaign = await getCampaign(client, slug);
      return json({ campaign });
    }

    if (req.method === "POST" && path === "/track/visitor") {
      if (!(await allowRate(client, `track:${ipKey}`, 60, 60_000))) return json({ error: "Too many requests" }, 429);
      const parsed = await readJson(req);
      if (parsed instanceof Response) return parsed;
      const body = parsed.body;
      const token = clip(body.visitorToken, 128);
      if (!token) return json({ error: "visitorToken required" }, 400);

      const { data: byToken } = await client.from("visitors").select("id").eq("visitor_token", token).maybeSingle();
      if (byToken?.id) {
        await client.from("visitors").update({
          last_seen_at: new Date().toISOString(),
          user_agent: clip(body.userAgent, 512) || null,
        }).eq("id", byToken.id);
        return json({ visitorId: byToken.id });
      }

      const fingerprint = clip(body.fingerprint, 128);
      if (fingerprint) {
        const { data: byPrint } = await client.from("visitors").select("id").eq("unique_device_fingerprint", fingerprint).maybeSingle();
        if (byPrint?.id) {
          await client.from("visitors").update({
            last_seen_at: new Date().toISOString(),
            visitor_token: token,
            user_agent: clip(body.userAgent, 512) || null,
          }).eq("id", byPrint.id);
          return json({ visitorId: byPrint.id });
        }
      }

      const utm = (body.utm && typeof body.utm === "object" && !Array.isArray(body.utm))
        ? body.utm as Record<string, unknown>
        : {};
      const { data: created, error } = await client.from("visitors").insert({
        visitor_token: token,
        unique_device_fingerprint: fingerprint || null,
        ip_hash: ipKey,
        user_agent: clip(body.userAgent, 512) || null,
        referrer_url: clip(body.referrerUrl, 500) || null,
        initial_utm_source: clip(utm.source, 120) || null,
        initial_utm_medium: clip(utm.medium, 120) || null,
        initial_utm_campaign: clip(utm.campaign, 120) || null,
        initial_utm_term: clip(utm.term, 120) || null,
        initial_utm_content: clip(utm.content, 120) || null,
      }).select("id").single();
      if (error) return json({ error: error.message }, 500);
      return json({ visitorId: created.id });
    }

    if (req.method === "POST" && path === "/track/event") {
      if (!(await allowRate(client, `track:${ipKey}`, 60, 60_000))) return json({ error: "Too many requests" }, 429);
      const parsed = await readJson(req);
      if (parsed instanceof Response) return parsed;
      const body = parsed.body;
      const interaction = String(body.interactionType || "");
      if (!TRACK_INTERACTIONS.has(interaction)) return json({ error: "Invalid interaction" }, 400);
      const campaign = await getCampaign(client, clip(body.campaignSlug || "conference", 80));
      if (!campaign) return json({ error: "Unknown campaign" }, 404);
      const { data: visitor } = await client.from("visitors").select("id").eq("visitor_token", clip(body.visitorToken, 128)).maybeSingle();
      if (!visitor?.id) return json({ ok: true });

      await client.from("survey_events").insert({
        visitor_id: visitor.id,
        campaign_id: campaign.id,
        current_step: Math.max(0, Math.min(50, Number(body.currentStep || 0))),
        total_steps: Math.max(0, Math.min(50, Number(body.totalSteps || 0))),
        time_spent_on_step_ms: Math.max(0, Math.min(3_600_000, Number(body.timeSpentOnStepMs || 0))),
        interaction_type: interaction,
        completed: Boolean(body.completed),
      });

      if (body.question) {
        await client.from("survey_answers").upsert({
          visitor_id: visitor.id,
          campaign_id: campaign.id,
          session_id: clip(body.sessionId, 128),
          step: Math.max(0, Math.min(50, Number(body.currentStep || 0))),
          question: clip(body.question, 200),
          answer: body.answer ?? null,
        }, { onConflict: "session_id,step,question" });
      }
      return json({ ok: true });
    }

    if (req.method === "POST" && path === "/survey-completion") {
      if (!(await allowRate(client, `complete:${ipKey}`, 10, 60 * 60 * 1000))) return json({ error: "Too many requests" }, 429);
      const parsed = await readJson(req);
      if (parsed instanceof Response) return parsed;
      const body = parsed.body;
      const email = clip(body.email, 254).toLowerCase().trim();
      if (!isValidEmail(email)) return json({ error: "Invalid email" }, 400);
      const answers = (body.allResponses && typeof body.allResponses === "object" && !Array.isArray(body.allResponses))
        ? body.allResponses as Record<string, unknown>
        : null;
      if (!answers) return json({ error: "Answers required" }, 400);

      const campaign = await getCampaign(client, clip(body.campaignSlug || "conference", 80));
      if (!campaign) return json({ error: "Unknown campaign" }, 404);
      const { data: visitor } = await client.from("visitors").select("id").eq("visitor_token", clip(body.visitorToken, 128)).maybeSingle();
      if (!visitor?.id) return json({ error: "Unknown visitor" }, 400);

      const computed = calculateChronotype(answers);
      const chronotype = computed.chronotype;
      const peakHours = computed.peakHours;
      const scoreFactors = computed.scoreFactors;
      const fullName = clip(body.fullName, 200).trim();

      const { data: existing } = await client.from("survey_completions")
        .select("id, resend_message_id, full_name")
        .eq("campaign_id", campaign.id)
        .eq("email", email)
        .maybeSingle();

      let completionId = existing?.id as number | undefined;
      let storedName = fullName;
      if (existing?.id) {
        completionId = existing.id;
        storedName = String(existing.full_name || fullName);
        if (existing.resend_message_id) {
          return json({ emailSent: true, completionId });
        }
        await client.from("survey_completions").update({
          chronotype,
          peak_hours: peakHours,
          score_factors: scoreFactors,
          all_responses: answers,
        }).eq("id", existing.id);
      } else {
        const { data: created, error } = await client.from("survey_completions").insert({
          visitor_id: visitor.id,
          campaign_id: campaign.id,
          session_id: clip(body.sessionId, 128),
          email,
          full_name: fullName || null,
          chronotype,
          peak_hours: peakHours,
          score_factors: scoreFactors,
          all_responses: answers,
        }).select("id").single();
        if (error) return json({ error: error.message }, 500);
        completionId = created.id;
      }

      const cap = Number(Deno.env.get("MONTHLY_EMAIL_CAP") || "1000");
      const start = new Date();
      start.setUTCDate(1);
      start.setUTCHours(0, 0, 0, 0);
      const { count } = await client.from("email_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "sent")
        .not("campaign_id", "is", null)
        .gte("timestamp", start.toISOString());
      if ((count || 0) >= cap) {
        await client.from("survey_completions").update({ email_status: "queued" }).eq("id", completionId);
        return json({ emailSent: false, completionId });
      }

      const from = Deno.env.get("RESEND_FROM") || "Restore <results@restoreworklife.com>";
      const firstName = storedName.split(" ")[0] || "there";
      const emailContent = buildResultsEmail({
        templateKey: campaign.email_template_key,
        campaignName: campaign.name,
        firstName,
        chronotype,
        peakHours,
      });
      const sent = await sendEmail({
        from,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        attachments: [await scheduleAttachment(chronotype)],
        tags: [
          { name: "campaign", value: campaign.slug },
          { name: "visitor_id", value: String(visitor.id) },
        ],
      });
      if (sent.error) {
        console.error("resend send failed", sent.error);
        const status = sent.error.includes("RESEND_API_KEY missing") ? "queued" : "failed";
        await client.from("survey_completions").update({ email_status: status }).eq("id", completionId);
        return json({ emailSent: false, completionId });
      }

      const messageId = sent.id as string;
      await client.from("survey_completions").update({
        resend_message_id: messageId,
        email_status: "sent",
      }).eq("id", completionId);
      await client.from("email_events").insert({
        recipient_email: email,
        campaign_id: campaign.id,
        resend_message_id: messageId,
        event_type: "sent",
      });
      return json({ emailSent: true, completionId });
    }

    const adminFail = path.startsWith("/admin") ? await requireAdmin(req) : null;
    if (path.startsWith("/admin") && path !== "/admin/login" && adminFail) return adminFail;

    if (req.method === "POST" && path === "/admin/login") {
      if (!(await allowRate(client, `login:${ipKey}`, 5, 15 * 60 * 1000))) return json({ error: "Too many requests" }, 429);
      const parsed = await readJson(req);
      if (parsed instanceof Response) return parsed;
      const passwordSecret = Deno.env.get("ADMIN_PASSWORD") || "";
      const tokenSecret = adminTokenSecret();
      const password = String(parsed.body.password || "");
      if (!passwordSecret || !tokenSecret) return json({ error: "Unauthorized" }, 401);
      const provided = await hmac("restore-login", password);
      const expected = await hmac("restore-login", passwordSecret);
      if (!timingSafeEqual(provided, expected)) return json({ error: "Unauthorized" }, 401);
      const expiresIn = 60 * 60 * 24;
      const exp = Math.floor(Date.now() / 1000) + expiresIn;
      const signature = await hmac(tokenSecret, `admin:${exp}`);
      return json({ token: `${exp}.${signature}`, expiresIn });
    }

    if (req.method === "GET" && path === "/admin/campaigns") {
      const { data } = await client.from("campaigns").select("*").order("created_at", { ascending: false });
      return json({ campaigns: data || [] });
    }

    if (req.method === "POST" && path === "/admin/campaigns") {
      const parsed = await readJson(req);
      if (parsed instanceof Response) return parsed;
      const slug = clip(parsed.body.slug, 80).toLowerCase();
      const { data, error } = await client.from("campaigns").upsert({
        name: clip(parsed.body.name, 120),
        slug,
        email_template_key: clip(parsed.body.emailTemplateKey || "default", 80),
      }, { onConflict: "slug" }).select("*").single();
      if (error) return json({ error: error.message }, 500);
      return json({ campaign: data });
    }

    if (req.method === "GET" && path === "/admin/overview") {
      const campaignSlug = url.searchParams.get("campaign");
      let campaignId: number | null = null;
      if (campaignSlug) {
        const campaign = await getCampaign(client, campaignSlug);
        campaignId = campaign?.id ?? -1;
      }
      const { data: stats, error: statsError } = await client.rpc("admin_overview_stats", {
        p_campaign_id: campaignId,
      });
      if (statsError) return json({ error: statsError.message }, 500);
      const payload = (typeof stats === "string" ? JSON.parse(stats) : stats || {}) as Record<string, unknown>;
      const started = Number(payload.started || 0);
      const completed = Number(payload.completed || 0);
      const cap = Number(Deno.env.get("MONTHLY_EMAIL_CAP") || "1000");
      const chronotypes = (payload.chronotypes || {}) as { horizon?: number; apex?: number; aurora?: number };
      const email = (payload.email || {}) as Record<string, number>;
      const sent = Number(email.sent || 0);
      const quotaUsed = Number(payload.quotaUsed || 0);
      return json({
        visitors: Number(payload.visitors || 0),
        started,
        completed,
        completionRate: started ? completed / started : 0,
        chronotypes: {
          horizon: Number(chronotypes.horizon || 0),
          apex: Number(chronotypes.apex || 0),
          aurora: Number(chronotypes.aurora || 0),
        },
        email: {
          sent,
          delivered: Number(email.delivered || 0),
          opened: Number(email.opened || 0),
          clicked: Number(email.clicked || 0),
          bounced: Number(email.bounced || 0),
          complaints: Number(email.complaints || 0),
          quotaUsed,
          quotaCap: cap,
        },
        dropOff: payload.dropOff || [],
        daily: payload.daily || [],
        devices: payload.devices || [],
        sources: payload.sources || [],
        emailStatus: payload.emailStatus || [],
        campaigns: payload.campaigns || [],
      });
    }

    if (req.method === "GET" && path === "/admin/leads") {
      const needle = searchNeedle(url.searchParams.get("q") || "");
      const campaignSlug = url.searchParams.get("campaign");
      let query = client
        .from("survey_completions")
        .select("*, campaigns(name, slug), visitors(user_agent, initial_utm_source, initial_utm_medium, initial_utm_campaign)")
        .order("created_at", { ascending: false })
        .limit(LEAD_LIST_LIMIT);
      if (campaignSlug) {
        const campaign = await getCampaign(client, campaignSlug);
        if (campaign) query = query.eq("campaign_id", campaign.id);
      }
      if (needle) {
        query = query.or(`email.ilike.%${needle}%,full_name.ilike.%${needle}%`);
      }
      const { data } = await query;
      return json({ leads: (data || []).map(mapLead) });
    }

    if (req.method === "GET" && path.startsWith("/admin/leads/") && path !== "/admin/leads/export") {
      const id = Number(path.split("/").pop());
      const { data: lead } = await client.from("survey_completions").select("*, campaigns(name, slug), visitors(*)").eq("id", id).single();
      if (!lead) return json({ error: "Not found" }, 404);
      const [{ data: answers }, { data: events }, { data: emailEvents }] = await Promise.all([
        client.from("survey_answers").select("*").eq("visitor_id", lead.visitor_id).order("created_at"),
        client.from("survey_events").select("*").eq("visitor_id", lead.visitor_id).order("timestamp"),
        client.from("email_events").select("*").eq("resend_message_id", lead.resend_message_id || "").order("timestamp"),
      ]);
      return json({
        lead: { ...mapLead(lead), all_responses: lead.all_responses, visitor_id: lead.visitor_id },
        answers: answers || [],
        events: events || [],
        emailEvents: emailEvents || [],
        visitor: lead.visitors,
      });
    }

    if (req.method === "GET" && path === "/admin/leads/export") {
      const campaignSlug = url.searchParams.get("campaign");
      let query = client
        .from("survey_completions")
        .select("*, campaigns(name, slug), visitors(initial_utm_source, initial_utm_medium, initial_utm_campaign)")
        .order("created_at", { ascending: false })
        .limit(LEAD_EXPORT_LIMIT);
      if (campaignSlug) {
        const campaign = await getCampaign(client, campaignSlug);
        if (campaign) query = query.eq("campaign_id", campaign.id);
      }
      const { data } = await query;
      const rows = [...(data || [])].reverse();
      const header = "email,name,campaign,chronotype,utm_source,utm_medium,utm_campaign,email_status,completed_at";
      const lines = rows.map((row) => [
        row.email,
        row.full_name,
        row.campaigns?.slug,
        row.chronotype,
        row.visitors?.initial_utm_source,
        row.visitors?.initial_utm_medium,
        row.visitors?.initial_utm_campaign,
        row.email_status,
        row.created_at,
      ].map(csv).join(","));
      return text([header, ...lines].join("\n"), 200, "text/csv");
    }

    return json({ error: "Not found" }, 404);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Server error" }, 500);
  }
});

function mapLead(row: Record<string, unknown>) {
  const campaign = row.campaigns as { name?: string; slug?: string } | null;
  const visitor = row.visitors as {
    user_agent?: string;
    initial_utm_source?: string;
    initial_utm_medium?: string;
    initial_utm_campaign?: string;
  } | null;
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    chronotype: row.chronotype,
    peak_hours: row.peak_hours,
    score_factors: Array.isArray(row.score_factors) ? row.score_factors : [],
    campaign_slug: campaign?.slug,
    campaign_name: campaign?.name,
    email_status: row.email_status,
    created_at: row.created_at,
    last_step: null,
    completed: true,
    utm_source: visitor?.initial_utm_source || null,
    utm_medium: visitor?.initial_utm_medium || null,
    utm_campaign: visitor?.initial_utm_campaign || null,
    device: visitor?.user_agent || null,
  };
}

function csv(value: unknown): string {
  const textValue = String(value ?? "");
  if (/[",\n]/.test(textValue)) return `"${textValue.replaceAll('"', '""')}"`;
  return textValue;
}
