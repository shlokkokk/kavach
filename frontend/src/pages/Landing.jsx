import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, AudioWaveform, Smartphone, FileSearch, ArrowRight, TrendingUp, Users, AlertTriangle, IndianRupee, ChevronDown } from 'lucide-react';
import ParticleBackground from '../components/shared/ParticleBackground';
import GlowCard from '../components/shared/GlowCard';
import { INDIA_FRAUD_STATS } from '../utils/constants';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const modules = [
  {
    icon: AudioWaveform,
    title: 'Voice Shield',
    subtitle: 'Deepfake Audio Detector',
    desc: 'Detects AI-generated voice calls using spectral analysis and MFCC feature extraction. Catches deepfake voices impersonating bank officials and family members.',
    color: '#3b82f6',
    path: '/audio',
    tag: 'ML-POWERED',
  },
  {
    icon: Smartphone,
    title: 'SIM Guard',
    subtitle: 'SIM Swap Detection',
    desc: 'Real-time monitoring of SIM swap attacks. Detects unauthorized SIM changes, device mismatches, and suspicious OTP requests with automatic transaction freezing.',
    color: '#f59e0b',
    path: '/simswap',
    tag: 'REAL-TIME',
  },
  {
    icon: FileSearch,
    title: 'Job Shield',
    subtitle: 'Fake Job Offer Scanner',
    desc: 'AI-powered analysis of job offers using NVIDIA NIM. Identifies scam patterns, verifies companies against MCA21, and highlights red flags in real-time.',
    color: '#ef4444',
    path: '/jobscanner',
    tag: 'AI-ANALYSIS',
  },
];

const stats = [
  { icon: IndianRupee, label: 'Annual Fraud Loss', value: INDIA_FRAUD_STATS.totalLoss, color: 'var(--color-danger)' },
  { icon: AlertTriangle, label: 'Daily Cases in India', value: INDIA_FRAUD_STATS.dailyCases, color: 'var(--color-warning)' },
  { icon: Users, label: 'Avg Loss Per Victim', value: INDIA_FRAUD_STATS.avgLoss, color: 'var(--color-info)' },
  { icon: TrendingUp, label: 'Recovery Rate', value: INDIA_FRAUD_STATS.recoveryRate, color: 'var(--color-primary)' },
];

const attackSteps = [
  { step: 1, title: 'Fake Job Offer', desc: 'Victim receives scam job on WhatsApp', icon: FileSearch, module: 'Job Shield', color: '#ef4444' },
  { step: 2, title: 'Deepfake Voice Call', desc: 'Scammer calls with AI-cloned HR voice', icon: AudioWaveform, module: 'Voice Shield', color: '#3b82f6' },
  { step: 3, title: 'SIM Swap Attack', desc: 'SIM hijacked to steal OTPs & money', icon: Smartphone, module: 'SIM Guard', color: '#f59e0b' },
];

export default function Landing() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <ParticleBackground count={60} />
        <div className="hero-grid-bg" />
        <div className="hero-radial" />
        
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{ position: 'relative', zIndex: 1 }}
        >
          {/* Shield icon */}
          <motion.div variants={item} style={{ marginBottom: '24px' }}>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ display: 'inline-flex' }}
            >
              <Shield size={64} style={{ color: 'var(--color-primary)', filter: 'drop-shadow(0 0 30px rgba(0,255,178,0.5))' }} />
            </motion.div>
          </motion.div>
          
          <motion.h1 variants={item}>KAVACH</motion.h1>
          
          <motion.p variants={item} className="hindi-subtitle">
            कवच — Digital Armor for Every Indian
          </motion.p>
          
          <motion.p variants={item} className="subtitle">
            India's first unified AI-powered platform that detects deepfake voice calls, 
            SIM swap attacks, and fake job offers — in real time.
          </motion.p>
          
          <motion.div variants={item} style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard" id="hero-enter-dashboard">
              <motion.button
                className="btn btn-primary btn-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Enter Command Center
                <ArrowRight size={18} />
              </motion.button>
            </Link>
            <a href="#attack-chain" id="hero-learn-more">
              <motion.button
                className="btn btn-outline btn-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                See The Attack Chain
                <ChevronDown size={18} />
              </motion.button>
            </a>
          </motion.div>
        </motion.div>
        
        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ position: 'absolute', bottom: '40px', color: 'var(--color-muted)' }}
        >
          <ChevronDown size={24} />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '0.82rem', color: 'var(--color-danger)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>
              The Crisis
            </h2>
            <h3 style={{ fontSize: '2rem' }}>India's Cyber Fraud Emergency</h3>
          </div>
          
          <div className="grid-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlowCard color={i === 0 ? 'danger' : i === 1 ? 'warning' : i === 2 ? 'info' : 'primary'}>
                  <stat.icon size={24} style={{ color: stat.color, marginBottom: '12px' }} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 700, color: stat.color, marginBottom: '4px' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{stat.label}</div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Attack Chain Section */}
      <section id="attack-chain" style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>
              How Scammers Attack
            </h2>
            <h3 style={{ fontSize: '2rem' }}>The 3-Step Attack Chain</h3>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '12px auto 0' }}>
              Modern cyber fraud isn't a single attack — it's a coordinated chain. KAVACH catches scammers at every step.
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '700px', margin: '0 auto' }}>
            {attackSteps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
              >
                <GlowCard color={step.color === '#ef4444' ? 'danger' : step.color === '#3b82f6' ? 'info' : 'warning'}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                      background: `${step.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <step.icon size={24} style={{ color: step.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: step.color, background: `${step.color}15`, padding: '2px 8px', borderRadius: '4px' }}>
                          STEP {step.step}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-primary)', background: 'var(--color-primary-dim)', padding: '2px 8px', borderRadius: '4px' }}>
                          ✓ {step.module} BLOCKS
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>{step.title}</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{step.desc}</p>
                    </div>
                  </div>
                </GlowCard>
                
                {/* Connector line */}
                {i < attackSteps.length - 1 && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 + 0.3 }}
                    style={{
                      width: '2px', height: '24px', margin: '0 auto',
                      background: `linear-gradient(to bottom, ${step.color}40, ${attackSteps[i + 1].color}40)`,
                      transformOrigin: 'top',
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Modules Section */}
      <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>
              Three Shields
            </h2>
            <h3 style={{ fontSize: '2rem' }}>Protection Modules</h3>
          </div>
          
          <div className="grid-3">
            {modules.map((mod, i) => (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Link to={mod.path} style={{ textDecoration: 'none' }}>
                  <GlowCard
                    color={mod.color === '#3b82f6' ? 'info' : mod.color === '#f59e0b' ? 'warning' : 'danger'}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                        background: `${mod.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <mod.icon size={22} style={{ color: mod.color }} />
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                        color: mod.color, background: `${mod.color}15`,
                        padding: '3px 8px', borderRadius: '4px',
                        border: `1px solid ${mod.color}30`,
                      }}>
                        {mod.tag}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{mod.title}</h4>
                    <p style={{ fontSize: '0.82rem', color: mod.color, fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>{mod.subtitle}</p>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, flex: 1 }}>{mod.desc}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', color: mod.color, fontSize: '0.85rem', fontWeight: 600 }}>
                      Launch Module <ArrowRight size={14} />
                    </div>
                  </GlowCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '80px 20px 100px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ maxWidth: '600px', margin: '0 auto' }}
        >
          <h3 style={{ fontSize: '2rem', marginBottom: '12px' }}>
            One platform. Three shields.
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', fontSize: '1.05rem' }}>
            Because scammers don't use one trick — and neither does KAVACH.
          </p>
          <Link to="/dashboard">
            <motion.button
              className="btn btn-primary btn-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              id="cta-enter-dashboard"
            >
              Enter Command Center <ArrowRight size={18} />
            </motion.button>
          </Link>
        </motion.div>
      </section>
      
      {/* Footer */}
      <footer style={{
        padding: '24px', borderTop: '1px solid var(--color-border)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
        fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-muted)',
      }}>
        <Shield size={14} style={{ color: 'var(--color-primary)' }} />
        KAVACH — Built for India's Digital Safety
      </footer>
    </div>
  );
}
