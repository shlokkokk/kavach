import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedNumber({ value, duration = 1.5, prefix = '', suffix = '', decimals = 0, style = {} }) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef(null);
  
  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    const startTime = performance.now();
    const dur = duration * 1000;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / dur, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;
      
      setDisplayValue(current);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);
  
  const formatted = decimals > 0 
    ? displayValue.toFixed(decimals) 
    : Math.round(displayValue).toLocaleString('en-IN');
  
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        ...style,
      }}
    >
      {prefix}{formatted}{suffix}
    </motion.span>
  );
}
