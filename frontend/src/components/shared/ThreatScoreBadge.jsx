import { motion } from 'framer-motion';

export default function ThreatScoreBadge({ level, score, style = {} }) {
  const config = {
    HIGH: { label: 'HIGH RISK', bg: 'var(--color-danger-dim)', color: 'var(--color-danger)', border: 'rgba(255,59,59,0.3)' },
    MEDIUM: { label: 'MEDIUM', bg: 'var(--color-warning-dim)', color: 'var(--color-warning)', border: 'rgba(255,184,0,0.3)' },
    LOW: { label: 'LOW RISK', bg: 'var(--color-safe-dim)', color: 'var(--color-safe)', border: 'rgba(0,200,83,0.3)' },
    SCAM: { label: 'SCAM', bg: 'var(--color-danger-dim)', color: 'var(--color-danger)', border: 'rgba(255,59,59,0.3)' },
    SUSPICIOUS: { label: 'SUSPICIOUS', bg: 'var(--color-warning-dim)', color: 'var(--color-warning)', border: 'rgba(255,184,0,0.3)' },
    LEGITIMATE: { label: 'LEGITIMATE', bg: 'var(--color-safe-dim)', color: 'var(--color-safe)', border: 'rgba(0,200,83,0.3)' },
    FAKE: { label: 'AI-GENERATED', bg: 'var(--color-danger-dim)', color: 'var(--color-danger)', border: 'rgba(255,59,59,0.3)' },
    REAL: { label: 'HUMAN', bg: 'var(--color-safe-dim)', color: 'var(--color-safe)', border: 'rgba(0,200,83,0.3)' },
    VERIFIED: { label: 'VERIFIED', bg: 'var(--color-safe-dim)', color: 'var(--color-safe)', border: 'rgba(0,200,83,0.3)' },
    UNVERIFIED: { label: 'UNVERIFIED', bg: 'var(--color-danger-dim)', color: 'var(--color-danger)', border: 'rgba(255,59,59,0.3)' },
  };
  
  const c = config[level] || config.LOW;
  
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 14px',
        borderRadius: '999px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        ...style,
      }}
    >
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: c.color,
        boxShadow: `0 0 6px ${c.color}`,
      }} />
      {c.label}
      {score !== undefined && (
        <span style={{ marginLeft: '4px', opacity: 0.8 }}>{score}%</span>
      )}
    </motion.span>
  );
}
