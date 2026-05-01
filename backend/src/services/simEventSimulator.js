const { v4: uuidv4 } = require('uuid');
const { lookupPhone } = require('./carrierApi');

// In-memory state for active sensors
const ACTIVE_SENSORS = new Map();

const RISK_RULES = [
  { id: 'NEW_SIM_SERIAL', weight: 35, desc: 'SIM serial changed' },
  { id: 'DEVICE_MISMATCH', weight: 25, desc: 'New device fingerprint detected' },
  { id: 'LOCATION_JUMP', weight: 30, desc: 'Location jumped >100km instantly' },
  { id: 'RAPID_OTP_REQUEST', weight: 40, desc: 'OTP requested within 5 min of SIM change' },
  { id: 'AFTER_HOURS', weight: 15, desc: 'Activity between 2AM-5AM' },
  { id: 'MULTIPLE_FAILED_AUTH', weight: 20, desc: '3+ failed auth attempts' },
];

function createInitialState(phoneNumber) {
  return {
    phoneNumber,
    simSerial: '89911234567890123456',
    deviceId: `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    location: 'Surat, Gujarat',
    lastOtpTime: null,
    failedAttempts: 0,
    riskScore: 5,
    events: [],
    alerts: [],
    triggeredRules: [],
    isFrozen: false,
    carrierData: null,
    lastScanAt: null,
    updatedAt: new Date().toISOString(),
  };
}

function touchState(state) {
  state.updatedAt = new Date().toISOString();
}

/**
 * Initialize a sensor for a phone number
 */
function initSensor(phoneNumber, options = {}) {
  const { forceReset = false } = options;
  const existing = ACTIVE_SENSORS.get(phoneNumber);

  if (existing && !forceReset) {
    return existing;
  }

  const state = createInitialState(phoneNumber);
  ACTIVE_SENSORS.set(phoneNumber, state);
  return state;
}

function getSensorState(phoneNumber) {
  return ACTIVE_SENSORS.get(phoneNumber) || null;
}

function markSensorFrozen(phoneNumber) {
  const state = initSensor(phoneNumber);
  state.isFrozen = true;
  touchState(state);
  return state;
}

function markSensorSafe(phoneNumber) {
  const state = initSensor(phoneNumber);
  state.riskScore = 5;
  state.alerts = [];
  state.triggeredRules = [];
  state.isFrozen = false;
  touchState(state);
  return state;
}

/**
 * Inject an anomaly manually (used by Attacker Panel)
 */
function injectAnomaly(socket, phoneNumber, anomalyType) {
  const state = ACTIVE_SENSORS.get(phoneNumber) || initSensor(phoneNumber);
  let event = null;

  switch (anomalyType) {
    case 'SIM_SWAP':
      state.simSerial = `8991${Math.floor(Math.random() * 1000000000000000)}`;
      state.triggeredRules.push('NEW_SIM_SERIAL');
      event = makeEvent(phoneNumber, 'SIM_CHANGE_DETECTED', 'HIGH', `SIM serial changed to ${state.simSerial}. Carrier flagged unauthorized request.`, state.triggeredRules);
      break;

    case 'DEVICE_CHANGE':
      const oldDevice = state.deviceId;
      state.deviceId = `DEV-${Math.random().toString(36).substring(7).toUpperCase()}`;
      state.triggeredRules.push('DEVICE_MISMATCH');
      event = makeEvent(phoneNumber, 'DEVICE_CHANGE', 'HIGH', `New device detected. Old: ${oldDevice}, New: ${state.deviceId}. IMEI hash mismatch.`, state.triggeredRules);
      break;

    case 'LOCATION_JUMP':
      state.location = 'Mumbai, Maharashtra';
      state.triggeredRules.push('LOCATION_JUMP');
      event = makeEvent(phoneNumber, 'LOCATION_ANOMALY', 'HIGH', 'Location jumped from Surat to Mumbai (270km) instantly. Physically impossible travel.', state.triggeredRules);
      break;

    case 'OTP_FLOOD':
      state.lastOtpTime = new Date();
      state.triggeredRules.push('RAPID_OTP_REQUEST');
      event = makeEvent(phoneNumber, 'OTP_REQUEST', 'CRITICAL', 'OTP requested for HDFC Bank login. Request from suspicious session.', state.triggeredRules);
      break;

    case 'AUTH_FAILURE':
      state.failedAttempts += 3;
      state.triggeredRules.push('MULTIPLE_FAILED_AUTH');
      event = makeEvent(phoneNumber, 'FAILED_AUTH', 'CRITICAL', '3 failed authentication attempts detected in 90 seconds. Brute force suspected.', state.triggeredRules);
      break;
  }

  if (event) {
    // Recalculate risk score based on rules
    const uniqueRules = [...new Set(state.triggeredRules)];
    state.riskScore = Math.min(99, 5 + uniqueRules.reduce((acc, ruleId) => {
      const rule = RISK_RULES.find(r => r.id === ruleId);
      return acc + (rule ? rule.weight : 0);
    }, 0));

    event.riskScore = state.riskScore;
    state.events.unshift(event);
    touchState(state);
    socket.emit('sim-event', event);

    if (state.riskScore >= 85) {
      const alert = {
        id: uuidv4(),
        message: 'SIM SWAP ATTACK DETECTED - High probability of account takeover.',
        riskScore: state.riskScore,
        timestamp: new Date().toISOString(),
        triggeredRules: uniqueRules
      };
      state.alerts.push(alert);
      touchState(state);
      socket.emit('threat-alert', alert);
    }
  }

  return state;
}

/**
 * Perform a manual integrity scan using the Carrier API
 */
async function performIntegrityScan(socket, phoneNumber, apiKey) {
  const state = ACTIVE_SENSORS.get(phoneNumber) || initSensor(phoneNumber);
  const clientIp = socket.handshake?.headers?.['x-forwarded-for'] || socket.handshake?.address;
  
  // Start scan event
  socket.emit('sim-event', makeEvent(phoneNumber, 'INTEGRITY_SCAN_START', 'LOW', 'Connecting to global carrier network for integrity check...', []));

  // Simulate network delay
  await new Promise(r => setTimeout(r, 1500));

  const carrierData = await lookupPhone(phoneNumber, apiKey, { clientIp });
  state.carrierData = carrierData;
  state.lastScanAt = new Date().toISOString();
  state.riskScore = carrierData.fraud_score ?? state.riskScore;
  if (carrierData.sim_changed && !state.triggeredRules.includes('NEW_SIM_SERIAL')) {
    state.triggeredRules.push('NEW_SIM_SERIAL');
  }
  
  const scanEvent = makeEvent(phoneNumber, 'INTEGRITY_SCAN_COMPLETE', carrierData.risky ? 'HIGH' : 'LOW', 
    `Scan complete for ${phoneNumber}. Carrier/ISP: ${carrierData.carrier || carrierData.session_isp || 'Unknown'}. SIM Status: ${carrierData.sim_changed ? 'SWAPPED' : 'OK'}.`, 
    carrierData.sim_changed ? ['NEW_SIM_SERIAL'] : []);
  
  scanEvent.details = carrierData;
  scanEvent.riskScore = carrierData.fraud_score;
  
  state.events.unshift(scanEvent);
  touchState(state);
  socket.emit('sim-event', scanEvent);
  return carrierData;
}

function makeEvent(phoneNumber, type, severity, description, triggeredRules) {
  return {
    id: uuidv4(),
    type,
    severity,
    description,
    phoneNumber,
    timestamp: new Date().toISOString(),
    triggeredRules,
  };
}

/**
 * Legacy support for the demo button
 */
function startDemoSequence(socket, phoneNumber) {
  initSensor(phoneNumber, { forceReset: true });
  const timers = [];
  
  // Trigger events sequentially
  const sequence = ['SIM_SWAP', 'DEVICE_CHANGE', 'LOCATION_JUMP', 'OTP_FLOOD'];
  
  sequence.forEach((type, index) => {
    const timer = setTimeout(() => {
      injectAnomaly(socket, phoneNumber, type);
    }, (index + 1) * 4000);
    timers.push(timer);
  });

  return () => timers.forEach(clearTimeout);
}

module.exports = { 
  initSensor, 
  getSensorState,
  markSensorFrozen,
  markSensorSafe,
  injectAnomaly, 
  performIntegrityScan, 
  startDemoSequence,
  RISK_RULES 
};
