# Restore Survey

Chronotype survey for conference campaigns. Completions save to Supabase. Result email is sent with Resend. Campaigns and leads are managed at `/admin`.

## Stack

- Vite + React
- Supabase project `zpsizielqjyalntojrbk` (Postgres + Edge Functions)
- Resend
- Vercel project `restore-worklife/restore-survey`
- GitHub `devarshan/restore-survey`
- Production site: https://conferences.restoreworklife.com

## Local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set the three `VITE_*` values in `.env.local` from the Restoreworklife Supabase project (`zpsizielqjyalntojrbk`). There is no fallback project. Missing vars fail at startup.

- `VITE_SUPABASE_URL=https://zpsizielqjyalntojrbk.supabase.co`
- `VITE_SERVER_URL=https://zpsizielqjyalntojrbk.supabase.co/functions/v1/api`
- `VITE_SUPABASE_ANON_KEY` from that same project's anon/publishable key

Open http://localhost:3000/?campaign=conference

Admin: http://localhost:3000/admin-login

## Edge Function secrets

Configure these on Supabase project `zpsizielqjyalntojrbk`. Do not put them in the repo.

- `ADMIN_PASSWORD`
- `ADMIN_TOKEN_SECRET`
- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- `RESEND_FROM`
- `RESEND_TEMPLATE_APEX` (optional; defaults to alias `restore-apex-schedule`)
- `RESEND_TEMPLATE_AURORA` (optional; defaults to alias `restore-aurora-schedule`)
- `RESEND_TEMPLATE_HORIZON` (optional; defaults to alias `restore-horizon-schedule`)
- `IP_HASH_SALT`
- `MONTHLY_EMAIL_CAP`

Result emails are sent with Resend Templates. Marketing picks the design per campaign in Admin → Campaigns → Result email, then Save campaign. Next completions on that campaign use that design.

- Current: **Restore Apex schedule**, **Restore Aurora schedule**, **Restore Horizon schedule** (dark clock).
- Concepts: **The Dossier**, **The Atelier**, **The Plate**, **The Folio** (paper, light plates) and **Midnight Brief** (dark).

To edit copy, open [Resend Templates](https://resend.com/templates), change the template, then **Publish**. Unpublished drafts do not affect live sends.

Creating or listing templates via the API needs a Resend Full access key. The production `RESEND_API_KEY` can stay sending-access. After a dashboard edit, click **Publish**. Until then, live sends use the last published version.

Bootstrap (Full access key only): `RESEND_API_KEY=... node scripts/create-resend-templates.mjs`

The `resend-webhook` function has JWT verification off so Resend/Svix HMAC can authenticate. Point the Resend webhook at:

`https://zpsizielqjyalntojrbk.supabase.co/functions/v1/resend-webhook`

## Embed

```html
<script src="https://conferences.restoreworklife.com/widget.js" async></script>
<script>
  RestoreWidget("init", { campaign: "conference", mode: "inline", target: "#restore-survey" });
</script>
```
