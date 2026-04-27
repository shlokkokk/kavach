import { Shield, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ShieldLoader({ text = 'Analyzing...', size = 48 }) {
  return (
    <div className="shield-loader">
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'var(--color-primary)',
            borderRightColor: 'rgba(0,255,178,0.3)',
          }}
        />
        {/* Pulsing shield */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
        >
          <Shield size={size * 0.6} style={{ color: 'var(--color-primary)', filter: 'drop-shadow(0 0 12px rgba(0,255,178,0.5))' }} />
        </motion.div>
      </div>
      <motion.span
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="loader-text"
      >
        {text}
      </motion.span>
    </div>
  );
}
