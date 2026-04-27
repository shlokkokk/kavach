import { motion } from 'framer-motion';

export default function GlowCard({ children, color = 'primary', hover = true, onClick, style = {}, className = '', id }) {
  const colorMap = {
    primary: { glow: 'rgba(0,255,178,0.15)', border: 'rgba(0,255,178,0.3)', solid: 'var(--color-primary)' },
    danger: { glow: 'rgba(255,59,59,0.15)', border: 'rgba(255,59,59,0.3)', solid: 'var(--color-danger)' },
    warning: { glow: 'rgba(255,184,0,0.15)', border: 'rgba(255,184,0,0.3)', solid: 'var(--color-warning)' },
    info: { glow: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', solid: 'var(--color-info)' },
    purple: { glow: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', solid: '#8b5cf6' },
  };
  
  const c = colorMap[color] || colorMap.primary;
  
  return (
    <motion.div
      whileHover={hover ? { 
        y: -4, 
        borderColor: c.border,
        boxShadow: `0 8px 32px ${c.glow}, 0 0 0 1px ${c.border}`,
      } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={className}
      id={id}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        transition: 'all 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Subtle top edge glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '10%',
        right: '10%',
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${c.border}, transparent)`,
        opacity: 0.5,
      }} />
      {children}
    </motion.div>
  );
}
