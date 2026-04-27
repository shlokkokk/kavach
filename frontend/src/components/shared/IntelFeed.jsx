import { motion } from 'framer-motion';
import { ExternalLink, Newspaper, RefreshCw } from 'lucide-react';
import GlowCard from './GlowCard';
import ShieldLoader from './ShieldLoader';
import useFraudIntel from '../../hooks/useFraudIntel';

function formatTime(value) {
  if (!value) return 'Fresh update';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fresh update';

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function IntelFeed({
  title = 'Live Fraud Intel',
  subtitle = 'Latest scam and cybercrime headlines relevant to the KAVACH threat stack.',
  limit = 5,
  compact = false,
}) {
  const { items, loading, error, lastUpdated, refresh } = useFraudIntel(limit);

  return (
    <GlowCard color="warning" style={{ height: '100%' }}>
      <div className="panel-heading">
        <div>
          <div className="panel-kicker">Live feed</div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => refresh()} type="button">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {loading ? (
        <ShieldLoader text="Pulling live fraud intel..." size={40} />
      ) : error ? (
        <div className="empty-state empty-state-inline">
          <Newspaper size={26} />
          <div>
            <strong>Live feed unavailable</strong>
            <p>{error}</p>
          </div>
        </div>
      ) : (
        <div className={`intel-list ${compact ? 'intel-list-compact' : ''}`}>
          {items.map((item, index) => (
            <motion.a
              key={item.id}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="intel-item"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <div className="intel-item-topline">
                <span>{item.source}</span>
                <ExternalLink size={14} />
              </div>
              <h4>{item.title}</h4>
              {!compact && <p>{item.summary || 'Open the source to read the latest details.'}</p>}
              <div className="intel-item-foot">
                <span>{formatTime(item.publishedAt)}</span>
              </div>
            </motion.a>
          ))}
        </div>
      )}

      <div className="panel-meta">
        <span>Powered by a live public news feed</span>
        <span>{lastUpdated ? `Updated ${formatTime(lastUpdated)}` : 'Waiting for first sync'}</span>
      </div>
    </GlowCard>
  );
}
