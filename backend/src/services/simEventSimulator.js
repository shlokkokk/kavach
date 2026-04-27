const { v4: uuidv4 } = require('uuid');

const RISK_RULES = [
  { id: 'NEW_SIM_SERIAL', weight: 30, desc: 'SIM serial changed' },
  { id: 'DEVICE_MISMATCH', weight: 25, desc: 'New device fingerprint detected' },
  { id: 'LOCATION_JUMP', weight: 20, desc: 'Location changed >100km instantly' },
  { id: 'RAPID_OTP_REQUEST', weight: 35, desc: 'OTP requested within 5 min of SIM change' },
  { id: 'AFTER_HOURS', weight: 10, desc: 'Activity between 2AM-5AM' },
  { id: 'MULTIPLE_FAILED_AUTH', weight: 15, desc: '3+ failed auth attempts' },
];

/**
 * Run demo attack sequence with realistic timed events
 */
function startDemoSequence(socket, phoneNumber) {
  const events = [];
  let eventIndex = 0;

  // Phase 1: Normal activity (0-8s)
  events.push({ delay: 1000, event: makeEvent('BALANCE_CHECK', 'LOW', 'Balance inquiry via mobile banking', 5, phoneNumber, []) });
  events.push({ delay: 3000, event: makeEvent('LOGIN_SUCCESS', 'LOW', 'Successful login from registered device', 5, phoneNumber, []) });
  events.push({ delay: 5000, event: makeEvent('BILL_PAYMENT', 'LOW', 'Electricity bill payment of ₹2,340', 5, phoneNumber, []) });
  events.push({ delay: 8000, event: makeEvent('SESSION_ACTIVE', 'LOW', 'Active banking session — 2 transactions today', 8, phoneNumber, []) });

  // Phase 2: SIM change detected (12s)
  events.push({ delay: 12000, event: makeEvent('SIM_CHANGE_DETECTED', 'HIGH', 'SIM serial changed from 89911234567890 to 89919876543210. Carrier flagged unauthorized SIM swap request.', 45, phoneNumber, ['NEW_SIM_SERIAL'], {
    oldSimSerial: '89911234567890123456',
    newSimSerial: '89919876543210987654',
  })});

  // Phase 3: Device mismatch (15s)
  events.push({ delay: 15000, event: makeEvent('DEVICE_CHANGE', 'HIGH', 'New device detected: Samsung Galaxy A14 (previously: iPhone 13). IMEI hash mismatch.', 65, phoneNumber, ['NEW_SIM_SERIAL', 'DEVICE_MISMATCH'], {
    oldDevice: 'iPhone 13 (IMEI: A3F2...)',
    newDevice: 'Samsung Galaxy A14 (IMEI: 7B91...)',
    deviceChanged: true,
  })});

  // Phase 4: Location jump (18s)
  events.push({ delay: 18000, event: makeEvent('LOCATION_ANOMALY', 'HIGH', 'Location jumped from Surat, GJ to Mumbai, MH (270km) within 3 minutes. Physically impossible travel.', 78, phoneNumber, ['NEW_SIM_SERIAL', 'DEVICE_MISMATCH', 'LOCATION_JUMP'], {
    registeredLocation: 'Surat, Gujarat',
    newLocation: 'Mumbai, Maharashtra',
    distance: '270 km',
    timeElapsed: '3 minutes',
  })});

  // Phase 5: OTP request — CRITICAL (22s)
  events.push({ delay: 22000, event: makeEvent('OTP_REQUEST', 'CRITICAL', '⚠️ OTP requested for HDFC Bank net banking login. Request from new SIM + new device + new location!', 94, phoneNumber, ['NEW_SIM_SERIAL', 'DEVICE_MISMATCH', 'LOCATION_JUMP', 'RAPID_OTP_REQUEST'], {
    service: 'HDFC Bank Net Banking',
    requestType: 'Login OTP',
    channel: 'SMS',
  })});

  // Phase 6: Failed auth attempts (24s)
  events.push({ delay: 24000, event: makeEvent('FAILED_AUTH', 'CRITICAL', '3 failed authentication attempts on HDFC Bank in 90 seconds from Mumbai. Attack in progress!', 97, phoneNumber, ['NEW_SIM_SERIAL', 'DEVICE_MISMATCH', 'LOCATION_JUMP', 'RAPID_OTP_REQUEST', 'MULTIPLE_FAILED_AUTH']) });

  // Emit events on schedule
  const timers = [];
  events.forEach(({ delay, event }) => {
    const timer = setTimeout(() => {
      socket.emit('sim-event', event);
      
      // Emit threat alert at high risk
      if (event.riskScore >= 90) {
        socket.emit('threat-alert', {
          id: uuidv4(),
          message: 'SIM SWAP ATTACK DETECTED — Freeze transactions immediately!',
          riskScore: event.riskScore,
          timestamp: new Date().toISOString(),
          triggeredRules: event.triggeredRules,
        });
      }
    }, delay);
    timers.push(timer);
  });

  // Auto freeze at 28s
  timers.push(setTimeout(() => {
    socket.emit('bank-frozen', {
      phoneNumber,
      frozenAt: new Date().toISOString(),
      message: 'All banking transactions frozen. SMS alert sent to registered email.',
    });
  }, 28000));

  return () => timers.forEach(clearTimeout);
}

function makeEvent(type, severity, description, riskScore, phoneNumber, triggeredRules, details = {}) {
  return {
    id: uuidv4(),
    type,
    severity,
    description,
    riskScore,
    phoneNumber,
    timestamp: new Date().toISOString(),
    triggeredRules,
    details,
  };
}

module.exports = { startDemoSequence, RISK_RULES };
