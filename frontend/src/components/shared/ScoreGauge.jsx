import { motion } from 'framer-motion';

export default function ScoreGauge({ score = 0, size = 200, strokeWidth = 12, label, color }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const getColor = () => {
    if (color) return color;
    if (score >= 70) return 'var(--color-danger)';
    if (score >= 40) return 'var(--color-warning)';
    return 'var(--color-safe)';
  };
  
  const gaugeColor = getColor();
  const offset = circumference - (score / 100) * circumference;
  
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(20, 42, 68, 0.92)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          width: size * 0.74,
          height: size * 0.74,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(7,16,30,0.96) 35%, rgba(6,14,26,0.82) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          boxShadow: `inset 0 0 20px rgba(255,255,255,0.02), 0 0 26px ${gaugeColor}30`,
          pointerEvents: 'none',
        }}
      />
      <div style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: size * 0.2,
            fontWeight: 700,
            color: gaugeColor,
            lineHeight: 1,
            textShadow: `0 0 20px ${gaugeColor}60`,
          }}
        >
          {Math.round(score)}
        </motion.span>
        {label && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--color-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginTop: '4px',
            }}
          >
            {label}
          </motion.span>
        )}
      </div>
    </div>
  );
}
