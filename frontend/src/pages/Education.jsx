import { motion } from 'framer-motion';
import { BookOpen, Shield, AlertTriangle, Phone, FileSearch, AudioWaveform, Smartphone, ExternalLink, Brain, TrendingUp } from 'lucide-react';
import GlowCard from '../components/shared/GlowCard';
import PageWrapper from '../components/layout/PageWrapper';

const fraudTypes = [
  {
    icon: AudioWaveform, color: '#3b82f6', title: 'Deepfake Voice Scams',
    desc: 'Scammers use AI to clone voices of bank officials, family members, or HR personnel to trick victims into transferring money or sharing OTPs.',
    tips: ['Always verify calls by calling back on official numbers', 'Be suspicious of urgency or pressure tactics', 'Ask personal questions only the real person would know', 'Never share OTP over phone calls'],
    stat: '₹2,800 Cr lost in 2024',
  },
  {
    icon: Smartphone, color: '#f59e0b', title: 'SIM Swap Attacks',
    desc: 'Fraudsters convince telecom operators to transfer your number to a new SIM, then intercept your OTPs to drain bank accounts.',
    tips: ['Set a SIM lock PIN with your operator', 'Enable app-based 2FA instead of SMS', 'Monitor unexpected "No Service" on your phone', 'Report SIM swap immediately to bank & police'],
    stat: '₹1,200 Cr lost in 2024',
  },
  {
    icon: FileSearch, color: '#ef4444', title: 'Fake Job Offers',
    desc: 'Scam messages promising high salaries for no experience, asking for registration fees or personal documents before any real interview.',
    tips: ['Legitimate companies never charge candidates', 'Verify company on MCA21 (mca.gov.in)', 'Check for Gmail/Yahoo official emails (red flag)', 'Never pay "registration" or "processing" fees'],
    stat: '₹3,100 Cr lost in 2024',
  },
  {
    icon: Phone, color: '#8b5cf6', title: 'Phishing & Vishing',
    desc: 'Fake calls, SMS, or emails impersonating banks, government, or delivery services to steal personal information and banking credentials.',
    tips: ['Never click links in unexpected SMS/emails', 'Banks never ask for full card number via phone', 'Check URLs carefully for misspellings', 'Report phishing to cybercrime.gov.in'],
    stat: '₹4,200 Cr lost in 2024',
  },
];

const reportLinks = [
  { name: 'National Cyber Crime Portal', url: 'https://cybercrime.gov.in', desc: 'Official Government of India portal' },
  { name: 'Helpline: 1930', url: 'tel:1930', desc: 'National cyber fraud helpline' },
  { name: 'RBI Sachet', url: 'https://sachet.rbi.org.in', desc: 'Report financial fraud' },
];

export default function Education() {
  return (
    <PageWrapper>
      <div style={{ maxWidth: '1200px' }}>
        <div className="page-header">
          <h1><BookOpen size={28} style={{ color: '#8b5cf6' }} /> Fraud Intel Hub</h1>
          <p>Learn to identify and protect yourself from digital fraud</p>
        </div>

        {/* Fraud Types */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
          {fraudTypes.map((fraud, i) => (
            <motion.div key={fraud.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <GlowCard color={fraud.color === '#3b82f6' ? 'info' : fraud.color === '#f59e0b' ? 'warning' : fraud.color === '#ef4444' ? 'danger' : 'purple'}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: `${fraud.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <fraud.icon size={24} style={{ color: fraud.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '1.2rem' }}>{fraud.title}</h3>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-danger)', background: 'var(--color-danger-dim)', padding: '3px 8px', borderRadius: '4px' }}>
                        {fraud.stat}
                      </span>
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: 1.7 }}>{fraud.desc}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px' }}>
                      {fraud.tips.map((tip, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 12px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                          <Shield size={14} style={{ color: 'var(--color-primary)', marginTop: '2px', flexShrink: 0 }} />
                          <span style={{ color: 'var(--color-text-secondary)' }}>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>

        {/* Report Links */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} /> Report Fraud
          </h3>
          <div className="grid-3">
            {reportLinks.map((link) => (
              <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <GlowCard style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '1rem' }}>{link.name}</h4>
                    <ExternalLink size={16} style={{ color: 'var(--color-muted)' }} />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{link.desc}</p>
                </GlowCard>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
