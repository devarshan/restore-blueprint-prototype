export interface EmailAttachment {
  filename: string;
  content: string;
  content_id?: string;
  content_type?: string;
  content_disposition?: "inline" | "attachment";
}

interface SendEmailInput {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  tags?: Array<{ name: string; value: string }>;
  attachments?: EmailAttachment[];
}

interface SendEmailResult {
  id?: string;
  error?: string;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return { error: "RESEND_API_KEY missing" };

  const body: Record<string, unknown> = {
    from: input.from,
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    html: input.html,
    tags: input.tags,
  };
  if (input.attachments?.length) body.attachments = input.attachments;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json() as { id?: string; message?: string };
  if (!response.ok || !payload.id) {
    return { error: payload.message || "Resend send failed" };
  }
  return { id: payload.id };
}
