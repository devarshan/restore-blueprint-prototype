import { env } from './env';
import { clearAdminSession, getAdminToken } from './auth';
import type { ChronotypeResult, SurveyData } from '../domain/chronotype/types';

function bounceExpiredAdminSession(): void {
  clearAdminSession();
  if (typeof window === 'undefined') return;
  if (window.location.pathname.includes('admin-login')) return;
  window.location.assign('/admin-login');
}

export interface CampaignRecord {
  id: number;
  name: string;
  slug: string;
  email_template_key: string;
}

export interface IdentifyVisitorInput {
  visitorToken: string;
  fingerprint: string;
  userAgent: string;
  referrerUrl?: string;
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

export interface TrackEventInput {
  visitorToken: string;
  campaignSlug: string;
  sessionId: string;
  currentStep: number;
  totalSteps: number;
  timeSpentOnStepMs: number;
  interactionType: 'view' | 'next' | 'back' | 'complete' | 'abandon';
  completed: boolean;
  question?: string;
  answer?: unknown;
}

export interface CompleteSurveyInput {
  visitorToken: string;
  campaignSlug: string;
  sessionId: string;
  email: string;
  fullName: string;
  chronotype: string;
  peakHours: string;
  allResponses: SurveyData;
  result: ChronotypeResult;
}

async function request<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${env.anonKey}`);
  if (auth) {
    const token = getAdminToken();
    if (!token) {
      bounceExpiredAdminSession();
      throw new Error('Session expired');
    }
    headers.set('X-Admin-Token', token);
  }

  const response = await fetch(`${env.serverUrl}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  let data = {} as T & { error?: string };
  if (text) {
    try {
      data = JSON.parse(text) as T & { error?: string };
    } catch {
      if (auth && response.status === 401) bounceExpiredAdminSession();
      throw new Error(`${response.status} ${response.statusText}`);
    }
  }

  if (!response.ok) {
    if (auth && response.status === 401) bounceExpiredAdminSession();
    const message = data.error || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return data;
}

export function getCampaign(slug: string): Promise<{ campaign: CampaignRecord | null }> {
  return request(`/campaigns/${encodeURIComponent(slug)}`);
}

export function identifyVisitor(body: IdentifyVisitorInput): Promise<{ visitorId: number }> {
  return request('/track/visitor', { method: 'POST', body: JSON.stringify(body) });
}

export function trackEvent(body: TrackEventInput): Promise<{ ok: boolean }> {
  return request('/track/event', { method: 'POST', body: JSON.stringify(body) });
}

export function completeSurvey(
  body: CompleteSurveyInput,
): Promise<{ emailSent: boolean; completionId: number }> {
  return request('/survey-completion', { method: 'POST', body: JSON.stringify(body) });
}

export function adminLogin(password: string): Promise<{ token: string; expiresIn: number }> {
  return request('/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
}

export function adminOverview(campaign?: string) {
  const query = campaign ? `?campaign=${encodeURIComponent(campaign)}` : '';
  return request<AdminOverview>(`/admin/overview${query}`, {}, true);
}

export function adminLeads(params: { campaign?: string; q?: string; status?: string }) {
  const search = new URLSearchParams();
  if (params.campaign) search.set('campaign', params.campaign);
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  const suffix = search.toString() ? `?${search.toString()}` : '';
  return request<{ leads: AdminLead[] }>(`/admin/leads${suffix}`, {}, true);
}

export function adminLead(id: number) {
  return request<AdminLeadDetail>(`/admin/leads/${id}`, {}, true);
}

export function adminCampaigns() {
  return request<{ campaigns: CampaignRecord[] }>('/admin/campaigns', {}, true);
}

export function adminCreateCampaign(body: { name: string; slug: string; emailTemplateKey?: string }) {
  return request<{ campaign: CampaignRecord }>('/admin/campaigns', {
    method: 'POST',
    body: JSON.stringify(body),
  }, true);
}

export function adminUpdateCampaign(
  slug: string,
  body: { name: string; emailTemplateKey?: string },
) {
  return request<{ campaign: CampaignRecord }>(`/admin/campaigns/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, true);
}

export async function adminExportCsv(campaign?: string): Promise<string> {
  const query = campaign ? `?campaign=${encodeURIComponent(campaign)}` : '';
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${env.anonKey}`);
  const token = getAdminToken();
  if (!token) {
    bounceExpiredAdminSession();
    throw new Error('Session expired');
  }
  headers.set('X-Admin-Token', token);

  const response = await fetch(`${env.serverUrl}/admin/leads/export${query}`, { headers });
  if (!response.ok) {
    if (response.status === 401) bounceExpiredAdminSession();
    throw new Error('Export failed');
  }
  return response.text();
}

export interface AdminOverview {
  visitors: number;
  started: number;
  completed: number;
  completionRate: number;
  chronotypes: { horizon: number; apex: number; aurora: number };
  email: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complaints: number;
    quotaUsed: number;
    quotaCap: number;
  };
  dropOff: Array<{ step: number; count: number }>;
  daily: Array<{ day: string; started: number; completed: number }>;
  devices: Array<{ label: string; count: number }>;
  sources: Array<{ label: string; count: number }>;
  emailStatus: Array<{ label: string; count: number }>;
  campaigns: Array<CampaignRecord & { started?: number; completed?: number }>;
}

export interface AdminLead {
  id: number;
  email: string;
  full_name: string | null;
  chronotype: string;
  peak_hours: string | null;
  score_factors?: string[];
  campaign_slug: string;
  campaign_name: string;
  email_status: string;
  created_at: string;
  last_step: number | null;
  completed: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  device: string | null;
}

export interface AdminLeadDetail {
  lead: AdminLead & { all_responses: SurveyData | null; visitor_id: number };
  answers: Array<{ step: number; question: string; answer: unknown; created_at: string }>;
  events: Array<{
    current_step: number;
    interaction_type: string;
    time_spent_on_step_ms: number | null;
    timestamp: string;
  }>;
  emailEvents: Array<{
    event_type: string;
    url_clicked: string | null;
    timestamp: string;
  }>;
  visitor: {
    visitor_token: string;
    user_agent: string | null;
    referrer_url: string | null;
    initial_utm_source: string | null;
    initial_utm_medium: string | null;
    initial_utm_campaign: string | null;
    initial_utm_term: string | null;
    initial_utm_content: string | null;
  };
}
