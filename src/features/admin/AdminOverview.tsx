import type { AdminOverview } from '../../infra/api';
import { BarList, dropOffRows, LineChart } from './AdminCharts';

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
  const daily = overview.daily ?? [];
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

  return (
    <section className="admin-overview">
      <div className="admin-kpis">
        <div>
          <p className="admin-kicker">Finish rate</p>
          <p className="admin-kpi-num">
            {formatPct(overview.completionRate)}
            <span>%</span>
          </p>
        </div>
        <dl className="admin-kpi-list">
          <div>
            <dt>Visitors</dt>
            <dd>{overview.visitors}</dd>
          </div>
          <div>
            <dt>Started</dt>
            <dd>{overview.started}</dd>
          </div>
          <div>
            <dt>Complete</dt>
            <dd>{overview.completed}</dd>
          </div>
          <div>
            <dt>Emails</dt>
            <dd>
              {overview.email.quotaUsed}/{overview.email.quotaCap}
            </dd>
          </div>
        </dl>
      </div>

      <div className="admin-grid">
        <div className="admin-block">
          <h2>Last 14 days</h2>
          {dailyMax === 0 ? (
            <p className="admin-empty">No starts or completions in this window.</p>
          ) : (
            <LineChart series={daily} aLabel="Started" bLabel="Completed" />
          )}
        </div>

        <div className="admin-block">
          <h2>Chronotype mix</h2>
          <BarList rows={types} />
        </div>

        <div className="admin-block">
          <h2>Where people stop</h2>
          <BarList rows={dropOffRows(overview.dropOff)} />
        </div>

        <div className="admin-block">
          <h2>Result email</h2>
          <p className="admin-note">
            Last 14 days. Open rate {formatPct(openRate)}% of delivered
            {overview.email.complaints ? ` · ${overview.email.complaints} complaints` : ''}
          </p>
          <BarList rows={emailRows} />
        </div>

        <div className="admin-block">
          <h2>Device</h2>
          <BarList rows={overview.devices ?? []} />
        </div>

        <div className="admin-block">
          <h2>Source</h2>
          <BarList rows={overview.sources ?? []} />
        </div>
      </div>

      {(overview.emailStatus ?? []).length ? (
        <div className="admin-block">
          <h2>Completion email status</h2>
          <BarList rows={overview.emailStatus} />
        </div>
      ) : null}

      {showCampaigns && overview.campaigns.length ? (
        <div className="admin-block">
          <h2>Campaigns</h2>
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
