import type { AdminOverview } from '../../infra/api';
import { BarList, dropOffRows, LineChart } from './AdminCharts';
import { AdminHint } from './AdminHint';

function formatPct(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return String(Math.round(value * 100));
}

export function AdminOverviewPanel({
  overview,
  showCampaigns,
}: {
  overview: AdminOverview;
  showCampaigns: boolean;
}) {
  const daily = overview.daily;
  const dailyMax = Math.max(...daily.flatMap((point) => [point.started, point.completed]), 0);
  const types = [
    { label: 'Horizon', count: overview.chronotypes.horizon },
    { label: 'Apex', count: overview.chronotypes.apex },
    { label: 'Aurora', count: overview.chronotypes.aurora },
  ];
  const emailRows = [
    { label: 'Sent', count: overview.email.sent },
    { label: 'Delivered', count: overview.email.delivered },
    { label: 'Opened', count: overview.email.opened },
    { label: 'Clicked', count: overview.email.clicked },
    { label: 'Bounced', count: overview.email.bounced },
  ];
  const openRate = overview.email.delivered ? overview.email.opened / overview.email.delivered : 0;
  const quotaRatio = overview.email.quotaCap ? overview.email.quotaUsed / overview.email.quotaCap : 0;
  const bounceRatio = overview.email.sent ? overview.email.bounced / overview.email.sent : 0;

  return (
    <section className="admin-overview">
      {quotaRatio >= 0.8 ? (
        <p className="admin-action">
          Monthly result-email cap is nearly used ({overview.email.quotaUsed} of {overview.email.quotaCap}). New
          completions will wait until next month unless the cap is raised.
        </p>
      ) : null}
      {bounceRatio >= 0.2 && overview.email.sent >= 5 ? (
        <p className="admin-action">
          {overview.email.bounced} of {overview.email.sent} result emails bounced. Open Leads and check the addresses.
        </p>
      ) : null}

      <div className="admin-kpis">
        <div>
          <p className="admin-kicker">
            Finish rate
            <AdminHint label="Finish rate">
              People who finished the survey, divided by people who started it, in the last 14 days.
            </AdminHint>
          </p>
          <p className="admin-kpi-num">
            {formatPct(overview.completionRate)}
            <span>%</span>
          </p>
        </div>
        <dl className="admin-kpi-list">
          <div>
            <dt>
              Visitors
              <AdminHint label="Visitors">Unique browsers that opened a campaign link.</AdminHint>
            </dt>
            <dd>{overview.visitors}</dd>
          </div>
          <div>
            <dt>
              Started
              <AdminHint label="Started">People who answered at least the first survey step.</AdminHint>
            </dt>
            <dd>{overview.started}</dd>
          </div>
          <div>
            <dt>
              Complete
              <AdminHint label="Complete">People who reached the result and submitted an email.</AdminHint>
            </dt>
            <dd>{overview.completed}</dd>
          </div>
          <div>
            <dt>
              Emails
              <AdminHint label="Email cap">
                Result emails sent this calendar month, against the monthly cap. Untagged test mail is not counted.
              </AdminHint>
            </dt>
            <dd>
              {overview.email.quotaUsed}/{overview.email.quotaCap}
            </dd>
          </div>
        </dl>
      </div>

      <div className="admin-grid">
        <div className="admin-block">
          <h2>
            Last 14 days
            <AdminHint label="Daily chart">Starts and completions by day. A gap after a conference usually means the booth link is idle.</AdminHint>
          </h2>
          {dailyMax === 0 ? (
            <p className="admin-empty">No starts or completions in this window.</p>
          ) : (
            <LineChart series={daily} aLabel="Started" bLabel="Completed" />
          )}
        </div>

        <div className="admin-block">
          <h2>
            Chronotype mix
            <AdminHint label="Chronotype mix">
              Horizon: morning. Apex: midday. Aurora: afternoon and evening. These are the three Restore results.
            </AdminHint>
          </h2>
          <BarList rows={types} />
        </div>

        <div className="admin-block">
          <h2>
            Where people stop
            <AdminHint label="Drop-off">
              The last step recorded before someone left. A pile-up on Welcome usually means the first screen sat open, or people opened the link and left.
            </AdminHint>
          </h2>
          <BarList rows={dropOffRows(overview.dropOff)} />
        </div>

        <div className="admin-block">
          <h2>
            Result email
            <AdminHint label="Result email">
              If delivered is far below sent, check bounces on Leads.
            </AdminHint>
          </h2>
          <p className="admin-note">
            Last 14 days. Open rate {formatPct(openRate)}% of delivered
            {overview.email.complaints ? ` · ${overview.email.complaints} complaints` : ''}
          </p>
          <BarList rows={emailRows} />
        </div>

        <div className="admin-block">
          <h2>
            Device
            <AdminHint label="Device">Phone, tablet, or computer used to open the survey.</AdminHint>
          </h2>
          <BarList rows={overview.devices} />
        </div>

        <div className="admin-block">
          <h2>
            Source
            <AdminHint label="Source">How the visit arrived: campaign link, QR, embed, or a direct open.</AdminHint>
          </h2>
          <BarList rows={overview.sources} />
        </div>
      </div>

      {overview.emailStatus.length ? (
        <div className="admin-block">
          <h2>
            Completion email status
            <AdminHint label="Completion email status">
              Latest result-email status on each completed survey. Bounced or failed means the person did not get their hours.
            </AdminHint>
          </h2>
          <BarList rows={overview.emailStatus} />
        </div>
      ) : null}

      {showCampaigns && overview.campaigns.length ? (
        <div className="admin-block">
          <h2>
            Campaigns
            <AdminHint label="Campaign table">
              Starts and completions by conference. Open Campaigns to copy a link or QR for a specific booth.
            </AdminHint>
          </h2>
          <div className="admin-table-wrap">
            <table className="admin-mini-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Started</th>
                  <th>Complete</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {overview.campaigns.map((campaign) => {
                  const started = campaign.started || 0;
                  const completed = campaign.completed || 0;
                  return (
                    <tr key={campaign.id}>
                      <td>{campaign.name}</td>
                      <td className="tabular-nums">{started}</td>
                      <td className="tabular-nums">{completed}</td>
                      <td className="tabular-nums">{started ? `${formatPct(completed / started)}%` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
