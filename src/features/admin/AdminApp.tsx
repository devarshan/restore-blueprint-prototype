import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { RestoreLogo } from '../../components/RestoreLogo';
import {
  adminCampaigns,
  adminCreateCampaign,
  adminExportCsv,
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
  const [campaignFilter, setCampaignFilter] = useState('');
  const [query, setQuery] = useState('');
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
  const [healthOverview, setHealthOverview] = useState<AdminOverview | null>(null);
  const [recordsUp, setRecordsUp] = useState<boolean | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const health = readHealth(healthOverview, recordsUp, checkedAt);
  const campaignUrl = `${SITE_ORIGIN}/?campaign=${selectedSlug}`;
  const embedUrl = `${SITE_ORIGIN}/embed?campaign=${selectedSlug}`;
  const pendingSlug = slugInput.trim() || slugify(name) || 'pending';

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
      .then((payload) => setCampaigns(payload.campaigns))
      .catch(() => undefined);
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
    const timer = window.setTimeout(() => {
      adminLeads({ campaign: campaignFilter || undefined, q: query || undefined })
        .then((payload) => {
          if (!cancelled) setLeads(payload.leads);
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message);
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [tab, campaignFilter, query]);

  useEffect(() => {
    if (tab !== 'campaigns') return;
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
  }, [tab, campaignUrl]);

  function logout() {
    clearAdminSession();
    navigate('/admin-login', { replace: true });
  }

  function goTab(next: Tab) {
    setTab(next);
    setDetail(null);
    setError('');
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
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const created = await adminCreateCampaign({ name: name.trim(), slug, emailTemplateKey: emailDesign });
      setCampaigns((current) => [created.campaign, ...current.filter((item) => item.slug !== slug)]);
      setCampaignFilter(slug);
      setSelectedSlug(slug);
      setNotice(`Saved ${created.campaign.name}. Use the snippets below.`);
      setName('');
      setSlugInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save campaign.');
    } finally {
      setSaving(false);
    }
  }

  async function exportCsv() {
    const csv = await adminExportCsv(campaignFilter || undefined);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'restore-survey-leads.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function copy(label: string, value: string) {
    void navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1500);
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
            <button type="button" className="admin-cta" onClick={startNewCampaign}>
              Create campaign
            </button>
          </div>
        ) : null}

        {tab === 'overview' || tab === 'leads' ? (
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
              onChange={(event) => {
                setCampaignFilter(event.target.value);
                if (event.target.value) setSelectedSlug(event.target.value);
              }}
            >
              <option value="">All campaigns</option>
              {campaigns.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {tab === 'overview' && !overview && !error ? (
          <p className="font-sans text-sm text-ink/50">Loading dashboard.</p>
        ) : null}

        {tab === 'overview' && overview ? (
          <AdminOverviewPanel overview={overview} showCampaigns={!campaignFilter} />
        ) : null}

        {tab === 'leads' ? (
          <section>
            <div className="admin-page-head">
              <div>
                <h1>Leads</h1>
                <p>People who finished the survey. Click a row for answers and the result-email log.</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="w-full md:flex-1">
                <label htmlFor="search" className="admin-label block">
                  Search
                  <AdminHint label="Lead search">
                    Search by name or email. The campaign menu above still applies.
                  </AdminHint>
                </label>
                <input
                  id="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="admin-field max-w-none md:max-w-md"
                />
              </div>
              <div>
                <button type="button" onClick={() => void exportCsv()} className="admin-cta admin-cta-block md:w-auto">
                  Export CSV
                </button>
                <p className="mt-2 max-w-xs font-sans text-xs text-ink/45">
                  Downloads the current list, including the campaign filter.
                </p>
              </div>
            </div>

            <div className="mt-6 md:hidden">
              {leads.length === 0 ? <p className="font-sans text-sm text-ink/50">No leads yet.</p> : null}
              {leads.map((lead) => (
                <button key={lead.id} type="button" className="admin-lead-card" onClick={() => void openLead(lead.id)}>
                  <p className="font-display text-base">{lead.full_name || lead.email}</p>
                  <p className="mt-1 truncate font-sans text-sm text-ink/60">{lead.email}</p>
                  <p className="mt-1 font-sans text-xs capitalize text-ink/45">
                    {lead.chronotype} · {lead.email_status} · {new Date(lead.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-8 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="border-b border-ink/15">
                  <tr className="font-sans text-[0.65rem] tracking-[0.16em] text-ink/45 uppercase">
                    <th className="py-3 pr-4 font-medium">Name</th>
                    <th className="py-3 pr-4 font-medium">Email</th>
                    <th className="py-3 pr-4 font-medium">Campaign</th>
                    <th className="py-3 pr-4 font-medium">Type</th>
                    <th className="py-3 pr-4 font-medium">
                      Email status
                      <AdminHint label="Email status">
                        sent: Resend accepted it. delivered: the mailbox accepted it. opened or clicked: the person used the email. bounced or failed: it did not arrive. queued: held for the monthly cap.
                      </AdminHint>
                    </th>
                    <th className="py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="cursor-pointer border-b border-ink/10"
                      onClick={() => void openLead(lead.id)}
                    >
                      <td className="py-3 pr-4 font-display text-base">{lead.full_name || lead.email}</td>
                      <td className="py-3 pr-4 text-ink/70">{lead.email}</td>
                      <td className="py-3 pr-4">{lead.campaign_name}</td>
                      <td className="py-3 pr-4 capitalize">{lead.chronotype}</td>
                      <td className="py-3 pr-4">{lead.email_status}</td>
                      <td className="py-3 tabular-nums text-ink/60">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {detail ? (
              <aside className="admin-detail-sheet is-open">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="min-w-0 font-display text-2xl break-words md:text-3xl">{detail.lead.full_name}</h2>
                  <button type="button" onClick={() => setDetail(null)} className="h-11 shrink-0 px-1 text-sm text-ink/50">
                    Close
                  </button>
                </div>
                <p className="mt-2 break-all font-sans text-sm text-ink/60">{detail.lead.email}</p>
                <p className="mt-1 font-sans text-sm capitalize text-ink/60">
                  {detail.lead.chronotype} · {detail.lead.email_status}
                </p>
                <p className="mt-1 font-sans text-sm text-ink/50">{emailStatusHint(detail.lead.email_status)}</p>
                {detail.lead.score_factors?.length ? (
                  <>
                    <h3 className="admin-label mt-6">Score factors</h3>
                    <ul className="mt-3 space-y-2 font-sans text-sm">
                      {detail.lead.score_factors.map((factor) => (
                        <li key={factor}>{factor}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                <h3 className="admin-label mt-6">Answers</h3>
                <ul className="mt-3 space-y-2 font-sans text-sm">
                  {detail.answers.map((answer) => (
                    <li key={`${answer.step}-${answer.question}`}>
                      <span className="text-ink/45">{answer.question}: </span>
                      {JSON.stringify(answer.answer)}
                    </li>
                  ))}
                </ul>
                <h3 className="admin-label mt-6">Email events</h3>
                <ul className="mt-3 space-y-2 font-sans text-sm">
                  {detail.emailEvents.map((event, index) => (
                    <li key={`${event.event_type}-${index}`}>
                      {event.event_type} {event.url_clicked || ''} {new Date(event.timestamp).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}
          </section>
        ) : null}

        {tab === 'campaigns' ? (
          <section className="grid items-start gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-10">
            <div>
              <div className="admin-page-head">
                <div>
                  <h1>Campaigns</h1>
                  <p>Create a conference or booth, then send the link, QR, or embed to the floor team.</p>
                </div>
              </div>
              <h2 className="font-sans text-xl font-bold md:text-2xl">Create campaign</h2>
              <p className="mt-1 font-sans text-sm text-ink/55">
                Save writes the campaign. The link, embed code, and QR on the right update for the selected slug.
              </p>
              <label htmlFor="campaignName" className="admin-label mt-5 block">
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
              <label htmlFor="campaignSlug" className="admin-label mt-4 block">
                Slug
                <AdminHint label="Campaign slug">
                  Short name in the URL. Letters, numbers, and hyphens only. Example: future-of-work becomes /?campaign=future-of-work
                </AdminHint>
              </label>
              <input
                id="campaignSlug"
                value={slugInput}
                onChange={(event) => setSlugInput(slugify(event.target.value))}
                placeholder={slugify(name) || 'future-of-work'}
                className="admin-field"
              />
              <p className="mt-2 break-all font-sans text-sm text-ink/40">URL: /?campaign={pendingSlug}</p>
              <label htmlFor="emailDesign" className="admin-label mt-4 block">
                Result email
                <AdminHint label="Result email">
                  Which result email this campaign sends after someone finishes. The survey questions do not change. To edit the wording, open the matching template in Resend and click Publish.
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
              <p className="mt-2 font-sans text-sm text-ink/50">
                {emailDesignNote(emailDesign)}
              </p>
              <p className="admin-label mt-4">
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
              <p className="mt-2 font-sans text-sm text-ink/50">
                {WIDGET_MODES.find((item) => item.key === mode)?.note ?? WIDGET_MODES[0].note}
              </p>
              <button
                type="button"
                onClick={() => void createCampaign()}
                disabled={saving || !name.trim()}
                className="admin-cta admin-cta-block mt-5"
              >
                {saving ? 'Saving' : 'Save campaign'}
              </button>
              {notice ? <p className="mt-3 font-sans text-sm text-ink/70">{notice}</p> : null}

              <h3 className="admin-label mt-8">Saved campaigns</h3>
              <p className="mt-1 font-sans text-sm text-ink/50">
                Click a conference to load its link, QR, and embed. The right column is the result email.
              </p>
              <ul className="mt-2 divide-y divide-ink/10 border-y border-ink/10">
                {campaigns.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSlug(item.slug);
                        setCampaignFilter(item.slug);
                        setName(item.name);
                        setSlugInput(item.slug);
                        setEmailDesign(parseEmailDesign(item.email_template_key));
                        setNotice('');
                      }}
                      className={`flex min-h-12 w-full items-center justify-between gap-3 px-1 text-left font-sans text-sm ${
                        selectedSlug === item.slug ? 'text-ink' : 'text-ink/55'
                      }`}
                    >
                      <span className="min-w-0 truncate font-semibold">{item.name}</span>
                      <span className="shrink-0 text-ink/40">{emailDesignLabel(item.email_template_key)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-sans text-xl font-bold md:text-2xl">Share this campaign</h2>
              <p className="mt-1 font-sans text-sm text-ink/55">
                Give the floor team the link or QR. Use embed only if Restore sits on another site.
              </p>
              <p className="admin-label mt-4">
                Direct link
                <AdminHint label="Direct link">
                  Open this URL on a phone or tablet at the booth. Each visit is counted under this campaign.
                </AdminHint>
              </p>
              <div className="mt-2 flex items-start justify-between gap-3">
                <p className="min-w-0 break-all font-sans text-sm text-ink/60">{campaignUrl}</p>
                <button
                  type="button"
                  onClick={() => copy('link', campaignUrl)}
                  className="h-11 shrink-0 px-1 text-sm text-ink/50"
                >
                  {copied === 'link' ? 'Copied' : 'Copy'}
                </button>
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
                hint="Paste this when the host page already has its own layout. Set mode above first."
                value={jsSnippet}
                copied={copied}
                onCopy={copy}
              />
              {qr ? (
                <div className="mt-8">
                  <p className="admin-label">
                    QR code
                    <AdminHint label="QR code">
                      Print this for the booth. It opens the same campaign link.
                    </AdminHint>
                  </p>
                  <a href={qr} download={`${selectedSlug}-qr.png`} className="mt-3 inline-block">
                    <img src={qr} alt="Campaign QR code" className="h-40 w-40 bg-paper" />
                    <span className="mt-2 block font-sans text-[0.72rem] tracking-[0.14em] uppercase">Download QR</span>
                  </a>
                </div>
              ) : null}
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
    <div className="admin-snippet mt-6">
      <div className="flex items-center justify-between">
        <p className="admin-label">{label}</p>
        <button type="button" onClick={() => onCopy(label, value)} className="h-11 px-1 text-sm text-ink/50">
          {copied === label ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="mt-1 font-sans text-sm text-ink/50">{hint}</p>
      <pre className="mt-2 bg-ink/[0.04] p-3 font-sans text-xs leading-5">{value}</pre>
    </div>
  );
}
