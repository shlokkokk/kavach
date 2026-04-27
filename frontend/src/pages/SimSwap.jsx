import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Play, Shield, AlertTriangle, Phone, MapPin, Fingerprint, Clock, Lock, Unlock, Wifi } from 'lucide-react';
import GlowCard from '../components/shared/GlowCard';
import ScoreGauge from '../components/shared/ScoreGauge';
import PulsingDot from '../components/shared/PulsingDot';
import ThreatScoreBadge from '../components/shared/ThreatScoreBadge';
import PageWrapper from '../components/layout/PageWrapper';
import useKavachStore from '../store/kavachStore';
import { simService } from '../services/moduleServices';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import toast from 'react-hot-toast';

export default function SimSwap() {
  const [phone, setPhone] = useState('');
  const [demoRunning, setDemoRunning] = useState(false);
  const socketRef = useRef(null);
  const {
    simRegistered, simPhoneNumber, simEvents, simRiskScore,
    simAlerts, simFrozen, registerSim, addSimEvent,
    addSimAlert, setSimRiskScore, freezeTransactions, resetSim, addScan
  } = useKavachStore();

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const connectSocket = (phoneNum) => {
    const socket = io(SOCKET_URL, { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribe', { phoneNumber: phoneNum });
    });

    socket.on('sim-event', (event) => {
      addSimEvent(event);
      if (event.riskScore) setSimRiskScore(event.riskScore);
    });

    socket.on('threat-alert', (alert) => {
      addSimAlert(alert);
      toast.error(`⚠️ ${alert.message || 'SIM Swap Attack Detected!'}`, { duration: 5000 });
      addScan({
        id: Date.now().toString(), module: 'SIM Guard', moduleColor: '#f59e0b',
        input: phoneNum, threatLevel: 'HIGH', score: alert.riskScore || 94,
        time: new Date().toLocaleTimeString(),
      });
    });

    socket.on('bank-frozen', () => {
      freezeTransactions();
      toast.success('🔒 Transactions Frozen Successfully');
    });

    socket.on('connect_error', () => {
      toast.error('Connection failed — backend may be offline');
    });
  };

  const handleRegister = async () => {
    if (!phone || phone.length < 10) { toast.error('Enter valid phone number'); return; }
    try {
      await simService.register(phone);
    } catch { /* continue even if backend offline */ }
    registerSim(phone);
    connectSocket(phone);
    toast.success(`Monitoring ${phone}`);
  };

  const handleStartDemo = () => {
    if (!socketRef.current?.connected) {
      toast.error('Not connected to server');
      return;
    }
    setDemoRunning(true);
    socketRef.current.emit('start-demo');
    toast('🎬 Demo attack sequence started...', { icon: '⚡' });
  };

  const handleFreeze = async () => {
    try { await simService.freeze(simPhoneNumber); } catch {}
    freezeTransactions();
    toast.success('🔒 Transactions frozen');
  };

  const handleReset = () => {
    if (socketRef.current) socketRef.current.disconnect();
    resetSim();
    setDemoRunning(false);
  };

  const getSeverityColor = (s) => {
    if (s === 'HIGH' || s === 'CRITICAL') return 'var(--color-danger)';
    if (s === 'MEDIUM') return 'var(--color-warning)';
    return 'var(--color-safe)';
  };

  return (
    <PageWrapper>
      <div style={{ maxWidth: '1200px' }}>
        <div className="page-header">
          <h1><Smartphone size={28} style={{ color: '#f59e0b' }} /> SIM Guard</h1>
          <p>Real-time SIM swap attack detection and prevention</p>
        </div>

        {!simRegistered ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '500px', margin: '0 auto' }}>
            <GlowCard color="warning">
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f59e0b20', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Phone size={28} style={{ color: '#f59e0b' }} />
                </div>
                <h3>Register Phone Number</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
                  Enter your phone number to start real-time SIM swap monitoring
                </p>
              </div>
              <input
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit mobile number" className="input"
                style={{ marginBottom: '16px', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.1em' }}
                id="sim-phone-input"
              />
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleRegister} id="btn-register-sim">
                <Shield size={18} /> Start Monitoring
              </button>
            </GlowCard>
          </motion.div>
        ) : (
          <div className="module-grid-sidebar">
            {/* Left Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Risk Score */}
              <GlowCard color={simRiskScore >= 70 ? 'danger' : simRiskScore >= 40 ? 'warning' : 'primary'}>
                <div style={{ textAlign: 'center' }}>
                  <ScoreGauge score={simRiskScore} size={160} label="risk score" />
                  <div style={{ marginTop: '12px' }}>
                    <ThreatScoreBadge level={simRiskScore >= 70 ? 'HIGH' : simRiskScore >= 40 ? 'MEDIUM' : 'LOW'} />
                  </div>
                </div>
              </GlowCard>

              {/* Phone Info */}
              <GlowCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Phone size={16} style={{ color: '#f59e0b' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{simPhoneNumber}</span>
                  <PulsingDot status={simRiskScore >= 70 ? 'danger' : 'active'} size="sm" style={{ marginLeft: 'auto' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-muted)' }}>Status</span>
                    <span style={{ color: simFrozen ? 'var(--color-danger)' : 'var(--color-safe)' }}>
                      {simFrozen ? '🔒 FROZEN' : '🟢 ACTIVE'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-muted)' }}>Events</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{simEvents.length}</span>
                  </div>
                </div>
              </GlowCard>

              {/* Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn btn-outline btn-sm" onClick={handleStartDemo} disabled={demoRunning} id="btn-start-demo">
                  <Play size={16} /> {demoRunning ? 'Demo Running...' : 'Start Demo Attack'}
                </button>
                {simAlerts.length > 0 && !simFrozen && (
                  <button className="btn btn-danger btn-sm" onClick={handleFreeze} id="btn-freeze">
                    <Lock size={16} /> Freeze Transactions
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={handleReset} id="btn-reset-sim">
                  Reset Monitor
                </button>
              </div>
            </div>

            {/* Right: Event Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Alert Banner */}
              <AnimatePresence>
                {simAlerts.length > 0 && !simFrozen && (
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div style={{ background: 'var(--color-danger-dim)', border: '1px solid rgba(255,59,59,0.4)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <AlertTriangle size={24} style={{ color: 'var(--color-danger)', animation: 'pulse-glow 1s infinite' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-danger)', marginBottom: '2px' }}>⚠️ SIM SWAP ATTACK DETECTED</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Unauthorized SIM change detected. Freeze transactions immediately.</div>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={handleFreeze}>FREEZE NOW</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {simFrozen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div style={{ background: 'var(--color-primary-dim)', border: '1px solid rgba(0,255,178,0.3)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Lock size={24} style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>🔒 TRANSACTIONS FROZEN</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>All banking transactions have been suspended for this number.</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Event Feed */}
              <GlowCard>
                <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wifi size={18} style={{ color: '#f59e0b' }} /> Live Event Feed
                  <PulsingDot status="active" size="sm" style={{ marginLeft: '8px' }} />
                </h4>
                <div style={{ maxHeight: '500px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {simEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-muted)' }}>
                      <Wifi size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                      <p>Waiting for events... Click "Start Demo Attack" to simulate.</p>
                    </div>
                  ) : (
                    simEvents.map((evt, i) => (
                      <motion.div
                        key={evt.id || i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          padding: '12px 16px', borderRadius: 'var(--radius-md)',
                          background: 'var(--color-surface-2)',
                          borderLeft: `3px solid ${getSeverityColor(evt.severity)}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: getSeverityColor(evt.severity), fontWeight: 600 }}>
                            {evt.type || evt.eventType}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                            {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : ''}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                          {evt.description || evt.details?.description || JSON.stringify(evt.details || {})}
                        </p>
                        {evt.triggeredRules && evt.triggeredRules.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                            {evt.triggeredRules.map(r => (
                              <span key={r} style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '3px', background: 'var(--color-danger-dim)', color: 'var(--color-danger)' }}>
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </GlowCard>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
