import { motion } from 'framer-motion';
import {
  AlertTriangle,
  AudioWaveform,
  BookOpen,
  ExternalLink,
  FileSearch,
  RefreshCw,
  Shield,
  Smartphone,
} from 'lucide-react';
import GlowCard from '../components/shared/GlowCard';
import PageWrapper from '../components/layout/PageWrapper';
import ShieldLoader from '../components/shared/ShieldLoader';
import useFraudIntel from '../hooks/useFraudIntel';

const playbooks = [
  {
    title: 'Voice Deepfake Calls',
    icon: AudioWaveform,
    color: '#3b82f6',
    actions: [
      'Disconnect and call back using the official number from website/app.',
      'Never share OTP, card PIN, UPI PIN, or remote access permissions.',
      'Demand a verifiable reference ID before taking action.',
    ],
  },
  {
    title: 'SIM Swap Alerts',
    icon: Smartphone,
    color: '#f59e0b',
    actions: [
      'If signal suddenly drops, call your operator from another device.',
      'Freeze net-banking/UPI immediately and notify your bank hotline.',
      'Switch critical accounts to app-based 2FA where possible.',
    ],
  },
  {
    title: 'Job Offer Fraud',
    icon: FileSearch,
    color: '#ef4444',
    actions: [
      'Reject any role that asks for registration or processing fee.',
      'Verify company domain email, MCA listing, and recruiter identity.',
      'Treat urgency, no-interview hiring, and WhatsApp-only flow as red flags.',
    ],
  },
];

const reportLinks = [
  {
    name: 'National Cyber Crime Portal',
    url: 'https://cybercrime.gov.in',
    desc: 'Report cyber fraud incidents with evidence.',
  },
  {
    name: 'Cyber Helpline 1930',
    url: 'tel:1930',
    desc: 'Emergency reporting for financial cyber fraud.',
  },
  {
    name: 'RBI Sachet',
    url: 'https://sachet.rbi.org.in',
    desc: 'Financial fraud and unregulated scheme reporting.',
  },
];

function formatTime(value) {
  if (!value) return 'Just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function compactSource(value = '') {
  return value.length > 24 ? `${value.slice(0, 24)}...` : value;
}

export default function Education() {
  const { items, loading, error, refresh, lastUpdated } = useFraudIntel(12);
  const validItems = items.filter(
    (item) => item?.title && item.title.trim().length > 20 && item?.link && item.link !== '#'
  );
  const tickerItems = validItems.slice(0, 8);
  const canAutoScroll = validItems.length > 2;

  return (
    <PageWrapper>
      <div className="edu-page">
        <div className="page-header edu-header">
          <h1>
            <BookOpen size={28} style={{ color: 'var(--color-warning)' }} />
            Fraud Intel Live
          </h1>
          <p>
            Live external cyber-fraud headlines with response playbooks for Voice Shield, SIM Guard, and Job Shield.
          </p>
          <div className="edu-header-actions">
            <span>Updated: {lastUpdated ? formatTime(lastUpdated) : 'Waiting for first sync'}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => refresh()} type="button">
              <RefreshCw size={14} />
              Refresh Feed
            </button>
          </div>
        </div>

        <motion.div
          className="edu-ticker-shell"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {loading ? (
            <div className="edu-ticker-placeholder">Syncing live fraud intel feed...</div>
          ) : error ? (
            <div className="edu-ticker-error">
              <AlertTriangle size={16} />
              <span>Live feed unavailable: {error}</span>
            </div>
            ) : tickerItems.length > 0 ? (
            <div className="edu-ticker-track">
              {[...tickerItems, ...tickerItems].map((item, idx) => (
                <a
                  key={`${item.id}-${idx}`}
                  href={item.link}
                  className="edu-ticker-item"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="edu-ticker-source">{compactSource(item.source)}</span>
                  <span className="edu-ticker-title">{item.title}</span>
                </a>
              ))}
            </div>
            ) : (
            <div className="edu-ticker-placeholder">No live items found right now.</div>
          )}
        </motion.div>

        <div className="edu-main-grid">
          <GlowCard color="warning" className="edu-live-rail">
            <div className="edu-panel-head">
              <div>
                <div className="panel-kicker">Auto scrolling</div>
                <h3>Threat Stream</h3>
              </div>
              <span className="edu-rail-status">{canAutoScroll ? 'Live loop' : `${validItems.length} headlines`}</span>
            </div>

            {loading ? (
              <ShieldLoader text="Fetching live headlines..." size={40} />
            ) : error ? (
              <div className="empty-state empty-state-inline">
                <AlertTriangle size={24} />
                <div>
                  <strong>Feed temporarily unavailable</strong>
                  <p>{error}</p>
                </div>
              </div>
            ) : validItems.length === 0 ? (
              <div className="empty-state empty-state-inline">
                <AlertTriangle size={24} />
                <div>
                  <strong>No valid live updates right now</strong>
                  <p>Feed returned incomplete items. Try refresh in a moment.</p>
                </div>
              </div>
            ) : (
              <div className="edu-rail-viewport">
                <div className={`edu-rail-marquee ${canAutoScroll ? 'edu-rail-marquee-animated' : ''}`}>
                  <div className="edu-rail-group">
                    {validItems.map((item, index) => (
                      <a
                        className="edu-rail-item"
                        href={item.link}
                        key={`${item.id}-rail-${index}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <div className="edu-rail-topline">
                          <span>{item.source}</span>
                          <ExternalLink size={14} />
                        </div>
                        <h4>{item.title}</h4>
                        <p>{item.summary || 'Tap to view full intel coverage from source.'}</p>
                        <span className="edu-rail-time">{formatTime(item.publishedAt)}</span>
                      </a>
                    ))}
                  </div>

                  {canAutoScroll && (
                    <div className="edu-rail-group" aria-hidden="true">
                      {validItems.map((item, index) => (
                        <a
                          className="edu-rail-item"
                          href={item.link}
                          key={`${item.id}-rail-loop-${index}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          tabIndex={-1}
                        >
                          <div className="edu-rail-topline">
                            <span>{item.source}</span>
                            <ExternalLink size={14} />
                          </div>
                          <h4>{item.title}</h4>
                          <p>{item.summary || 'Tap to view full intel coverage from source.'}</p>
                          <span className="edu-rail-time">{formatTime(item.publishedAt)}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </GlowCard>

          <GlowCard>
            <div className="edu-panel-head">
              <div>
                <div className="panel-kicker">Action mode</div>
                <h3>Rapid Response Playbooks</h3>
              </div>
            </div>
            <div className="edu-playbooks">
              {playbooks.map((playbook) => (
                <div className="edu-playbook" key={playbook.title}>
                  <div className="edu-playbook-head">
                    <div className="edu-playbook-icon" style={{ background: `${playbook.color}20` }}>
                      <playbook.icon size={18} style={{ color: playbook.color }} />
                    </div>
                    <h4>{playbook.title}</h4>
                  </div>
                  <div className="edu-tip-list">
                    {playbook.actions.map((action) => (
                      <div className="edu-tip-item" key={action}>
                        <Shield size={13} />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlowCard>

          <GlowCard className="edu-report-panel">
            <div className="edu-panel-head">
              <div>
                <div className="panel-kicker">Escalation</div>
                <h3>Report and Recover</h3>
              </div>
            </div>
            <div className="edu-report-grid">
              {reportLinks.map((link) => (
                <a key={link.name} href={link.url} rel="noopener noreferrer" target="_blank" className="edu-report-link">
                  <div>
                    <h4>{link.name}</h4>
                    <p>{link.desc}</p>
                  </div>
                  <ExternalLink size={14} />
                </a>
              ))}
            </div>
          </GlowCard>
        </div>
      </div>
    </PageWrapper>
  );
}
