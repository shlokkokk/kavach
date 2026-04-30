import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, PanelLeftClose, PanelLeftOpen, Activity, Bell, Trash2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import KavachLogo from '../shared/KavachLogo';
import useKavachStore from '../../store/kavachStore';

export default function Navbar() {
  const location = useLocation();
  const { stats, toggleSidebar, sidebarOpen, scanHistory } = useKavachStore();
  const [showNotif, setShowNotif] = useState(false);
  
  const isLanding = location.pathname === '/';
  
  return (
    <motion.nav
      className="glass-strong k-main-nav"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--navbar-height)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: `1px solid var(--color-border)`,
      }}
    >
      {/* Left section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {!isLanding && (
          <button
            onClick={toggleSidebar}
            className="btn-icon btn-ghost"
            style={{ 
              width: '36px', height: '36px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0
            }}
            id="sidebar-toggle"
          >
            {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
        )}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }} id="nav-logo">
          <KavachLogo size={32} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: 'var(--color-text)', letterSpacing: '0.08em' }}>
              KAVACH
            </span>
            <span style={{ fontSize: '0.6rem', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', opacity: 0.8, letterSpacing: '0.2em', marginTop: '2px' }}>
              SECURE PROTOCOL
            </span>
          </div>
        </Link>
      </div>
      
      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {!isLanding && (
          <>
            {/* Live threat counter */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(180deg, rgba(17, 34, 56, 0.9), rgba(11, 24, 41, 0.95))',
                border: '1px solid var(--color-border)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
              }}
            >
              <Activity size={14} style={{ color: 'var(--color-primary)' }} />
              <span style={{ color: 'var(--color-muted)' }}>Scans:</span>
              <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{stats.totalScans}</span>
              <span style={{ width: '1px', height: '14px', background: 'var(--color-border)' }} />
              <span style={{ color: 'var(--color-muted)' }}>Threats:</span>
              <span style={{ color: stats.threatsDetected > 0 ? 'var(--color-danger)' : 'var(--color-safe)', fontWeight: 600 }}>
                {stats.threatsDetected}
              </span>
            </motion.div>
            
            {/* Notification bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotif(!showNotif)}
                className={`btn-icon ${showNotif ? 'btn-primary' : 'btn-ghost'}`}
                style={{ 
                  width: '36px', height: '36px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0,
                  position: 'relative' 
                }}
                id="nav-notifications"
              >
                <Bell size={18} />
                {stats.threatsDetected > 0 && (
                  <span style={{
                    position: 'absolute', top: '4px', right: '4px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: 'var(--color-danger)',
                    animation: 'pulse-scale 2s ease-in-out infinite',
                    border: '2px solid var(--color-surface)'
                  }} />
                )}
              </button>

              <AnimatePresence>
                {showNotif && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="glass-strong"
                    style={{
                      position: 'absolute', top: 'calc(100% + 12px)', right: 0,
                      width: '320px', borderRadius: 'var(--radius-lg)',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px var(--color-border)',
                      overflow: 'hidden', zIndex: 1100
                    }}
                  >
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Neural Intel</h4>
                      <div className="badge badge-info" style={{ fontSize: '0.65rem' }}>{scanHistory.length} New</div>
                    </div>
                    
                    <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
                      {scanHistory.length === 0 ? (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-muted)' }}>
                          <Bell size={24} style={{ marginBottom: '12px', opacity: 0.3 }} />
                          <p style={{ fontSize: '0.85rem' }}>No recent threats detected.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {scanHistory.slice(0, 5).map((scan, idx) => (
                            <div 
                              key={idx}
                              style={{ 
                                padding: '12px', borderRadius: 'var(--radius-md)',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
                              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: scan.threatLevel === 'HIGH' ? 'var(--color-danger)' : 'var(--color-safe)' }}>
                                  {scan.type?.toUpperCase() || 'SCAN'} {scan.threatLevel === 'HIGH' ? 'THREAT' : 'SECURE'}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={10} /> {scan.timestamp || 'Just now'}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {scan.summary || 'Advanced forensic scan completed.'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '8px', borderTop: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)' }}>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ width: '100%', fontSize: '0.75rem', gap: '6px' }}
                        onClick={() => setShowNotif(false)}
                      >
                        Dismiss All
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
        
        {isLanding && (
          <Link to="/dashboard" className="btn btn-primary btn-sm" id="nav-enter-dashboard">
            Enter Dashboard
          </Link>
        )}
      </div>
    </motion.nav>
  );
}
