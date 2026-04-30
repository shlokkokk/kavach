import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, AudioWaveform, Smartphone, FileSearch, BookOpen, Link2, Shield } from 'lucide-react';
import useKavachStore from '../../store/kavachStore';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/audio', label: 'Voice Shield', icon: AudioWaveform, color: '#3b82f6' },
  { path: '/simswap', label: 'SIM Guard', icon: Smartphone, color: '#f59e0b' },
  { path: '/jobscanner', label: 'Job Shield', icon: FileSearch, color: '#ef4444' },
  { path: '/education', label: 'Fraud Intel', icon: BookOpen, color: '#8b5cf6' },
];

export default function Sidebar() {
  const location = useLocation();
  const { sidebarOpen } = useKavachStore();
  const isLanding = location.pathname === '/';
  
  if (isLanding) return null;
  
  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="k-sidebar-shell"
          style={{
            position: 'fixed',
            top: 'var(--navbar-height)',
            left: 0,
            bottom: 0,
            width: 'var(--sidebar-width)',
            background: 'var(--color-bg-2)',
            borderRight: '1px solid var(--color-border)',
            padding: '20px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            zIndex: 900,
            overflowY: 'auto',
          }}
          id="sidebar-nav"
        >
          <div style={{ padding: '0 12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Modules
            </span>
          </div>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{ textDecoration: 'none' }}
                id={`sidebar-link-${item.path.slice(1)}`}
              >
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--color-surface)' : 'transparent',
                    border: isActive ? '1px solid var(--color-border-light)' : '1px solid transparent',
                    color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '3px',
                        height: '60%',
                        borderRadius: '0 4px 4px 0',
                        background: item.color || 'var(--color-primary)',
                        boxShadow: `0 0 10px ${item.color || 'var(--color-primary)'}`,
                      }}
                    />
                  )}
                  <Icon size={18} style={{ color: isActive ? (item.color || 'var(--color-primary)') : 'inherit', flexShrink: 0 }} />
                  <span style={{ fontWeight: isActive ? 600 : 400, fontSize: '0.92rem' }}>{item.label}</span>
                </motion.div>
              </NavLink>
            );
          })}
          
          {/* Bottom section */}
          <div style={{ marginTop: 'auto', padding: '16px 12px', borderTop: '1px solid var(--color-border)' }}>
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={14} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
                  KAVACH v1.0
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', lineHeight: 1.4 }}>
                India's Unified Digital Fraud Shield
              </span>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
