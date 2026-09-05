import { DEFAULT_CAMPAIGN_SLUG } from '../../infra/campaign';

const VISITOR_KEY = 'rwl_vid';
const SESSION_KEY = 'rwl_sid';

export function getCampaignSlug(): string {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('campaign')?.trim().toLowerCase();
  return slug && /^[a-z0-9-]+$/.test(slug) ? slug : DEFAULT_CAMPAIGN_SLUG;
}

export function parseUtm(): {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
} {
  const params = new URLSearchParams(window.location.search);
  const utm = {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
    term: params.get('utm_term') || undefined,
    content: params.get('utm_content') || undefined,
  };
  if (utm.source || utm.medium || utm.campaign || utm.term || utm.content) return utm;
  return {};
}

export function getOrCreateVisitorToken(): string {
  const existing = readCookie(VISITOR_KEY) || localStorage.getItem(VISITOR_KEY);
  if (existing) {
    writeCookie(VISITOR_KEY, existing);
    localStorage.setItem(VISITOR_KEY, existing);
    return existing;
  }
  const token = `vid_${crypto.randomUUID()}`;
  writeCookie(VISITOR_KEY, token);
  localStorage.setItem(VISITOR_KEY, token);
  return token;
}

export function getOrCreateSessionId(): string {
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

export async function deviceFingerprint(): Promise<string> {
  const raw = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    String(screen.colorDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    String(navigator.hardwareConcurrency || ''),
  ].join('|');
  const bytes = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function writeCookie(name: string, value: string): void {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function allowPinchZoom(): void {
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    meta.setAttribute(
      'content',
      'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=overlays-content',
    );
  }
}
