import { motion } from 'framer-motion';

export default function KavachLogo({ size = 32, color = 'var(--color-primary)' }) {
  return (
    <motion.div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      whileHover={{ scale: 1.05 }}
    >
      {/* Outer Hexagon Frame */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', filter: `drop-shadow(0 0 8px ${color}44)` }}
      >
        <motion.path
          d="M12 2L3 7V17L12 22L21 17V7L12 2Z"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
        <path
          d="M12 2L3 7V17L12 22L21 17V7L12 2Z"
          stroke={color}
          strokeWidth="0.5"
          strokeOpacity="0.3"
        />
      </svg>

      {/* Inner "Pulse" Shield */}
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute' }}
      >
        <motion.path
          d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          fill={color}
          initial={{ opacity: 0.2, scale: 0.8 }}
          animate={{ 
            opacity: [0.2, 0.5, 0.2],
            scale: [0.8, 1, 0.8]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>

      {/* Center "Eye" or "Core" */}
      <div style={{
        width: size * 0.15,
        height: size * 0.15,
        background: '#fff',
        borderRadius: '50%',
        boxShadow: `0 0 10px #fff, 0 0 20px ${color}`,
        zIndex: 2
      }} />

      {/* Orbiting Particles */}
      {[0, 120, 240].map((angle, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'linear' }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: 3,
            height: 3,
            background: color,
            borderRadius: '50%',
            transform: 'translateX(-50%)',
            boxShadow: `0 0 5px ${color}`
          }} />
        </motion.div>
      ))}
    </motion.div>
  );
}
