import { SITE_ORIGIN } from '../../infra/env';
import type { HealthReport } from './AdminHealth';

const TOC = [
  { id: 'guide-what', label: 'What this portal does' },
  { id: 'guide-before', label: 'Before a conference' },
  { id: 'guide-floor', label: 'On the floor' },
  { id: 'guide-after', label: 'After the day' },
  { id: 'guide-overview', label: 'Reading Dashboard' },
  { id: 'guide-leads', label: 'Leads and email status' },
  { id: 'guide-resend', label: 'Result email in Resend' },
  { id: 'guide-status', label: 'System status' },
  { id: 'guide-fail', label: 'If something fails' },
  { id: 'guide-owner', label: 'Technical owner' },
] as const;

export function AdminGuide({
  health,
  onOpenCampaigns,
  onOpenLeads,
}: {
  health: HealthReport;
  onOpenCampaigns: () => void;
  onOpenLeads: () => void;
}) {
  return (
    <article className="admin-guide">
      <header className="admin-page-head">
        <div>
          <p className="admin-guide-kicker">Guide</p>
          <h1>Restore admin</h1>
          <p>
            How to run the chronotype survey from this portal: the floor link, the result email, and what to do when a
            number looks wrong. Keep this page on the booth laptop.
          </p>
        </div>
      </header>

      <nav className="admin-guide-toc" aria-label="Guide contents">
        <ol>
          {TOC.map((item, index) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section id="guide-what">
        <h2>What this portal does</h2>
        <p>
          Restore runs a chronotype survey at conferences. A person answers the questions, receives Horizon, Apex, or
          Aurora, and is sent a result email with their two peak windows and the schedule card.
        </p>
        <ul>
          <li>
            <strong>Dashboard</strong> shows traffic, finish rate, drop-off, and result-mail counts for the last 14 days.
          </li>
          <li>
            <strong>Leads</strong> is everyone who finished and left an email. Open a row for answers and the mail log.
          </li>
          <li>
            <strong>Campaigns</strong> is one conference or booth: name, URL slug, result-email design, link, QR, and
            embed.
          </li>
        </ul>
        <p>
          Live site: {SITE_ORIGIN}. Admin sign-in: {SITE_ORIGIN}/admin-login. The survey questions are not edited here.
        </p>
      </section>

      <section id="guide-before">
        <h2>Before a conference</h2>
        <ol className="admin-steps">
          <li>
            <div>
              <p>Open Campaigns and create the conference.</p>
              <p className="admin-guide-note">
                Name is what staff see. Slug is the URL. Example: Future of Work becomes /?campaign=future-of-work
              </p>
              <button type="button" className="admin-guide-go" onClick={onOpenCampaigns}>
                Open Campaigns
              </button>
            </div>
          </li>
          <li>
            <div>
              <p>Leave Result email on Current (Apex / Aurora / Horizon) unless marketing has chosen another layout.</p>
              <p className="admin-guide-note">
                Current sends one published Resend template per chronotype. White, Mist, Hours, Night, and Split are
                alternate layouts. The survey itself does not change.
              </p>
            </div>
          </li>
          <li>
            <div>
              <p>Save campaign. Copy the direct link. Download the QR for print.</p>
              <p className="admin-guide-note">
                Use Page embed only if Restore sits inside another conference page. Use JavaScript widget if that page
                already has its own layout. Inline is the usual booth-tablet mode.
              </p>
            </div>
          </li>
          <li>
            <div>
              <p>Open the campaign link on the booth tablet and complete one test finish to your own Restore address.</p>
              <p className="admin-guide-note">
                Confirm the result screen, then confirm the email arrived. If it did not, read Result email in Resend
                and If something fails, below.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section id="guide-floor">
        <h2>On the floor</h2>
        <ol className="admin-steps">
          <li>
            <div>
              <p>Keep the tablet on the campaign URL. After each person, return to the first screen.</p>
            </div>
          </li>
          <li>
            <div>
              <p>Open Dashboard. Finish rate is completions divided by starts, last 14 days.</p>
              <p className="admin-guide-note">
                A pile-up on Welcome usually means the tablet sat on the first screen between visitors. A quiet chart
                after the event is expected.
              </p>
            </div>
          </li>
          <li>
            <div>
              <p>If someone says they did not get the email, open Leads, find the row, and read Email status.</p>
              <button type="button" className="admin-guide-go" onClick={onOpenLeads}>
                Open Leads
              </button>
            </div>
          </li>
        </ol>
      </section>

      <section id="guide-after">
        <h2>After the day</h2>
        <ol className="admin-steps">
          <li>
            <div>
              <p>On Leads, keep the campaign menu on that conference. Export CSV.</p>
              <p className="admin-guide-note">
                The file includes name, email, campaign, chronotype, and email status. The campaign menu still applies.
              </p>
            </div>
          </li>
          <li>
            <div>
              <p>Scan bounced and failed rows. Those people did not receive their hours.</p>
            </div>
          </li>
        </ol>
      </section>

      <section id="guide-overview">
        <h2>Reading Dashboard</h2>
        <dl className="admin-guide-dl">
          <div>
            <dt>Visitors</dt>
            <dd>Unique browsers that opened a campaign link.</dd>
          </div>
          <div>
            <dt>Started</dt>
            <dd>People who answered at least the first survey step.</dd>
          </div>
          <div>
            <dt>Complete</dt>
            <dd>People who reached the result and submitted an email.</dd>
          </div>
          <div>
            <dt>Emails</dt>
            <dd>
              Result emails sent this calendar month, against the monthly cap. Untagged test mail is not counted.
            </dd>
          </div>
          <div>
            <dt>Horizon, Apex, Aurora</dt>
            <dd>Horizon is morning. Apex is midday. Aurora is afternoon and evening.</dd>
          </div>
          <div>
            <dt>Where people stop</dt>
            <dd>The last step recorded before someone left.</dd>
          </div>
        </dl>
      </section>

      <section id="guide-leads">
        <h2>Leads and email status</h2>
        <p>Click a row for answers, score factors, and the Resend event log. Status means:</p>
        <dl className="admin-guide-dl">
          <div>
            <dt>sent</dt>
            <dd>Resend accepted the result email.</dd>
          </div>
          <div>
            <dt>delivered</dt>
            <dd>The mailbox accepted it.</dd>
          </div>
          <div>
            <dt>opened / clicked</dt>
            <dd>The person opened the email, or used a link in it.</dd>
          </div>
          <div>
            <dt>bounced / permanent_fail</dt>
            <dd>The mailbox rejected it. Check the address.</dd>
          </div>
          <div>
            <dt>failed</dt>
            <dd>Resend returned an error, or the send did not complete.</dd>
          </div>
          <div>
            <dt>queued</dt>
            <dd>Held for the monthly cap, or waiting to send.</dd>
          </div>
        </dl>
      </section>

      <section id="guide-resend">
        <h2>Result email in Resend</h2>
        <p>
          Completions send through Resend. This portal picks the layout per campaign. Wording lives in Resend, not in
          this admin.
        </p>
        <ol className="admin-steps">
          <li>
            <div>
              <p>In Campaigns, set Result email, then Save campaign.</p>
              <p className="admin-guide-note">
                Next finishes on that campaign use that layout. Past leads keep whatever already went out.
              </p>
            </div>
          </li>
          <li>
            <div>
              <p>
                To change copy, open{' '}
                <a href="https://resend.com/templates" target="_blank" rel="noreferrer">
                  resend.com/templates
                </a>
                .
              </p>
            </div>
          </li>
          <li>
            <div>
              <p>Open the matching template. Current production uses three:</p>
              <ul>
                <li>restore-apex-schedule</li>
                <li>restore-aurora-schedule</li>
                <li>restore-horizon-schedule</li>
              </ul>
              <p className="admin-guide-note">
                Alternate campaign layouts (White, Mist, Hours, Night, Split) have their own templates. Edit the one
                this campaign is set to.
              </p>
            </div>
          </li>
          <li>
            <div>
              <p>Edit the draft, then click Publish.</p>
              <p className="admin-guide-note">
                Unpublished drafts do not go to attendees. Live sends use the last published version. The production
                sending key cannot create templates. Publishing in the Resend website is enough.
              </p>
            </div>
          </li>
          <li>
            <div>
              <p>Send one test finish on the campaign and confirm the new copy arrived.</p>
            </div>
          </li>
        </ol>
        <p>
          If Gmail clips a long layout, set that campaign to Night, save, and test again.
        </p>
      </section>

      <section id="guide-status">
        <h2>System status</h2>
        <p>
          Operations is checked about once a minute. Current reading: {health.title}, last checked {health.checked}.
        </p>
        <dl className="admin-guide-dl">
          <div>
            <dt>Running</dt>
            <dd>This admin reached records. New finishes can save.</dd>
          </div>
          <div>
            <dt>Error</dt>
            <dd>
              Records did not load. Floor tablets may still show a cached survey, but new finishes will not save until
              this returns. Retry in a minute. If it holds, call the technical owner.
            </dd>
          </div>
        </dl>
      </section>

      <section id="guide-fail">
        <h2>If something fails</h2>
        <dl className="admin-guide-dl">
          <div>
            <dt>Tablet shows an old campaign</dt>
            <dd>Confirm the URL includes ?campaign= and the correct slug. Refresh once.</dd>
          </div>
          <div>
            <dt>Finish rate is very low</dt>
            <dd>Read Where people stop. Welcome usually means the tablet was left on the first screen.</dd>
          </div>
          <div>
            <dt>Email status queued</dt>
            <dd>The monthly cap is in the way, or the send is waiting. Open Dashboard for the cap, and Leads for that row.</dd>
          </div>
          <div>
            <dt>Email status bounced</dt>
            <dd>The address was rejected. There is nothing to resend from this portal. Collect a correct address.</dd>
          </div>
          <div>
            <dt>Email status failed</dt>
            <dd>
              Resend did not send. Confirm the template is published. If Operations says Error, wait, then retry a
              test finish.
            </dd>
          </div>
          <div>
            <dt>Cannot sign in</dt>
            <dd>Use the conference admin password. After several misses the sign-in waits. Then try once more.</dd>
          </div>
        </dl>
      </section>

      <section id="guide-owner">
        <h2>Technical owner</h2>
        <p>These are not floor tasks. They live with whoever holds the Restore Supabase and Resend accounts.</p>
        <dl className="admin-guide-dl">
          <div>
            <dt>Admin password</dt>
            <dd>Supabase Edge Function secret ADMIN_PASSWORD on the api function. Changing it signs everyone out.</dd>
          </div>
          <div>
            <dt>Monthly email cap</dt>
            <dd>Secret MONTHLY_EMAIL_CAP on the same function. Raise it if result emails start queuing.</dd>
          </div>
          <div>
            <dt>From address</dt>
            <dd>RESEND_FROM. Domain must be verified in Resend or mail will fail.</dd>
          </div>
          <div>
            <dt>Delivery events</dt>
            <dd>
              Resend webhook must point at the resend-webhook function so opened, bounced, and delivered write back to
              Leads.
            </dd>
          </div>
          <div>
            <dt>Template aliases</dt>
            <dd>
              Optional secrets RESEND_TEMPLATE_APEX, RESEND_TEMPLATE_AURORA, RESEND_TEMPLATE_HORIZON override the
              default aliases. Leave them unset unless marketing has published replacements.
            </dd>
          </div>
        </dl>
      </section>
    </article>
  );
}
