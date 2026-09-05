# Restore Survey

Chronotype survey for conference campaigns. Completions save to Supabase. Result email is sent with Resend. Campaigns and leads are managed at `/admin`.

## Stack

- Vite + React
- Supabase (Postgres + Edge Functions)
- Resend
- Vercel

## Local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set the three `VITE_*` values in `.env.local` from your Supabase project. `VITE_SERVER_URL` is `{VITE_SUPABASE_URL}/functions/v1/api`.

Open http://localhost:3000/?campaign=conference

Admin: http://localhost:3000/admin-login

## Edge Function secrets

Configure these on the Supabase project. Do not put them in the repo.

- `ADMIN_PASSWORD`
- `ADMIN_TOKEN_SECRET`
- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- `RESEND_FROM`
- `IP_HASH_SALT`
- `MONTHLY_EMAIL_CAP`

The `resend-webhook` function has JWT verification off so Resend/Svix HMAC can authenticate. Point the Resend webhook at `{SUPABASE_URL}/functions/v1/resend-webhook`.

## Embed

```html
<script src="https://conferences.restoreworklife.com/widget.js" async></script>
<script>
  RestoreWidget("init", { campaign: "conference", mode: "inline", target: "#restore-survey" });
</script>
```
