import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ConfidenceBar({ value = 0, label, color, delay = 0, showValue = true, height = 8 }) {
  const [animated, setAnimated] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(value), delay * 1000 + 100);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  const getColor = () => {
    if (color) return color;
    if (animated >= 70) return 'var(--color-danger)';
    if (animated >= 40) return 'var(--color-warning)';
    return 'var(--color-safe)';
  };
  
  const barColor = getColor();
  
  return (
    <div style={{ width: '100%' }}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
          {label && (
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {label}
            </span>
          )}
          {showValue && (
            <span style={{ fontSize: '0.78rem', color: barColor, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {animated.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div style={{
        width: '100%',
        height: `${height}px`,
        background: 'var(--color-surface-2)',
        borderRadius: '999px',
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${animated}%` }}
          transition={{ duration: 1, delay: delay, ease: [0.22, 1, 0.36, 1] }}
          style={{
            height: '100%',
            borderRadius: '999px',
            background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
            boxShadow: `0 0 10px ${barColor}40`,
          }}
        />
      </div>
    </div>
  );
}
