import { useEffect, useMemo, useState } from 'react';
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
import { SITE_ORIGIN } from '../../infra/env';
import { clearAdminSession } from '../../infra/auth';

type Tab = 'overview' | 'leads' | 'campaigns';
type WidgetMode = 'inline' | 'popup' | 'slider';

const TABS: Tab[] = ['overview', 'leads', 'campaigns'];
const WIDGET_MODES: WidgetMode[] = ['inline', 'popup', 'slider'];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function widgetLabel(mode: WidgetMode): string {
  switch (mode) {
    case 'inline':
      return 'Inline';
    case 'popup':
      return 'Popup';
    case 'slider':
      return 'Slider';
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

function tabLabel(tab: Tab): string {
  switch (tab) {
    case 'overview':
      return 'Overview';
    case 'leads':
      return 'Leads';
    case 'campaigns':
      return 'Campaigns';
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

  const campaignSlug = selectedSlug;
  const campaignUrl = `${SITE_ORIGIN}/?campaign=${campaignSlug}`;
  const embedUrl = `${SITE_ORIGIN}/embed?campaign=${campaignSlug}`;
  const pendingSlug = slugInput.trim() || slugify(name) || 'pending';

  const iframeSnippet = `<iframe src="${embedUrl}" title="Restore Survey" style="width:100%;min-height:640px;border:0;"></iframe>`;
  const jsSnippet = `<div id="restore-survey"></div>
<script src="${SITE_ORIGIN}/widget.js" async></script>
<script>
  window.RestoreWidget && RestoreWidget("init", {
    campaign: "${campaignSlug}",
    mode: "${mode}",
    target: "#restore-survey"
  });
</script>`;

  useEffect(() => {
    const html = document.documentElement;
    const previousBackground = html.style.background;
    const previousColor = document.body.style.color;
    html.style.background = '#f4f6f7';
    document.body.style.color = '#102539';
    return () => {
      html.style.background = previousBackground;
      document.body.style.color = previousColor;
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
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
    adminOverview(campaignFilter || undefined)
      .then(setOverview)
      .catch((err: Error) => setError(err.message));
    adminCampaigns()
      .then((payload) => setCampaigns(payload.campaigns))
      .catch(() => undefined);
  }, [campaignFilter]);

  useEffect(() => {
    if (tab !== 'leads') return;
    adminLeads({ campaign: campaignFilter || undefined, q: query || undefined })
      .then((payload) => setLeads(payload.leads))
      .catch((err: Error) => setError(err.message));
  }, [tab, campaignFilter, query]);

  useEffect(() => {
    QRCode.toDataURL(campaignUrl, {
      width: 640,
      margin: 2,
      color: { dark: '#0e1f2c', light: '#f1ebe1' },
    }).then(setQr);
  }, [campaignUrl]);

  const quotaLabel = useMemo(() => {
    if (!overview) return '';
    return `${overview.email.quotaUsed} / ${overview.email.quotaCap} emails this month`;
  }, [overview]);

  function logout() {
    clearAdminSession();
    navigate('/admin-login', { replace: true });
  }

  function goTab(next: Tab) {
    setTab(next);
    setDetail(null);
    setError('');
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
      const created = await adminCreateCampaign({ name: name.trim(), slug });
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

  const totalTypes = overview
    ? overview.chronotypes.horizon + overview.chronotypes.apex + overview.chronotypes.aurora
    : 0;

  return (
    <div className="admin-shell">
      <header className="admin-top">
        <div className="admin-brand">
          <div className="flex min-w-0 items-center gap-3">
            <RestoreLogo variant="light" className="h-7 max-h-7 w-auto" />
            <p className="hidden font-sans text-sm font-semibold sm:block">Admin</p>
          </div>
          <button type="button" onClick={logout} className="h-11 shrink-0 px-1 font-sans text-sm text-ink/70">
            Log out
          </button>
        </div>
        <div className="admin-chrome">
          <nav className="admin-tabs" aria-label="Admin sections">
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => goTab(item)}
                className={`admin-tab ${tab === item ? 'is-on' : ''}`}
              >
                {tabLabel(item)}
              </button>
            ))}
          </nav>
          {tab !== 'campaigns' ? (
            <div className="admin-filter-row">
              <label htmlFor="campaignFilter" className="shrink-0 font-sans text-[0.68rem] tracking-[0.16em] text-ink/45 uppercase">
                Campaign
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
        </div>
      </header>

      <main className="admin-main">
        {error ? <p className="mb-4 font-sans text-sm text-red-800">{error}</p> : null}

        {tab === 'overview' && !overview && !error ? (
          <p className="font-sans text-sm text-ink/50">Loading overview.</p>
        ) : null}

        {tab === 'overview' && overview ? (
          <section>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
              <div>
                <p className="font-sans text-[0.68rem] tracking-[0.2em] text-ink/45 uppercase">Completion rate</p>
                <p className="mt-2 font-display text-[clamp(3rem,14vw,5rem)] leading-none tracking-tight">
                  {Math.round(overview.completionRate * 100)}
                  <span className="text-3xl text-ink/40">%</span>
                </p>
                <p className="mt-4 max-w-xs font-sans text-sm font-light leading-6 text-ink/55">
                  {overview.visitors} visitors · {overview.started} started · {overview.completed} complete
                </p>
                <p className="mt-2 font-sans text-sm font-light text-ink/45">{quotaLabel}</p>
              </div>
              <div>
                <p className="font-sans text-[0.68rem] tracking-[0.2em] text-ink/45 uppercase">Chronotypes</p>
                <div className="mt-4 flex h-2 w-full overflow-hidden bg-ink/10">
                  <span
                    className="bg-ink"
                    style={{ width: totalTypes ? `${(overview.chronotypes.horizon / totalTypes) * 100}%` : '0%' }}
                  />
                  <span
                    className="bg-ink/55"
                    style={{ width: totalTypes ? `${(overview.chronotypes.apex / totalTypes) * 100}%` : '0%' }}
                  />
                  <span
                    className="bg-brass"
                    style={{ width: totalTypes ? `${(overview.chronotypes.aurora / totalTypes) * 100}%` : '0%' }}
                  />
                </div>
                <ul className="mt-5 space-y-2 font-sans text-sm">
                  <li className="flex justify-between">
                    <span>Horizon</span>
                    <span className="tabular-nums">{overview.chronotypes.horizon}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Apex</span>
                    <span className="tabular-nums">{overview.chronotypes.apex}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Aurora</span>
                    <span className="tabular-nums">{overview.chronotypes.aurora}</span>
                  </li>
                </ul>
                <p className="mt-8 font-sans text-[0.68rem] tracking-[0.2em] text-ink/45 uppercase">Email</p>
                <p className="mt-2 font-sans text-sm font-light text-ink/60">
                  {overview.email.sent} sent · {overview.email.opened} opened · {overview.email.clicked} clicked
                </p>
              </div>
            </div>
            {overview.dropOff.length ? (
              <div className="mt-10 border-t border-ink/10 pt-6 md:mt-14 md:pt-8">
                <h2 className="font-sans text-[0.68rem] tracking-[0.2em] text-ink/45 uppercase">Drop-off</h2>
                <ol className="mt-4 columns-1 gap-x-12 sm:columns-2">
                  {overview.dropOff.map((row) => (
                    <li key={row.step} className="mb-1 flex justify-between font-sans text-sm">
                      <span>Step {String(row.step).padStart(2, '0')}</span>
                      <span className="tabular-nums text-ink/50">{row.count}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </section>
        ) : null}

        {tab === 'leads' ? (
          <section>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="w-full md:flex-1">
                <label htmlFor="search" className="block font-sans text-[0.68rem] tracking-[0.16em] text-ink/45 uppercase">
                  Search
                </label>
                <input
                  id="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="admin-field max-w-none md:max-w-md"
                />
              </div>
              <button type="button" onClick={() => void exportCsv()} className="admin-cta admin-cta-block md:w-auto">
                Export CSV
              </button>
            </div>

            <div className="mt-6 md:hidden">
              {leads.length === 0 ? <p className="font-sans text-sm text-ink/50">No leads yet.</p> : null}
              {leads.map((lead) => (
                <button key={lead.id} type="button" className="admin-lead-card" onClick={() => void openLead(lead.id)}>
                  <p className="font-display text-base">{lead.full_name || lead.email}</p>
                  <p className="mt-1 truncate font-sans text-sm text-ink/60">{lead.email}</p>
                  <p className="mt-1 font-sans text-xs capitalize text-ink/45">
                    {lead.chronotype} · {lead.email_status}
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
                    <th className="py-3 font-medium">Email status</th>
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
                      <td className="py-3">{lead.email_status}</td>
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
                <h3 className="mt-6 font-sans text-[0.68rem] tracking-[0.16em] text-ink/45 uppercase">Answers</h3>
                <ul className="mt-3 space-y-2 font-sans text-sm">
                  {detail.answers.map((answer) => (
                    <li key={`${answer.step}-${answer.question}`}>
                      <span className="text-ink/45">{answer.question}: </span>
                      {JSON.stringify(answer.answer)}
                    </li>
                  ))}
                </ul>
                <h3 className="mt-6 font-sans text-[0.68rem] tracking-[0.16em] text-ink/45 uppercase">Email events</h3>
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
              <h2 className="font-sans text-xl font-bold md:text-2xl">Create campaign</h2>
              <p className="mt-1 font-sans text-sm text-ink/55">
                Saves a named campaign, then gives you a link, embed, and QR for that slug.
              </p>
              <label htmlFor="campaignName" className="mt-5 block font-sans text-[0.68rem] tracking-[0.16em] text-ink/45 uppercase">
                Campaign name
              </label>
              <input
                id="campaignName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Acme Summit"
                className="admin-field"
              />
              <label htmlFor="campaignSlug" className="mt-4 block font-sans text-[0.68rem] tracking-[0.16em] text-ink/45 uppercase">
                Slug
              </label>
              <input
                id="campaignSlug"
                value={slugInput}
                onChange={(event) => setSlugInput(slugify(event.target.value))}
                placeholder={slugify(name) || 'acme-summit'}
                className="admin-field"
              />
              <p className="mt-2 break-all font-sans text-sm text-ink/40">URL: /?campaign={pendingSlug}</p>
              <p className="mt-4 font-sans text-[0.68rem] tracking-[0.16em] text-ink/45 uppercase">Widget mode</p>
              <div className="admin-mode" role="group" aria-label="Widget mode">
                {WIDGET_MODES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className={mode === item ? 'is-on' : ''}
                  >
                    {widgetLabel(item)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void createCampaign()}
                disabled={saving || !name.trim()}
                className="admin-cta admin-cta-block mt-5"
              >
                {saving ? 'Saving' : 'Save campaign'}
              </button>
              {notice ? <p className="mt-3 font-sans text-sm text-ink/70">{notice}</p> : null}

              <h3 className="mt-8 font-sans text-[0.68rem] tracking-[0.16em] text-ink/45 uppercase">Existing</h3>
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
                        setNotice('');
                      }}
                      className={`flex min-h-12 w-full items-center justify-between gap-3 px-1 text-left font-sans text-sm ${
                        campaignSlug === item.slug ? 'text-ink' : 'text-ink/55'
                      }`}
                    >
                      <span className="min-w-0 truncate font-semibold">{item.name}</span>
                      <span className="shrink-0 text-ink/40">{item.slug}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-sans text-xl font-bold md:text-2xl">Snippets</h2>
              <div className="mt-3 flex items-start justify-between gap-3">
                <p className="min-w-0 break-all font-sans text-sm text-ink/60">{campaignUrl}</p>
                <button
                  type="button"
                  onClick={() => copy('link', campaignUrl)}
                  className="h-11 shrink-0 px-1 text-sm text-ink/50"
                >
                  {copied === 'link' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <Snippet label="iframe" value={iframeSnippet} copied={copied} onCopy={copy} />
              <Snippet label="javascript" value={jsSnippet} copied={copied} onCopy={copy} />
              {qr ? (
                <a href={qr} download={`${campaignSlug}-qr.png`} className="mt-8 inline-block">
                  <img src={qr} alt="Campaign QR code" className="h-40 w-40 rounded-[12px] bg-paper" />
                  <span className="mt-2 block font-sans text-[0.72rem] tracking-[0.14em] uppercase">Download QR</span>
                </a>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function Snippet({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: string;
  onCopy: (label: string, value: string) => void;
}) {
  return (
    <div className="admin-snippet mt-6">
      <div className="flex items-center justify-between">
        <p className="font-sans text-[0.68rem] tracking-[0.16em] uppercase">{label}</p>
        <button type="button" onClick={() => onCopy(label, value)} className="h-11 px-1 text-sm text-ink/50">
          {copied === label ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="mt-2 bg-ink/[0.04] p-3 font-sans text-xs leading-5">{value}</pre>
    </div>
  );
}
