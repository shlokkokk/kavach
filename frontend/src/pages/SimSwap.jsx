import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, RefreshCw, Terminal, ChevronDown, ChevronUp,
  Activity, ShieldAlert, Globe, ArrowRight, Server, HardDrive, Link, Radio
} from 'lucide-react';
import ScoreGauge from '../components/shared/ScoreGauge';
import ThreatScoreBadge from '../components/shared/ThreatScoreBadge';
import PageWrapper from '../components/layout/PageWrapper';
import useKavachStore from '../store/kavachStore';
import { simService } from '../services/moduleServices';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import toast from 'react-hot-toast';

export default function SimSwap() {
  const [phone, setPhone] = useState('');
  const [showAttackerPanel, setShowAttackerPanel] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const socketRef = useRef(null);

  const {
    simRegistered, simPhoneNumber, simEvents, simRiskScore,
    simAlerts, simFrozen, simCarrierData, registerSim, addSimEvent,
    addSimAlert, setSimRiskScore, setSimCarrierData, freezeTransactions, 
    resetSim, addScan
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
      socket.emit('manual-scan'); 
    });

    socket.on('sim-event', (event) => {
      addSimEvent(event);
      if (event.riskScore !== undefined) setSimRiskScore(event.riskScore);
      if (event.details) setSimCarrierData(event.details);
      
      if (event.type === 'INTEGRITY_SCAN_COMPLETE') {
        setIsScanning(false);
        if (event.details?.isMock) {
          toast('📡 Connected to Local Node', { 
            icon: '🔄',
            style: { background: '#111', color: '#f59e0b', border: '1px solid #f59e0b' }
          });
        } else if (event.details?.valid) {
          toast.success(`Connected: ${event.details.carrier}`, {
            style: { background: '#064e3b', color: '#10b981', border: '1px solid #10b981' }
          });
        }
      }
    });

    socket.on('threat-alert', (alert) => {
      addSimAlert(alert);
      toast.error(`🚨 ${alert.message || 'SIM SWAP DETECTED'}`, { 
        duration: 8000,
        style: { background: '#7f1d1d', color: '#fff', border: '1px solid #ef4444', fontWeight: 800 }
      });
      addScan({
        id: Date.now().toString(), 
        module: 'SIM Guard', 
        moduleColor: '#f59e0b',
        input: phoneNum, 
        threatLevel: 'HIGH', 
        score: alert.riskScore || 94,
        time: new Date().toLocaleTimeString(),
      });
    });

    socket.on('bank-frozen', () => {
      freezeTransactions();
      toast.success('🔒 Assets Shielded', { icon: '🛡️' });
    });

    socket.on('connect_error', () => {
      toast.error('Network Bridge Interrupted');
    });
  };

  const handleRegister = async () => {
    if (!phone || phone.length < 10) { toast.error('Enter valid phone number'); return; }
    try {
      await simService.register(phone);
    } catch { /* continue */ }
    registerSim(phone);
    connectSocket(phone);
  };

  const handleStartDemo = () => {
    if (!socketRef.current?.connected) { toast.error('Connection Lost'); return; }
    socketRef.current.emit('start-demo');
    toast('🎬 Simulating Attack...', { icon: '🔥' });
  };

  const handleTriggerAnomaly = (type) => {
    if (!socketRef.current?.connected) { toast.error('Connection Lost'); return; }
    socketRef.current.emit('trigger-anomaly', { type });
  };

  const handleManualScan = () => {
    if (!socketRef.current?.connected) { toast.error('Connection Lost'); return; }
    setIsScanning(true);
    socketRef.current.emit('manual-scan');
  };

  const handleFreeze = async () => {
    try { await simService.freeze(simPhoneNumber); } catch {}
    freezeTransactions();
  };

  const handleReset = () => {
    if (socketRef.current) socketRef.current.disconnect();
    resetSim();
    setIsScanning(false);
  };

  const getSeverityColor = (s) => {
    if (s === 'HIGH' || s === 'CRITICAL') return '#ef4444';
    if (s === 'MEDIUM') return '#f59e0b';
    return '#10b981';
  };

  return (
    <PageWrapper>
      <div className="app-shell">
        <div className="k-page-header k-panel" style={{ padding: '18px 20px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              width: '52px', height: '52px', borderRadius: '14px', 
              background: 'linear-gradient(135deg, #f59e0b 0%, #78350f 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)'
            }}>
              <Smartphone size={28} color="#fff" />
            </div>
            <div>
              <h1 className="k-page-title" style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                SIM GUARD 
                <span style={{ 
                  background: simCarrierData?.isMock ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                  color: simCarrierData?.isMock ? '#f59e0b' : '#10b981', 
                  fontSize: '0.65rem', padding: '3px 10px', borderRadius: '100px',
                  border: simCarrierData?.isMock ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)', 
                  fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: simCarrierData?.isMock ? '#f59e0b' : '#10b981' }} /> 
                  {simCarrierData?.isMock ? 'LOCAL NODE' : 'LIVE NODE'}
                </span>
              </h1>
              <p className="k-page-subtitle" style={{ margin: '4px 0 0 0', opacity: 0.85, fontSize: '0.9rem', fontWeight: 500 }}>
                Global forensic network with real-time HLR integrity analysis and anomaly interception.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span className="badge badge-warning">
              <Activity size={12} />
              {isScanning ? 'Scanning' : 'Monitoring'}
            </span>
            {simRegistered && (
              <button className="btn btn-ghost" onClick={handleReset} style={{ borderRadius: '12px', height: '40px' }}>
                <RefreshCw size={15} style={{ marginRight: '8px' }} /> Reset
              </button>
            )}
          </div>
        </div>

        {!simRegistered ? (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '640px', margin: '40px auto' }}>
            <div className="k-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(245, 158, 11, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                <Link size={40} style={{ color: '#f59e0b' }} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '14px', letterSpacing: '-0.02em' }}>Establish Forensic Link</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', marginBottom: '32px', lineHeight: 1.6 }}>
                Initialize a real-time bridge between your device and our global carrier detection network to monitor for SIM swap vulnerabilities.
              </p>
              
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter Mobile Number"
                  className="input"
                  style={{ width: '100%', height: '62px', borderRadius: '14px', fontSize: '1.1rem', textAlign: 'center', fontWeight: 800 }}
                />
              </div>
              <button 
                className="btn btn-primary" 
                style={{ 
                  width: '100%', height: '62px', borderRadius: '14px', fontSize: '1.02rem', 
                  fontWeight: 900, background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                  border: 'none', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.2)'
                }} 
                onClick={handleRegister}
              >
                AUTHORIZE MONITORING <ArrowRight size={20} style={{ marginLeft: '10px' }} />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="sim-grid">
            
            {/* Sidebar Forensics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Dynamic Risk Matrix */}
              <div className="k-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <ScoreGauge score={simRiskScore} size={180} label="THREAT PROBABILITY" />
                <div style={{ marginTop: '16px' }}>
                  <ThreatScoreBadge level={simRiskScore >= 75 ? 'HIGH' : simRiskScore >= 40 ? 'MEDIUM' : 'LOW'} />
                </div>
              </div>

              {/* HLR Data Node */}
              <div className="k-panel" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <HardDrive size={18} color="#f59e0b" />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>HLR DATA NODE</h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-muted)', fontWeight: 800, marginBottom: '4px' }}>CARRIER IDENTITY</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f59e0b' }}>{simCarrierData?.carrier || 'QUERYING...'}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--color-muted)', marginBottom: '4px' }}>MCC/MNC</div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>{simCarrierData?.mcc || '---'}/{simCarrierData?.mnc || '---'}</div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--color-muted)', marginBottom: '4px' }}>LINE TYPE</div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{simCarrierData?.line_type || '---'}</div>
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.75rem' }}>
                      <span style={{ opacity: 0.6 }}>Last SIM Change</span>
                      <span style={{ fontWeight: 700 }}>{simCarrierData?.last_sim_swap || '---'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ opacity: 0.6 }}>Reputation</span>
                      <span style={{ color: simRiskScore >= 40 ? '#ef4444' : '#10b981', fontWeight: 900 }}>{simRiskScore >= 40 ? 'SUSPICIOUS' : 'SECURE'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Deck */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="btn btn-outline" onClick={handleManualScan} disabled={isScanning} style={{ height: '56px', borderRadius: '18px', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <RefreshCw size={18} className={isScanning ? 'spin' : ''} style={{ marginRight: '10px' }} /> REFRESH FORENSICS
                </button>
                <button className="btn btn-ghost" onClick={() => setShowAttackerPanel(!showAttackerPanel)} style={{ height: '56px', borderRadius: '18px', background: 'rgba(255,255,255,0.02)' }}>
                  <Terminal size={18} style={{ marginRight: '10px' }} /> SIMULATION LAB
                  {showAttackerPanel ? <ChevronUp size={18} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={18} style={{ marginLeft: 'auto' }} />}
                </button>

                <AnimatePresence>
                  {showAttackerPanel && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <button className="btn btn-ghost btn-xs" style={{ justifyContent: 'flex-start' }} onClick={() => handleTriggerAnomaly('SIM_SWAP')}>• Inject SIM Swap</button>
                      <button className="btn btn-ghost btn-xs" style={{ justifyContent: 'flex-start' }} onClick={() => handleTriggerAnomaly('DEVICE_CHANGE')}>• Inject Device Change</button>
                      <button className="btn btn-ghost btn-xs" style={{ justifyContent: 'flex-start' }} onClick={() => handleTriggerAnomaly('LOCATION_JUMP')}>• Inject Location Jump</button>
                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '6px 0' }} />
                      <button className="btn btn-primary btn-sm" onClick={handleStartDemo}>RUN AUTO ATTACK</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Main Log Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Critical Alert Area */}
              <AnimatePresence>
                {simAlerts.length > 0 && !simFrozen && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    style={{ background: 'linear-gradient(135deg, #450a0a 0%, #991b1b 100%)', borderRadius: '20px', padding: '24px', border: '2px solid rgba(239, 68, 68, 0.45)', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 20px 50px rgba(220, 38, 38, 0.2)' }}
                  >
                    <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldAlert size={36} color="#ef4444" className="pulse-glow" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: 900, color: '#fee2e2' }}>SIM SWAP VECTOR IDENTIFIED</h3>
                      <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.95rem' }}>Unauthorized hardware change detected. High-risk takeover in progress.</p>
                    </div>
                    <button className="btn btn-danger" onClick={handleFreeze} style={{ height: '60px', padding: '0 32px', borderRadius: '16px', fontWeight: 900 }}>SHIELD ASSETS</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Log Stream Card */}
              <div className="k-panel" style={{ padding: '22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Server size={20} color="#f59e0b" />
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>FORENSIC STREAM</h3>
                  </div>
                  <div style={{ padding: '4px 12px', borderRadius: '100px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Radio size={12} /> LIVE
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px', maxHeight: '500px' }}>
                  {simEvents.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2, marginTop: '60px' }}>
                      <Globe size={52} style={{ marginBottom: '20px' }} />
                      <p style={{ fontSize: '1rem', fontWeight: 700 }}>Awaiting Forensic Data Stream...</p>
                    </div>
                  ) : (
                    simEvents.map((evt, i) => (
                      <motion.div key={evt.id || i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: 3, y: -1 }}
                        style={{ padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderLeft: `6px solid ${getSeverityColor(evt.severity)}` }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 900, color: getSeverityColor(evt.severity), background: `${getSeverityColor(evt.severity)}15`, padding: '2px 10px', borderRadius: '6px' }}>
                            {evt.type?.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', margin: '0 0 10px 0', lineHeight: 1.4 }}>{evt.description}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {evt.triggeredRules?.map(r => (
                            <span key={r} style={{ fontSize: '0.65rem', fontWeight: 800, padding: '3px 10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>{r}</span>
                          ))}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
