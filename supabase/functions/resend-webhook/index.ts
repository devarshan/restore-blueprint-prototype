import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "svix-id, svix-timestamp, svix-signature, content-type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function hmacBase64(secretBytes: Uint8Array, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function secretBytes(secret: string): Uint8Array {
  const raw = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  try {
    return Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  } catch {
    return new TextEncoder().encode(secret);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const body = await req.text();
  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET") || "";
  const id = req.headers.get("svix-id") || "";
  const timestamp = req.headers.get("svix-timestamp") || "";
  const signatureHeader = req.headers.get("svix-signature") || "";

  if (!secret || !id || !timestamp || !signatureHeader) {
    return json({ error: "Invalid webhook" }, 400);
  }

  const expected = await hmacBase64(secretBytes(secret), `${id}.${timestamp}.${body}`);
  const signatures = signatureHeader.split(" ").map((part) => part.replace(/^v1,/, ""));
  if (!signatures.includes(expected)) {
    return json({ error: "Invalid signature" }, 400);
  }

  const event = JSON.parse(body) as {
    type?: string;
    data?: {
      email_id?: string;
      to?: string[];
      bounce?: { type?: string };
      click?: { link?: string };
    };
  };

  const map: Record<string, string> = {
    "email.delivered": "delivered",
    "email.opened": "opened",
    "email.clicked": "clicked",
    "email.complained": "complaint",
  };
  let eventType = map[event.type || ""];
  if (event.type === "email.bounced" && event.data?.bounce?.type === "Permanent") {
    eventType = "permanent_fail";
  }
  if (!eventType) return json({ ok: true });

  const client = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  const messageId = event.data?.email_id || "";
  const recipient = event.data?.to?.[0] || "";
  const { data: completion } = await client
    .from("survey_completions")
    .select("id, campaign_id")
    .eq("resend_message_id", messageId)
    .maybeSingle();

  await client.from("email_events").insert({
    recipient_email: recipient,
    campaign_id: completion?.campaign_id ?? null,
    resend_message_id: messageId,
    event_type: eventType,
    url_clicked: event.data?.click?.link || null,
  });

  if (completion?.id) {
    await client.from("survey_completions").update({ email_status: eventType }).eq("id", completion.id);
  }

  return json({ ok: true });
});
