import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { RestoreLogo } from '../../components/RestoreLogo';
import {
  adminCampaigns,
  adminCreateCampaign,
  adminExportCsv,
  adminUpdateCampaign,
  adminLead,
  adminLeads,
  adminOverview,
  type AdminLead,
  type AdminLeadDetail,
  type AdminOverview,
  type CampaignRecord,
} from '../../infra/api';
import { DEFAULT_CAMPAIGN_SLUG } from '../../infra/campaign';
import { EMAIL_DESIGN_OPTIONS, emailDesignLabel, emailDesignNote, parseEmailDesign, type EmailDesignKey } from '../../infra/emailDesigns';
import { SITE_ORIGIN } from '../../infra/env';
import { clearAdminSession } from '../../infra/auth';
import { AdminGuide } from './AdminGuide';
import { AdminHint } from './AdminHint';
import { AdminRailHealth, AdminStatusStrip, readHealth } from './AdminHealth';
import { AdminOverviewPanel } from './AdminOverview';

type Tab = 'overview' | 'leads' | 'campaigns' | 'guide';
type WidgetMode = 'inline' | 'popup' | 'slider';

const LEAD_LIST_LIMIT = 200;
const LEAD_EXPORT_LIMIT = 5000;

const TABS: Tab[] = ['overview', 'leads', 'campaigns', 'guide'];
const WIDGET_MODES: Array<{ key: WidgetMode; label: string; note: string }> = [
  {
    key: 'inline',
    label: 'Inline',
    note: 'The survey sits on the page. Use this for a conference landing page or booth tablet.',
  },
  {
    key: 'popup',
    label: 'Popup',
    note: 'The survey opens over the host page. Use this when Restore is a secondary block on a site.',
  },
  {
    key: 'slider',
    label: 'Slider',
    note: 'The survey slides in from the side. Use this on a crowded page that should stay visible.',
  },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function emailStatusHint(status: string): string {
  switch (status) {
    case 'sent':
      return 'Resend accepted the result email.';
    case 'delivered':
      return 'The mailbox accepted the result email.';
    case 'opened':
      return 'The result email was opened.';
    case 'clicked':
      return 'A link in the result email was clicked.';
    case 'bounced':
    case 'permanent_fail':
      return 'The mailbox rejected the result email. Check the address.';
    case 'failed':
    case 'queued':
      return 'The result email did not go out. It may be over the monthly cap, or Resend returned an error.';
    default:
      return 'Status of the chronotype result email for this completion.';
  }
}

function statusTone(status: string): 'ok' | 'bad' | 'wait' {
  switch (status) {
    case 'bounced':
    case 'permanent_fail':
    case 'failed':
      return 'bad';
    case 'queued':
      return 'wait';
    default:
      return 'ok';
  }
}

function formatAnswerValue(answer: unknown): string {
  if (answer == null || answer === '') return 'Not answered';
  if (typeof answer === 'string' || typeof answer === 'number' || typeof answer === 'boolean') {
    return String(answer);
  }
  if (Array.isArray(answer)) {
    if (!answer.length) return 'Not answered';
    return answer.map((item) => formatAnswerValue(item)).join(', ');
  }
  if (typeof answer === 'object') {
    const entries = Object.entries(answer as Record<string, unknown>);
    if (!entries.length) return 'Not answered';
    return entries.map(([key, value]) => `${key}: ${formatAnswerValue(value)}`).join(' · ');
  }
  return String(answer);
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

function formatQuestion(question: string): string {
  const cleaned = question.replace(/_/g, ' ').trim();
  if (!cleaned) return question;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

function leadsEmptyCopy(query: string, campaignFilter: string): string {
  if (query.trim()) return 'No leads match that search.';
  if (campaignFilter) return 'No leads for this campaign.';
  return 'No leads yet.';
}

function tabLabel(tab: Tab): string {
  switch (tab) {
    case 'overview':
      return 'Dashboard';
    case 'leads':
      return 'Leads';
    case 'campaigns':
      return 'Campaigns';
    case 'guide':
      return 'Guide';
    default: {
      const _exhaustive: never = tab;
      return _exhaustive;
    }
  }
}

export function AdminApp() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [detail, setDetail] = useState<AdminLeadDetail | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [campaignsError, setCampaignsError] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [query, setQuery] = useState('');
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState<WidgetMode>('inline');
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState('');
  const [selectedSlug, setSelectedSlug] = useState(DEFAULT_CAMPAIGN_SLUG);
  const [emailDesign, setEmailDesign] = useState<EmailDesignKey>('default');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState<EmailDesignKey>('default');
  const [editNotice, setEditNotice] = useState('');
  const [healthOverview, setHealthOverview] = useState<AdminOverview | null>(null);
  const [recordsUp, setRecordsUp] = useState<boolean | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const health = readHealth(healthOverview, recordsUp, checkedAt);
  const campaignUrl = `${SITE_ORIGIN}/?campaign=${selectedSlug}`;
  const embedUrl = `${SITE_ORIGIN}/embed?campaign=${selectedSlug}`;
  const pendingSlug = slugInput.trim() || slugify(name) || 'pending';
  const selectedCampaign = campaigns.find((item) => item.slug === selectedSlug);
  const editDirty = Boolean(
    selectedCampaign &&
      (editName.trim() !== selectedCampaign.name ||
        editEmail !== parseEmailDesign(selectedCampaign.email_template_key)),
  );

  const iframeSnippet = `<iframe src="${embedUrl}" title="Restore Survey" style="width:100%;min-height:640px;border:0;"></iframe>`;
  const jsSnippet = `<div id="restore-survey"></div>
<script src="${SITE_ORIGIN}/widget.js" async></script>
<script>
  window.RestoreWidget && RestoreWidget("init", {
    campaign: "${selectedSlug}",
    mode: "${mode}",
    target: "#restore-survey"
  });
</script>`;

  useEffect(() => {
    const html = document.documentElement;
    const previousBackground = html.style.background;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousColor = document.body.style.color;
    html.style.background = '#f4f6f7';
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.color = '#102539';
    return () => {
      html.style.background = previousBackground;
      html.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.color = previousColor;
    };
  }, []);

  useEffect(() => {
    const main = document.querySelector('.admin-main');
    if (main instanceof HTMLElement) main.scrollTop = 0;
    else window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [tab]);

  useEffect(() => {
    if (!detail) return;
    const previous = document.body.style.overflow;
    const lock = window.matchMedia('(max-width: 767px)').matches;
    if (lock) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [detail]);

  useEffect(() => {
    adminCampaigns()
      .then((payload) => {
        setCampaigns(payload.campaigns);
        setCampaignsError('');
        setSelectedSlug((current) => {
          if (payload.campaigns.some((item) => item.slug === current)) return current;
          return payload.campaigns[0]?.slug ?? current;
        });
      })
      .catch(() => {
        setCampaignsError('Could not load campaigns.');
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    adminOverview(campaignFilter || undefined)
      .then((data) => {
        if (cancelled) return;
        setOverview(data);
        if (!campaignFilter) {
          setHealthOverview(data);
          setRecordsUp(true);
          setCheckedAt(new Date());
        }
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        if (!campaignFilter) {
          setCheckedAt(new Date());
          setRecordsUp(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [campaignFilter]);

  useEffect(() => {
    let cancelled = false;

    function ping() {
      adminOverview()
        .then((data) => {
          if (cancelled) return;
          setHealthOverview(data);
          setRecordsUp(true);
          setCheckedAt(new Date());
        })
        .catch(() => {
          if (cancelled) return;
          setCheckedAt(new Date());
          setRecordsUp(false);
        });
    }

    const timer = window.setInterval(ping, 60_000);
    if (campaignFilter) ping();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [campaignFilter]);

  useEffect(() => {
    if (tab !== 'leads') return;
    let cancelled = false;
    setLeadsLoading(true);
    const timer = window.setTimeout(() => {
      adminLeads({ campaign: campaignFilter || undefined, q: query || undefined })
        .then((payload) => {
          if (cancelled) return;
          setLeads(payload.leads);
          setLeadsLoading(false);
        })
        .catch((err: Error) => {
          if (cancelled) return;
          setError(err.message);
          setLeadsLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [tab, campaignFilter, query]);

  useEffect(() => {
    if (tab !== 'campaigns' || !selectedCampaign) {
      setQr('');
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(campaignUrl, {
      width: 320,
      margin: 2,
      color: { dark: '#0e1f2c', light: '#f1ebe1' },
    }).then((url) => {
      if (!cancelled) setQr(url);
    });
    return () => {
      cancelled = true;
    };
  }, [tab, campaignUrl, selectedCampaign]);

  useEffect(() => {
    if (!selectedCampaign) return;
    setEditName(selectedCampaign.name);
    setEditEmail(parseEmailDesign(selectedCampaign.email_template_key));
  }, [selectedCampaign]);

  useEffect(() => {
    setEditNotice('');
  }, [selectedSlug]);

  function logout() {
    clearAdminSession();
    navigate('/admin-login', { replace: true });
  }

  function goTab(next: Tab) {
    setTab(next);
    setDetail(null);
    setError('');
    if (next === 'leads') setLeadsLoading(true);
  }

  function selectSavedCampaign(slug: string) {
    setSelectedSlug(slug);
    const found = campaigns.find((item) => item.slug === slug);
    if (!found) return;
    setEditName(found.name);
    setEditEmail(parseEmailDesign(found.email_template_key));
  }

  function startNewCampaign() {
    setName('');
    setSlugInput('');
    setEmailDesign('default');
    setNotice('');
    goTab('campaigns');
  }

  async function openLead(id: number) {
    try {
      setDetail(await adminLead(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load lead.');
    }
  }

  async function createCampaign() {
    const slug = slugInput.trim() || slugify(name);
    if (!name.trim() || !slug) {
      setError('Enter a campaign name.');
      return;
    }
    if (campaigns.some((item) => item.slug === slug)) {
      setError('A campaign with that slug already exists.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const created = await adminCreateCampaign({ name: name.trim(), slug, emailTemplateKey: emailDesign });
      setCampaigns((current) => [created.campaign, ...current.filter((item) => item.slug !== slug)]);
      setCampaignsError('');
      setSelectedSlug(slug);
      setNotice(`Saved ${created.campaign.name}. It is selected for sharing.`);
      setName('');
      setSlugInput('');
      setEmailDesign('default');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save campaign.');
    } finally {
      setSaving(false);
    }
  }

  async function updateCampaign() {
    if (!selectedCampaign) return;
    const nextName = editName.trim();
    if (!nextName) {
      setError('Enter a campaign name.');
      return;
    }
    setSaving(true);
    setError('');
    setEditNotice('');
    try {
      const updated = await adminUpdateCampaign(selectedCampaign.slug, {
        name: nextName,
        emailTemplateKey: editEmail,
      });
      setCampaigns((current) =>
        current.map((item) => (item.id === updated.campaign.id ? updated.campaign : item)),
      );
      setEditNotice(`Updated ${updated.campaign.name}. New finishes use this result email.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update campaign.');
    } finally {
      setSaving(false);
    }
  }

  async function exportCsv() {
    try {
      const csv = await adminExportCsv(campaignFilter || undefined);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'restore-survey-leads.csv';
      link.click();
      URL.revokeObjectURL(url);
      const rows = csv.trim() ? csv.trim().split('\n').length - 1 : 0;
      if (rows >= LEAD_EXPORT_LIMIT) {
        setError(`Export reached the ${LEAD_EXPORT_LIMIT.toLocaleString()}-row limit. Older leads are not in this file.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export CSV.');
    }
  }

  function copy(label: string, value: string) {
    void navigator.clipboard.writeText(value).then(
      () => {
        setCopied(label);
        window.setTimeout(() => setCopied(''), 1500);
      },
      () => {
        setError('Could not copy. Select the text and copy it by hand.');
      },
    );
  }

  return (
    <div className="admin-shell admin-shell-app">
      <aside className="admin-rail" aria-label="Admin">
        <div className="admin-rail-brand">
          <RestoreLogo variant="dark" className="admin-rail-logo" />
          <p>Admin</p>
        </div>
        <nav className="admin-rail-nav" aria-label="Sections">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => goTab(item)}
              className={tab === item ? 'is-on' : ''}
              aria-current={tab === item ? 'page' : undefined}
            >
              {tabLabel(item)}
            </button>
          ))}
        </nav>
        <button type="button" className="admin-rail-create" onClick={startNewCampaign}>
          Create campaign
        </button>
        <p className="admin-rail-note">Adds a conference or booth: link, QR, embed, and result email.</p>
        <div className="admin-rail-foot">
          <AdminRailHealth health={health} />
          <button type="button" className="admin-rail-out" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <div className="admin-stage">
        <AdminStatusStrip health={health} />
        <main className="admin-main">
        {error ? <p className="mb-4 font-sans text-sm text-red-800">{error}</p> : null}

        {tab === 'overview' ? (
          <div className="admin-page-head">
            <div>
              <h1>Dashboard</h1>
              <p>
                Traffic and result emails for the last 14 days. Use the campaign menu to isolate one conference.
              </p>
            </div>
          </div>
        ) : null}

        {tab === 'overview' ? (
          <div className="admin-filter-row">
            <label htmlFor="campaignFilter">
              Campaign
              <AdminHint label="Campaign filter">
                Limits this page to one conference. Choose All campaigns to see the combined picture.
              </AdminHint>
            </label>
            <select
              id="campaignFilter"
              value={campaignFilter}
              onChange={(event) => setCampaignFilter(event.target.value)}
            >
              <option value="">All campaigns</option>
              {campaigns.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
            {campaignsError ? <p className="admin-empty">{campaignsError}</p> : null}
          </div>
        ) : null}

        {tab === 'overview' && !overview && !error ? (
          <p className="font-sans text-sm text-ink/50">Loading dashboard.</p>
        ) : null}

        {tab === 'overview' && overview ? (
          <AdminOverviewPanel overview={overview} showCampaigns={!campaignFilter} />
        ) : null}

        {tab === 'leads' ? (
          <section className="admin-leads">
            <div className="admin-page-head">
              <div>
                <h1>Leads</h1>
                <p>People who finished the survey. Open a row for answers and the result-email log.</p>
              </div>
            </div>

            <div className="admin-toolbar">
              <div>
                <label htmlFor="leadsCampaign">
                  Campaign
                  <AdminHint label="Campaign filter">
                    Limits this list to one conference. Choose All campaigns to see everyone.
                  </AdminHint>
                </label>
                <select
                  id="leadsCampaign"
                  value={campaignFilter}
                  onChange={(event) => setCampaignFilter(event.target.value)}
                >
                  <option value="">All campaigns</option>
                  {campaigns.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {campaignsError ? <p className="admin-empty">{campaignsError}</p> : null}
              </div>
              <div>
                <label htmlFor="search">
                  Search
                  <AdminHint label="Lead search">Search by name or email. The campaign menu still applies.</AdminHint>
                </label>
                <input
                  id="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name or email"
                />
              </div>
              <button type="button" onClick={() => void exportCsv()} className="admin-cta">
                Export CSV
              </button>
            </div>

            <div className="admin-leads-split">
              <div className="admin-block admin-leads-list">
                {leadsLoading && leads.length === 0 ? (
                  <p className="admin-empty">Loading leads.</p>
                ) : leads.length === 0 ? (
                  <p className="admin-empty">{leadsEmptyCopy(query, campaignFilter)}</p>
                ) : (
                  <>
                    <div className="admin-leads-head">
                      <span>Person</span>
                      <span>Type</span>
                      <span>
                        Status
                        <AdminHint label="Email status">
                          sent: Resend accepted it. delivered: the mailbox accepted it. opened or clicked: the person
                          used the email. bounced or failed: it did not arrive. queued: held for the monthly cap.
                        </AdminHint>
                      </span>
                      <span>Date</span>
                    </div>
                    {leads.map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        className={`admin-lead-row${detail?.lead.id === lead.id ? ' is-on' : ''}`}
                        onClick={() => void openLead(lead.id)}
                      >
                        <span className="admin-lead-person">
                          <span className="admin-lead-name">{lead.full_name || lead.email}</span>
                          <span className="admin-lead-sub">
                            <span>{lead.email}</span>
                            <span>{lead.campaign_name}</span>
                          </span>
                        </span>
                        <span className="admin-lead-type">{lead.chronotype}</span>
                        <span className={`admin-pill is-${statusTone(lead.email_status)}`}>
                          {formatStatus(lead.email_status)}
                        </span>
                        <span className="admin-lead-date">{new Date(lead.created_at).toLocaleDateString()}</span>
                      </button>
                    ))}
                    {leads.length >= LEAD_LIST_LIMIT ? (
                      <p className="admin-empty">
                        Showing the latest {LEAD_LIST_LIMIT}. Export CSV for a longer list (up to{' '}
                        {LEAD_EXPORT_LIMIT.toLocaleString()}).
                      </p>
                    ) : null}
                  </>
                )}
              </div>

              {detail ? (
                <aside className="admin-detail-sheet is-open">
                  <div className="admin-detail-top">
                    <div>
                      <h2>{detail.lead.full_name || detail.lead.email}</h2>
                      <p className="admin-detail-email">{detail.lead.email}</p>
                    </div>
                    <button type="button" onClick={() => setDetail(null)} className="admin-text-btn">
                      Close
                    </button>
                  </div>
                  <div className="admin-detail-chips">
                    <span className="admin-pill">{detail.lead.chronotype}</span>
                    <span className={`admin-pill is-${statusTone(detail.lead.email_status)}`}>
                      {formatStatus(detail.lead.email_status)}
                    </span>
                    {detail.lead.peak_hours ? <span className="admin-pill">{detail.lead.peak_hours}</span> : null}
                    {detail.lead.device ? <span className="admin-pill">{detail.lead.device}</span> : null}
                  </div>
                  <p className="admin-detail-hint">{emailStatusHint(detail.lead.email_status)}</p>
                  {(detail.lead.campaign_name ||
                    detail.visitor.referrer_url ||
                    detail.visitor.initial_utm_source) ? (
                    <dl className="admin-meta">
                      {detail.lead.campaign_name ? (
                        <div>
                          <dt>Campaign</dt>
                          <dd>{detail.lead.campaign_name}</dd>
                        </div>
                      ) : null}
                      {detail.visitor.referrer_url ? (
                        <div>
                          <dt>Referrer</dt>
                          <dd>{detail.visitor.referrer_url}</dd>
                        </div>
                      ) : null}
                      {detail.visitor.initial_utm_source ? (
                        <div>
                          <dt>UTM</dt>
                          <dd>
                            {[
                              detail.visitor.initial_utm_source,
                              detail.visitor.initial_utm_medium,
                              detail.visitor.initial_utm_campaign,
                            ]
                              .filter(Boolean)
                              .join(' / ')}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                  {detail.lead.score_factors?.length ? (
                    <div className="admin-detail-block">
                      <h3 className="admin-label">Score factors</h3>
                      <ul className="admin-factor-list">
                        {detail.lead.score_factors.map((factor) => (
                          <li key={factor}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="admin-detail-block">
                    <h3 className="admin-label">Answers</h3>
                    {detail.answers.length ? (
                      <dl className="admin-answer-list">
                        {detail.answers.map((answer) => (
                          <div key={`${answer.step}-${answer.question}`}>
                            <dt>{formatQuestion(answer.question)}</dt>
                            <dd>{formatAnswerValue(answer.answer)}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="admin-empty">No answers stored.</p>
                    )}
                  </div>
                  <div className="admin-detail-block">
                    <h3 className="admin-label">Email events</h3>
                    {detail.emailEvents.length ? (
                      <ul className="admin-event-list">
                        {detail.emailEvents.map((event, index) => (
                          <li key={`${event.event_type}-${index}`}>
                            <span>{formatStatus(event.event_type)}</span>
                            {event.url_clicked ? <span className="admin-event-url">{event.url_clicked}</span> : null}
                            <time>{new Date(event.timestamp).toLocaleString()}</time>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="admin-empty">No email events yet.</p>
                    )}
                  </div>
                </aside>
              ) : (
                <p className="admin-detail-placeholder">Select a lead to see answers and the email log.</p>
              )}
            </div>
          </section>
        ) : null}

        {tab === 'campaigns' ? (
          <section className="admin-campaigns">
            <div className="admin-page-head">
              <div>
                <h1>Campaigns</h1>
                <p>Create a conference or booth, then send the link, QR, or embed to the floor team.</p>
              </div>
            </div>

            <div className="admin-campaigns-grid">
              <div className="admin-block">
                <h2 className="admin-card-title">New campaign</h2>
                <p className="admin-card-copy">Adds a conference. It does not change the campaign being shared.</p>
                <div className="admin-form-grid">
                  <div>
                    <label htmlFor="campaignName" className="admin-label">
                      Campaign name
                      <AdminHint label="Campaign name">
                        The name shown on the survey and in this admin. Example: Future of Work.
                      </AdminHint>
                    </label>
                    <input
                      id="campaignName"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Future of Work"
                      className="admin-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="campaignSlug" className="admin-label">
                      Slug
                      <AdminHint label="Campaign slug">
                        Short name in the URL. Letters, numbers, and hyphens only. Example: future-of-work becomes
                        /?campaign=future-of-work
                      </AdminHint>
                    </label>
                    <input
                      id="campaignSlug"
                      value={slugInput}
                      onChange={(event) => setSlugInput(slugify(event.target.value))}
                      placeholder={slugify(name) || 'future-of-work'}
                      className="admin-field"
                    />
                    <p className="admin-field-hint">{`/?campaign=${pendingSlug}`}</p>
                  </div>
                  <div className="admin-form-span">
                    <label htmlFor="emailDesign" className="admin-label">
                      Result email
                      <AdminHint label="Result email">
                        Which result email this campaign sends after someone finishes. The survey questions do not
                        change. To edit the wording, open the matching template in Resend and click Publish.
                      </AdminHint>
                    </label>
                    <select
                      id="emailDesign"
                      value={emailDesign}
                      onChange={(event) => setEmailDesign(parseEmailDesign(event.target.value))}
                      className="admin-field"
                    >
                      {EMAIL_DESIGN_OPTIONS.map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <p className="admin-field-hint">{emailDesignNote(emailDesign)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void createCampaign()}
                  disabled={saving || !name.trim()}
                  className="admin-cta"
                >
                  {saving ? 'Saving' : 'Save campaign'}
                </button>
                {notice ? <p className="admin-notice">{notice}</p> : null}
              </div>

              <div className="admin-block">
                <h2 className="admin-card-title">
                  {selectedCampaign ? `Share ${selectedCampaign.name}` : 'Share'}
                </h2>
                <p className="admin-card-copy">
                  Pick a saved conference to change its name or result email, then copy the link, QR, or embed.
                </p>
                {campaignsError ? (
                  <p className="admin-empty">{campaignsError}</p>
                ) : campaigns.length ? (
                  <ul className="admin-saved-list">
                    {campaigns.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => selectSavedCampaign(item.slug)}
                          className={selectedSlug === item.slug ? 'is-on' : ''}
                        >
                          <span>{item.name}</span>
                          <span>{emailDesignLabel(item.email_template_key)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="admin-empty">No campaigns yet. Save one first.</p>
                )}
                {selectedCampaign ? (
                  <>
                    <div className="admin-form-grid admin-edit-grid">
                      <div>
                        <label htmlFor="editCampaignName" className="admin-label">
                          Campaign name
                          <AdminHint label="Edit campaign name">
                            Changes the name in this admin and on the survey. The URL does not change.
                          </AdminHint>
                        </label>
                        <input
                          id="editCampaignName"
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          className="admin-field"
                        />
                      </div>
                      <div>
                        <p className="admin-label">
                          Slug
                          <AdminHint label="Locked slug">
                            The floor link and QR use this slug. It cannot be changed after save.
                          </AdminHint>
                        </p>
                        <p className="admin-field-hint">{`/?campaign=${selectedCampaign.slug}`}</p>
                      </div>
                      <div className="admin-form-span">
                        <label htmlFor="editEmailDesign" className="admin-label">
                          Result email
                          <AdminHint label="Edit result email">
                            Next finishes on this campaign use this layout. Past leads keep whatever already went out.
                          </AdminHint>
                        </label>
                        <select
                          id="editEmailDesign"
                          value={editEmail}
                          onChange={(event) => setEditEmail(parseEmailDesign(event.target.value))}
                          className="admin-field"
                        >
                          {EMAIL_DESIGN_OPTIONS.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                        <p className="admin-field-hint">{emailDesignNote(editEmail)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void updateCampaign()}
                      disabled={saving || !editName.trim() || !editDirty}
                      className="admin-cta"
                    >
                      {saving ? 'Saving' : 'Save changes'}
                    </button>
                    {editNotice ? <p className="admin-notice">{editNotice}</p> : null}
                    <div className="admin-share-link">
                  <div>
                    <p className="admin-label">
                      Direct link
                      <AdminHint label="Direct link">
                        Open this URL on a phone or tablet at the booth. Each visit is counted under this campaign.
                      </AdminHint>
                    </p>
                    <p className="admin-share-url">{campaignUrl}</p>
                  </div>
                  <button type="button" onClick={() => copy('link', campaignUrl)} className="admin-text-btn">
                    {copied === 'link' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                {qr ? (
                  <div className="admin-qr">
                    <p className="admin-label">
                      QR code
                      <AdminHint label="QR code">Print this for the booth. It opens the same campaign link.</AdminHint>
                    </p>
                    <a href={qr} download={`${selectedSlug}-qr.png`}>
                      <img src={qr} alt="Campaign QR code" />
                      <span>Download QR</span>
                    </a>
                  </div>
                ) : null}
                <div className="admin-share-mode">
                  <p className="admin-label">
                    Widget mode
                    <AdminHint label="Widget mode">
                      Inline for a booth tablet. Popup or slider only when Restore sits on another site.
                    </AdminHint>
                  </p>
                  <div className="admin-mode" role="group" aria-label="Widget mode">
                    {WIDGET_MODES.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setMode(item.key)}
                        className={mode === item.key ? 'is-on' : ''}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <p className="admin-field-hint">
                    {WIDGET_MODES.find((item) => item.key === mode)?.note ?? WIDGET_MODES[0].note}
                  </p>
                </div>
                <Snippet
                  label="Page embed"
                  hint="Paste this on a conference page when the survey should sit in the layout."
                  value={iframeSnippet}
                  copied={copied}
                  onCopy={copy}
                />
                <Snippet
                  label="JavaScript widget"
                  hint="Paste this when the host page already has its own layout. Set widget mode first."
                  value={jsSnippet}
                  copied={copied}
                  onCopy={copy}
                />
                  </>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {tab === 'guide' ? (
          <AdminGuide
            health={health}
            onOpenCampaigns={() => goTab('campaigns')}
            onOpenLeads={() => goTab('leads')}
          />
        ) : null}
      </main>
      </div>
    </div>
  );
}

function Snippet({
  label,
  hint,
  value,
  copied,
  onCopy,
}: {
  label: string;
  hint: string;
  value: string;
  copied: string;
  onCopy: (label: string, value: string) => void;
}) {
  return (
    <div className="admin-snippet">
      <div className="admin-snippet-head">
        <p className="admin-label">{label}</p>
        <button type="button" onClick={() => onCopy(label, value)} className="admin-text-btn">
          {copied === label ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="admin-field-hint">{hint}</p>
      <pre>{value}</pre>
    </div>
  );
}
