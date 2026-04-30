import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Menu, X, Activity, Bell } from 'lucide-react';
import useKavachStore from '../../store/kavachStore';

export default function Navbar() {
  const location = useLocation();
  const { stats, toggleSidebar, sidebarOpen } = useKavachStore();
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
            style={{ padding: '6px' }}
            id="sidebar-toggle"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }} id="nav-logo">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Shield size={28} style={{ color: 'var(--color-primary)', filter: 'drop-shadow(0 0 8px rgba(0,255,178,0.4))' }} />
          </motion.div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.35rem', color: 'var(--color-text)', letterSpacing: '0.05em' }}>
            KAVACH
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', opacity: 0.7, marginLeft: '-4px' }}>
            कवच
          </span>
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
                className="btn-icon btn-ghost"
                style={{ padding: '8px', position: 'relative' }}
                id="nav-notifications"
              >
                <Bell size={18} />
                {stats.threatsDetected > 0 && (
                  <span style={{
                    position: 'absolute', top: '4px', right: '4px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: 'var(--color-danger)',
                    animation: 'pulse-scale 2s ease-in-out infinite',
                  }} />
                )}
              </button>
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
