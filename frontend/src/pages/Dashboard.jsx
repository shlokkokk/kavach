import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, AudioWaveform, Smartphone, FileSearch, TrendingUp, Zap, Ban, IndianRupee, Clock, ChevronRight } from 'lucide-react';
import GlowCard from '../components/shared/GlowCard';
import AnimatedNumber from '../components/shared/AnimatedNumber';
import PulsingDot from '../components/shared/PulsingDot';
import ThreatScoreBadge from '../components/shared/ThreatScoreBadge';
import PageWrapper from '../components/layout/PageWrapper';
import useKavachStore from '../store/kavachStore';

const moduleCards = [
  { id: 'audio', icon: AudioWaveform, name: 'Voice Shield', desc: 'Deepfake Audio Detection', color: '#3b82f6', path: '/audio' },
  { id: 'simswap', icon: Smartphone, name: 'SIM Guard', desc: 'SIM Swap Monitoring', color: '#f59e0b', path: '/simswap' },
  { id: 'jobscanner', icon: FileSearch, name: 'Job Shield', desc: 'Fake Job Offer Scanner', color: '#ef4444', path: '/jobscanner' },
];

export default function Dashboard() {
  const { stats, scanHistory } = useKavachStore();
  
  const statCards = [
    { icon: Zap, label: 'Total Scans', value: stats.totalScans, color: 'var(--color-primary)' },
    { icon: TrendingUp, label: 'Threats Detected', value: stats.threatsDetected, color: 'var(--color-danger)' },
    { icon: Ban, label: 'Scams Blocked', value: stats.scamsBlocked, color: 'var(--color-warning)' },
    { icon: IndianRupee, label: 'Est. Money Saved', value: stats.moneySaved, prefix: '₹', color: 'var(--color-safe)' },
  ];
  
  return (
    <PageWrapper>
      <div className="app-shell">
        <div className="k-page-header">
          <div>
            <h1 className="k-page-title"><Shield size={28} style={{ color: 'var(--color-primary)' }} /> Command Center</h1>
            <p className="k-page-subtitle">Real-time control surface across Voice Shield, SIM Guard, and Job Shield with synchronized fraud telemetry.</p>
          </div>
          <div className="badge badge-info">
            <PulsingDot status="active" size="sm" />
            Security Fabric Online
          </div>
        </div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="k-kpi-grid">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <GlowCard>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{s.label}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.color }}>
                      <AnimatedNumber value={s.value} prefix={s.prefix || ''} />
                    </div>
                  </div>
                  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={20} style={{ color: s.color }} />
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>
        
        <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--color-primary)' }}>●</span> Protection Modules
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '14px', fontSize: '0.9rem' }}>Aligned module cards with live status indicators and direct launch routing.</p>
        <div className="k-module-grid">
          {moduleCards.map((mod, i) => (
            <motion.div key={mod.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
              <Link to={mod.path} style={{ textDecoration: 'none' }}>
                <GlowCard style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: `${mod.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <mod.icon size={22} style={{ color: mod.color }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PulsingDot status="active" size="sm" />
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>ACTIVE</span>
                    </div>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{mod.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>{mod.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.8rem', color: mod.color, fontWeight: 600 }}>Launch Module</span>
                    <ChevronRight size={16} style={{ color: mod.color }} />
                  </div>
                </GlowCard>
              </Link>
            </motion.div>
          ))}
        </div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'var(--color-primary)' }} /> Recent Scan Activity
          </h3>
          <GlowCard>
            {scanHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-muted)' }}>
                <Shield size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <p style={{ fontSize: '1rem', marginBottom: '8px' }}>No scans yet</p>
                <p style={{ fontSize: '0.85rem' }}>Start by scanning a job offer, analyzing audio, or monitoring SIM activity</p>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none' }}>
                <table>
                  <thead><tr><th>Module</th><th>Input</th><th>Threat Level</th><th>Score</th><th>Time</th></tr></thead>
                  <tbody>
                    {scanHistory.slice(0, 10).map((scan, i) => (
                      <tr key={scan.id || i}>
                        <td><span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: scan.moduleColor || 'var(--color-primary)' }} />{scan.module}</span></td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.input}</td>
                        <td><ThreatScoreBadge level={scan.threatLevel} /></td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{scan.score}%</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-muted)' }}>{scan.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlowCard>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
