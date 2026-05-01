import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Clock3,
  Cpu,
  Globe,
  HardDrive,
  Link,
  Lock,
  MapPin,
  Radio,
  RefreshCw,
  ScanSearch,
  Server,
  ShieldAlert,
  ShieldCheck,
  Signal,
  Smartphone,
  Terminal,
  Zap,
} from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import PageWrapper from '../components/layout/PageWrapper';
import ScoreGauge from '../components/shared/ScoreGauge';
import ThreatScoreBadge from '../components/shared/ThreatScoreBadge';
import { simService } from '../services/moduleServices';
import useKavachStore from '../store/kavachStore';
import { SOCKET_URL } from '../utils/constants';

const COUNTRY_OPTIONS = [
  { code: '91', iso: 'IN', name: 'India', minLength: 10, maxLength: 10, sample: '9876543210' },
  { code: '1', iso: 'US', name: 'United States / Canada', minLength: 10, maxLength: 10, sample: '4155550123' },
  { code: '44', iso: 'UK', name: 'United Kingdom', minLength: 10, maxLength: 10, sample: '7700900123' },
  { code: '61', iso: 'AU', name: 'Australia', minLength: 9, maxLength: 9, sample: '412345678' },
  { code: '27', iso: 'ZA', name: 'South Africa', minLength: 9, maxLength: 9, sample: '821234567' },
  { code: '234', iso: 'NG', name: 'Nigeria', minLength: 10, maxLength: 10, sample: '8123456789' },
];

const ANOMALY_ACTIONS = [
  { id: 'SIM_SWAP', label: 'Inject SIM Swap' },
  { id: 'DEVICE_CHANGE', label: 'Inject Device Change' },
  { id: 'LOCATION_JUMP', label: 'Inject Location Jump' },
  { id: 'OTP_FLOOD', label: 'Trigger OTP Flood' },
];

function getRiskLevel(score) {
  if (score >= 75) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

function getSeverityColor(severity) {
  if (severity === 'CRITICAL' || severity === 'HIGH') return '#ff5a6b';
  if (severity === 'MEDIUM') return '#ffb800';
  return '#19d38a';
}

function formatEventType(type) {
  return String(type || 'UNKNOWN').replace(/_/g, ' ');
}

function formatDateTime(value) {
  if (!value) return 'Waiting for sync';

  try {
    return new Date(value).toLocaleString();
  } catch {
    return 'Waiting for sync';
  }
}

function formatTime(value) {
  if (!value) return 'Waiting';

  try {
    return new Date(value).toLocaleTimeString();
  } catch {
    return 'Waiting';
  }
}

function formatPhone(phone) {
  if (!phone) return 'Not connected';
  const clean = String(phone).replace(/\s+/g, '');
  if (clean.startsWith('+')) return clean;
  return `+${clean}`;
}

function safeValue(value, fallback = 'Not available') {
  if (value === 0) return '0';
  return value ? String(value) : fallback;
}

function OverviewCard({ icon: Icon, label, value, meta, tone = 'neutral' }) {
  return (
    <div className={`simswap-overview-card simswap-tone-${tone}`}>
      <div className="simswap-overview-top">
        <span>{label}</span>
        <Icon size={16} />
      </div>
      <strong>{value}</strong>
      <p>{meta}</p>
    </div>
  );
}

function DataPoint({ label, value, mono = false, accent = false }) {
  return (
    <div className="simswap-data-point">
      <span>{label}</span>
      <strong className={mono ? 'mono' : ''} data-accent={accent ? 'true' : 'false'}>
        {value}
      </strong>
    </div>
  );
}

export default function SimSwap() {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [showAttackerPanel, setShowAttackerPanel] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [connectionState, setConnectionState] = useState('idle');
  const [statusSnapshot, setStatusSnapshot] = useState(null);
  const socketRef = useRef(null);

  const selectedCountry = COUNTRY_OPTIONS.find((entry) => entry.code === countryCode) || COUNTRY_OPTIONS[0];
  const fullPhone = phone ? `+${countryCode}${phone}` : '';
  const canRegister = phone.length >= selectedCountry.minLength && phone.length <= selectedCountry.maxLength;

  const {
    simRegistered,
    simPhoneNumber,
    simEvents,
    simRiskScore,
    simAlerts,
    simFrozen,
    simCarrierData,
    registerSim,
    addSimEvent,
    addSimAlert,
    hydrateSimState,
    setSimRiskScore,
    setSimCarrierData,
    freezeTransactions,
    resetSim,
    addScan,
  } = useKavachStore();

  const carrierData = simCarrierData || statusSnapshot?.carrierData || null;
  const activePhone = simPhoneNumber || fullPhone;
  const riskScore = statusSnapshot?.riskScore ?? simRiskScore ?? 5;
  const riskLevel = getRiskLevel(riskScore);
  const eventFeed = simEvents.length ? simEvents : statusSnapshot?.events || [];
  const lastAlert = simAlerts[0] || statusSnapshot?.alerts?.[0] || null;
  const overallStatus = simFrozen || statusSnapshot?.isFrozen ? 'FROZEN' : riskLevel === 'HIGH' ? 'Suspicious' : 'Secure';
  const nodeLabel = carrierData ? (carrierData.isMock ? 'Session node' : 'Carrier node') : connectionState === 'live' ? 'Socket live' : 'Standby';

  const applyStatusSnapshot = (snapshot) => {
    if (!snapshot) {
      return;
    }

    setStatusSnapshot(snapshot);
    hydrateSimState(snapshot);
  };

  const refreshStatus = async (phoneNumber = simPhoneNumber) => {
    if (!phoneNumber) {
      return;
    }

    try {
      const response = await simService.getStatus(phoneNumber);
      applyStatusSnapshot(response.data);
    } catch {
      // Ignore background status refresh errors so sockets can still work.
    }
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const connectSocket = (phoneNumber) => {
    disconnectSocket();
    setConnectionState('connecting');

    const socket = io(SOCKET_URL, { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionState('live');
      socket.emit('subscribe', { phoneNumber });
      socket.emit('manual-scan');
    });

    socket.on('sim-status', (snapshot) => {
      applyStatusSnapshot(snapshot);
    });

    socket.on('sim-event', (event) => {
      addSimEvent(event);

      if (event.type === 'INTEGRITY_SCAN_START') {
        setIsScanning(true);
      }

      if (event.type === 'INTEGRITY_SCAN_COMPLETE') {
        setIsScanning(false);
      }

      if (event.riskScore !== undefined) {
        setSimRiskScore(event.riskScore);
      }

      if (event.details) {
        setSimCarrierData(event.details);
      }

      setStatusSnapshot((current) => ({
        ...(current || {}),
        phoneNumber,
        riskScore: event.riskScore ?? current?.riskScore ?? riskScore,
        carrierData: event.details || current?.carrierData || null,
        lastScanAt: event.type === 'INTEGRITY_SCAN_COMPLETE' ? event.timestamp : current?.lastScanAt,
        triggeredRules: event.triggeredRules || current?.triggeredRules || [],
        updatedAt: event.timestamp || current?.updatedAt,
        events: [event, ...(current?.events || []).filter((item) => item.id !== event.id)].slice(0, 100),
      }));

      if (event.type === 'INTEGRITY_SCAN_COMPLETE') {
        const provider = event.details?.provider_display || 'Live provider';
        const carrier = event.details?.carrier || event.details?.session_isp || 'Unknown carrier';
        toast.success(`${provider} linked: ${carrier}`, {
          style: { background: '#052e24', color: '#bdf7df', border: '1px solid #0f8f65' },
        });
      }
    });

    socket.on('threat-alert', (alert) => {
      addSimAlert(alert);
      setStatusSnapshot((current) => ({
        ...(current || {}),
        alerts: [alert, ...(current?.alerts || []).filter((item) => item.id !== alert.id)],
      }));
      toast.error(alert.message || 'SIM swap threat detected', {
        duration: 8000,
        style: { background: '#4b1118', color: '#ffe1e4', border: '1px solid #ff5a6b', fontWeight: 700 },
      });

      addScan({
        id: Date.now().toString(),
        module: 'SIM Guard',
        moduleColor: '#f59e0b',
        input: phoneNumber,
        threatLevel: 'HIGH',
        score: alert.riskScore || 94,
        time: new Date().toLocaleTimeString(),
      });
    });

    socket.on('bank-frozen', () => {
      freezeTransactions();
      setStatusSnapshot((current) => ({ ...(current || {}), isFrozen: true, status: 'FROZEN' }));
      toast.success('Assets shielded', {
        style: { background: '#062b1e', color: '#b5f5cf', border: '1px solid #19d38a' },
      });
    });

    socket.on('disconnect', () => {
      setConnectionState('offline');
      setIsScanning(false);
    });

    socket.on('connect_error', () => {
      setConnectionState('offline');
      setIsScanning(false);
      toast.error('Backend connection failed');
    });
  };

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (!simRegistered || !simPhoneNumber || socketRef.current) {
      return;
    }

    connectSocket(simPhoneNumber);
    refreshStatus(simPhoneNumber);
  }, [simPhoneNumber, simRegistered]);

  const handleRegister = async () => {
    if (!canRegister) {
      toast.error(`Enter a valid ${selectedCountry.name} number`);
      return;
    }

    try {
      const response = await simService.register(fullPhone);
      registerSim(fullPhone);
      applyStatusSnapshot(response.data?.status);
      connectSocket(fullPhone);
    } catch (error) {
      toast.error(error.message || 'Unable to start monitoring');
    }
  };

  const handleStartDemo = () => {
    if (!socketRef.current?.connected) {
      toast.error('Connection lost');
      return;
    }

    socketRef.current.emit('start-demo');
    toast('Auto attack sequence started', {
      style: { background: '#261701', color: '#ffcf79', border: '1px solid #f59e0b' },
    });
  };

  const handleTriggerAnomaly = (type) => {
    if (!socketRef.current?.connected) {
      toast.error('Connection lost');
      return;
    }

    socketRef.current.emit('trigger-anomaly', { type });
  };

  const handleManualScan = () => {
    if (!socketRef.current?.connected) {
      toast.error('Connection lost');
      return;
    }

    setIsScanning(true);
    socketRef.current.emit('manual-scan');
  };

  const handleFreeze = async () => {
    try {
      const response = await simService.freeze(simPhoneNumber);
      freezeTransactions();
      applyStatusSnapshot(response.data?.status);
    } catch {
      freezeTransactions();
    }
  };

  const handleMarkSafe = async () => {
    try {
      const response = await simService.markSafe(simPhoneNumber);
      applyStatusSnapshot(response.data?.status);
      toast.success('State reset to safe');
    } catch (error) {
      toast.error(error.message || 'Unable to clear SIM status');
    }
  };

  const handleReset = () => {
    disconnectSocket();
    resetSim();
    setStatusSnapshot(null);
    setIsScanning(false);
    setConnectionState('idle');
    setShowAttackerPanel(false);
  };

  return (
    <PageWrapper>
      <div className="app-shell simswap-page">
        <div className="k-page-header k-panel simswap-hero">
          <div className="simswap-hero-main">
            <div className="simswap-hero-icon">
              <Smartphone size={30} />
            </div>
            <div className="simswap-hero-copy">
              <div className="simswap-kicker-row">
                <span className="simswap-kicker">Telecom Identity Monitor</span>
                <span className={`simswap-status-chip simswap-connection-${connectionState}`}>
                  <Radio size={12} />
                  {connectionState === 'live' ? 'Live stream' : connectionState === 'connecting' ? 'Connecting' : 'Standby'}
                </span>
              </div>
              <h1 className="k-page-title">
                SIM Guard
              </h1>
              <p className="k-page-subtitle">
                A cleaner live operations view for carrier lookups, fraud scoring, SIM anomalies, and backend event telemetry.
              </p>
            </div>
          </div>

          <div className="simswap-hero-meta">
            <div className="simswap-meta-block">
              <span>Security State</span>
              <div className="simswap-hero-actions-integrated">
                <span className={`simswap-status-pill simswap-risk-${riskLevel.toLowerCase()}`}>
                  <Activity size={14} />
                  {isScanning ? 'Scanning backend' : overallStatus}
                </span>
              </div>
            </div>
            <div className="simswap-meta-block">
              <span>Active number</span>
              <strong className="mono">{formatPhone(activePhone)}</strong>
            </div>
            <div className="simswap-meta-block">
              <span>Data path</span>
              <strong>{nodeLabel}</strong>
            </div>
            <div className="simswap-hero-actions">
              {simRegistered && (
                <button className="btn btn-ghost" onClick={handleReset}>
                  <RefreshCw size={16} /> Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {!simRegistered ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="simswap-onboard"
          >
            <div className="k-panel simswap-onboard-card">
              <div className="simswap-onboard-intro">
                <div className="simswap-onboard-badge">
                  <ShieldCheck size={38} strokeWidth={1.5} />
                </div>
                <div>
                  <span className="simswap-kicker">Start Live Monitoring</span>
                  <h2>Connect a real phone number and pull carrier data from the backend.</h2>
                  <p>
                    This view now waits for a backend registration, socket subscription, and live integrity scan before it paints the intelligence panels.
                  </p>
                </div>
              </div>

              <div className="simswap-input-grid">
                <div className="simswap-field">
                  <span>Country</span>
                  <div className="simswap-input-wrapper">
                    <select
                      className="input simswap-select"
                      value={countryCode}
                      onChange={(event) => setCountryCode(event.target.value)}
                    >
                      {COUNTRY_OPTIONS.map((option) => (
                        <option key={option.code} value={option.code}>
                          {option.iso} +{option.code}
                        </option>
                      ))}
                    </select>
                    <Globe className="input-icon" size={20} />
                    <ChevronDown className="input-chevron" size={16} />
                  </div>
                </div>

                <div className="simswap-field">
                  <span>Phone number</span>
                  <div className="simswap-input-wrapper">
                    <input
                      type="tel"
                      className="input simswap-phone-input"
                      value={phone}
                      onChange={(event) => {
                        const clean = event.target.value.replace(/\D/g, '');
                        setPhone(clean.slice(0, selectedCountry.maxLength));
                      }}
                      placeholder={selectedCountry.sample}
                    />
                    <Smartphone className="input-icon" size={20} />
                  </div>
                </div>
              </div>

              <div className="simswap-preview-row">
                <div className="simswap-preview-chip">
                  <span>Formatted input</span>
                  <strong className="mono">{fullPhone || `+${selectedCountry.code} ${selectedCountry.sample}`}</strong>
                </div>
                <div className="simswap-preview-chip">
                  <span>Validation</span>
                  <strong>
                    {canRegister
                      ? 'Ready for backend sync'
                      : (selectedCountry.minLength === selectedCountry.maxLength
                          ? `${selectedCountry.minLength} digits required`
                          : `${selectedCountry.minLength}-${selectedCountry.maxLength} digits required`)
                    }
                  </strong>
                </div>
              </div>

              <button className="btn btn-primary simswap-register-button" onClick={handleRegister} disabled={!canRegister}>
                Authorize Monitoring <ArrowRight size={20} />
              </button>
            </div>

            <div className="k-panel simswap-preview-card">
              <div className="k-panel-head">
                <div>
                  <span className="k-panel-kicker">What will go live</span>
                  <h3>Backend-driven SIM intelligence</h3>
                </div>
                <span className="simswap-status-chip simswap-connection-idle">
                  <Server size={12} /> Awaiting connection
                </span>
              </div>

              <div className="simswap-preview-grid">
                <OverviewCard
                  icon={HardDrive}
                  label="Carrier provider"
                  value="Veriphone / IPQS / session fallback"
                  meta="Who answered the lookup"
                />
                <OverviewCard
                  icon={ShieldCheck}
                  label="Risk score"
                  value="Live fraud probability"
                  meta="Pulled from backend scan results"
                />
                <OverviewCard
                  icon={Signal}
                  label="Line intelligence"
                  value="Carrier, type, region, confidence"
                  meta="No more static card placeholders"
                />
                <OverviewCard
                  icon={Terminal}
                  label="Forensic stream"
                  value="Socket events and anomalies"
                  meta="Every scan and attack event appears here"
                />
                <OverviewCard
                  icon={Radio}
                  label="Network Integrity"
                  value="Live HLR/VLR verification"
                  meta="Backend socket-driven scanning"
                />
                <OverviewCard
                  icon={Activity}
                  label="Socket Telemetry"
                  value="Bi-directional event stream"
                  meta="Active monitoring state"
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="simswap-layout">
            <aside className="simswap-rail">
              <div className="k-panel simswap-risk-panel">
                <div className="k-panel-head">
                  <div>
                    <span className="k-panel-kicker">Threat Probability</span>
                    <h3>Live exposure score</h3>
                  </div>
                  <ThreatScoreBadge level={riskLevel} />
                </div>

                <div className="simswap-gauge-wrap">
                  <ScoreGauge score={riskScore} size={210} label="Threat Probability" />
                </div>

                <div className="simswap-risk-stats">
                  <DataPoint label="Overall state" value={overallStatus} accent />
                  <DataPoint label="Last sync" value={formatDateTime(statusSnapshot?.updatedAt || statusSnapshot?.lastScanAt)} />
                  <DataPoint label="Triggered rules" value={safeValue(statusSnapshot?.triggeredRules?.length, '0')} />
                </div>
              </div>

              <div className="k-panel simswap-action-panel">
                <div className="k-panel-head">
                  <div>
                    <span className="k-panel-kicker">Controls</span>
                    <h3>Live response actions</h3>
                  </div>
                  <span className="simswap-status-chip simswap-connection-live">
                    <ScanSearch size={12} /> {isScanning ? 'Scanning' : 'Ready'}
                  </span>
                </div>

                <div className="simswap-action-stack">
                  <button className="btn btn-outline simswap-action-button" onClick={handleManualScan} disabled={isScanning}>
                    <RefreshCw size={17} className={isScanning ? 'spin' : ''} />
                    Refresh Forensics
                  </button>

                  <button className="btn btn-ghost simswap-action-button" onClick={handleMarkSafe}>
                    <ShieldCheck size={17} />
                    Mark Safe
                  </button>

                </div>
              </div>

              <div className="k-panel simswap-sidefacts-panel">
                <div className="k-panel-head">
                  <div>
                    <span className="k-panel-kicker">Session Snapshot</span>
                    <h3>Backend facts</h3>
                  </div>
                  <HardDrive size={18} color="#f59e0b" />
                </div>

                <div className="simswap-sidefacts">
                  <DataPoint label="Device ID" value={safeValue(statusSnapshot?.deviceId)} mono />
                  <DataPoint label="Registration" value={formatDateTime(statusSnapshot?.registeredAt)} />
                  <DataPoint label="Last scan" value={formatDateTime(statusSnapshot?.lastScanAt)} />
                  <DataPoint label="Location model" value={safeValue(statusSnapshot?.location)} />
                </div>
              </div>
            </aside>

            <section className="simswap-main">
              <div className="simswap-overview-grid">
                <OverviewCard
                  icon={Server}
                  label="Provider"
                  value={safeValue(carrierData?.provider_display, 'Waiting for scan')}
                  meta={safeValue(carrierData?.carrier_source || carrierData?.provider, 'No provider selected yet')}
                  tone="info"
                />
                <OverviewCard
                  icon={Smartphone}
                  label="Carrier"
                  value={safeValue(carrierData?.carrier || carrierData?.session_isp, 'Waiting for carrier data')}
                  meta={safeValue(carrierData?.line_type, 'Line type pending')}
                  tone={riskLevel === 'HIGH' ? 'danger' : 'neutral'}
                />
                <OverviewCard
                  icon={MapPin}
                  label="Country"
                  value={safeValue(carrierData?.country || carrierData?.session_country, 'Waiting for region')}
                  meta={safeValue(carrierData?.country_code, 'Country code pending')}
                  tone="neutral"
                />
                <OverviewCard
                  icon={Clock3}
                  label="Last scan"
                  value={formatTime(statusSnapshot?.lastScanAt)}
                  meta={formatDateTime(statusSnapshot?.lastScanAt)}
                  tone="success"
                />
              </div>

              <AnimatePresence>
                {lastAlert && !simFrozen && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    className="simswap-alert-banner"
                  >
                    <div className="simswap-alert-icon">
                      <ShieldAlert size={30} />
                    </div>
                    <div className="simswap-alert-copy">
                      <span className="simswap-kicker">Critical response</span>
                      <h3>{lastAlert.message || 'High-risk SIM takeover activity detected'}</h3>
                      <p>Freeze downstream actions while you verify device ownership and carrier status.</p>
                    </div>
                    <button className="btn btn-danger" onClick={handleFreeze}>
                      <Lock size={16} /> Shield Assets
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="k-panel simswap-stream-panel">
                <div className="k-panel-head">
                  <div>
                    <span className="k-panel-kicker">Forensic Stream</span>
                    <h3>Live backend events</h3>
                  </div>
                  <div className="simswap-panel-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowAttackerPanel((current) => !current)}>
                      <Terminal size={14} /> Simulation Lab
                    </button>
                    <span className="simswap-status-chip simswap-connection-live">
                      <Globe size={12} /> Socket feed
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {showAttackerPanel && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="simswap-attack-lab-integrated"
                    >
                      <div className="simswap-lab-grid">
                        {ANOMALY_ACTIONS.map((action) => (
                          <button
                            key={action.id}
                            className="simswap-lab-chip"
                            onClick={() => handleTriggerAnomaly(action.id)}
                          >
                            {action.label}
                          </button>
                        ))}
                        <button className="btn btn-primary btn-sm simswap-demo-button" onClick={handleStartDemo}>
                          Run Auto Attack Sequence
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="simswap-stream-list">
                  {eventFeed.length === 0 ? (
                    <div className="simswap-empty-state">
                      <Server size={44} />
                      <h4>Waiting for backend events</h4>
                      <p>The stream will populate after registration, socket subscribe, and integrity scan completion.</p>
                    </div>
                  ) : (
                    eventFeed.map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="simswap-event-card"
                        style={{ borderLeftColor: getSeverityColor(event.severity) }}
                      >
                        <div className="simswap-event-head">
                          <span
                            className="simswap-event-type"
                            style={{
                              color: getSeverityColor(event.severity),
                              background: `${getSeverityColor(event.severity)}18`,
                            }}
                          >
                            {formatEventType(event.type)}
                          </span>
                          <span className="mono">{formatTime(event.timestamp)}</span>
                        </div>

                        <p>{event.description}</p>

                        {!!event.triggeredRules?.length && (
                          <div className="simswap-rule-row">
                            {event.triggeredRules.map((rule) => (
                              <span key={`${event.id}-${rule}`} className="simswap-rule-chip">
                                <AlertTriangle size={12} />
                                {rule}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              <div className="k-panel simswap-node-panel">
                <div className="k-panel-head">
                  <div>
                    <span className="k-panel-kicker">HLR Data Node</span>
                    <h3>Carrier intelligence</h3>
                  </div>
                  <span className={`simswap-status-pill simswap-risk-${riskLevel.toLowerCase()}`}>
                    <Activity size={14} /> {riskLevel} risk
                  </span>
                </div>

                <div className="simswap-node-hero">
                  <div>
                    <span>Provider</span>
                    <strong>{safeValue(carrierData?.provider_display, 'Waiting for live provider')}</strong>
                  </div>
                  <div>
                    <span>Confidence</span>
                    <strong>{carrierData?.carrier_confidence !== undefined ? `${carrierData.carrier_confidence}%` : 'Pending'}</strong>
                  </div>
                  <div>
                    <span>Validity</span>
                    <strong>{carrierData?.valid === undefined ? 'Pending' : carrierData.valid ? 'Valid' : 'Invalid'}</strong>
                  </div>
                </div>

                <div className="simswap-data-grid">
                  <DataPoint label="E164" value={safeValue(carrierData?.e164_number, formatPhone(simPhoneNumber))} mono />
                  <DataPoint label="Local number" value={safeValue(carrierData?.local_number, phone || 'Pending')} mono />
                  <DataPoint label="Carrier" value={safeValue(carrierData?.carrier || carrierData?.session_isp)} accent />
                  <DataPoint label="Line type" value={safeValue(carrierData?.line_type)} />
                  <DataPoint label="Country" value={safeValue(carrierData?.country || carrierData?.session_country)} />
                  <DataPoint label="Country code" value={safeValue(carrierData?.country_code)} />
                  <DataPoint label="MCC" value={safeValue(carrierData?.mcc)} mono />
                  <DataPoint label="MNC" value={safeValue(carrierData?.mnc)} mono />
                  <DataPoint label="SIM changed" value={carrierData?.sim_changed ? 'Yes' : 'No'} />
                  <DataPoint label="Last SIM swap" value={safeValue(carrierData?.last_sim_swap)} />
                  <DataPoint label="Fraud score" value={carrierData?.fraud_score !== undefined ? `${carrierData.fraud_score}/100` : 'Pending'} accent />
                  <DataPoint label="Note" value={safeValue(carrierData?.note, 'No provider note yet')} />
                </div>

                {carrierData?.raw && (
                  <div className="simswap-raw-card">
                    <div className="k-panel-head">
                      <div>
                        <span className="k-panel-kicker">Raw Provider Payload</span>
                        <h3>Selected backend fields</h3>
                      </div>
                      <Cpu size={18} color="#6ea8ff" />
                    </div>

                    <div className="simswap-data-grid">
                      <DataPoint label="Raw phone" value={safeValue(carrierData.raw.phone)} mono />
                      <DataPoint label="Region" value={safeValue(carrierData.raw.phone_region)} />
                      <DataPoint label="Prefix" value={safeValue(carrierData.raw.country_prefix ? `+${carrierData.raw.country_prefix}` : null)} mono />
                      <DataPoint label="Phone type" value={safeValue(carrierData.raw.phone_type || carrierData.raw.line_type)} />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
