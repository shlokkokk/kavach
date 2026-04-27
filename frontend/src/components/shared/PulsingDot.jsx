import { motion } from 'framer-motion';

const sizeMap = { sm: 8, md: 10, lg: 14 };

export default function PulsingDot({ status = 'active', size = 'md', style = {} }) {
  const colorMap = {
    active: 'var(--color-primary)',
    danger: 'var(--color-danger)',
    warning: 'var(--color-warning)',
    safe: 'var(--color-safe)',
    idle: 'var(--color-muted)',
  };
  
  const color = colorMap[status] || colorMap.active;
  const px = sizeMap[size] || sizeMap.md;
  
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: px, height: px, ...style }}>
      {status !== 'idle' && (
        <motion.span
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: color,
          }}
        />
      )}
      <span style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: color,
        position: 'relative',
        boxShadow: status !== 'idle' ? `0 0 6px ${color}` : 'none',
      }} />
    </span>
  );
}
