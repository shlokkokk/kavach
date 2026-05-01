const express = require('express');
const router = express.Router();
const {
  initSensor,
  getSensorState,
  markSensorFrozen,
  markSensorSafe,
} = require('../services/simEventSimulator');

// In-memory store for registered numbers (demo purposes)
const registeredNumbers = new Map();

function serializeStatus(phoneNumber) {
  const registration = registeredNumbers.get(phoneNumber);
  const sensor = getSensorState(phoneNumber);

  if (!registration && !sensor) {
    return null;
  }

  return {
    phoneNumber,
    registeredAt: registration?.registeredAt || null,
    status: registration?.status || (sensor?.isFrozen ? 'FROZEN' : 'ACTIVE'),
    deviceId: registration?.deviceId || sensor?.deviceId || null,
    riskScore: sensor?.riskScore ?? registration?.riskScore ?? 0,
    isFrozen: !!sensor?.isFrozen,
    lastScanAt: sensor?.lastScanAt || null,
    triggeredRules: sensor?.triggeredRules || [],
    events: sensor?.events || [],
    alerts: sensor?.alerts || [],
    carrierData: sensor?.carrierData || null,
    location: sensor?.location || null,
    updatedAt: sensor?.updatedAt || registration?.registeredAt || null,
  };
}

router.post('/register', (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ success: false, error: 'Phone number required' });

  const sensor = initSensor(phoneNumber);
  registeredNumbers.set(phoneNumber, {
    phoneNumber,
    registeredAt: new Date().toISOString(),
    deviceId: sensor.deviceId,
    status: 'ACTIVE',
    riskScore: sensor.riskScore,
  });

  res.json({
    success: true,
    data: {
      message: `Monitoring started for ${phoneNumber}`,
      status: serializeStatus(phoneNumber),
    },
  });
});

router.get('/status/:phone', (req, res) => {
  const info = serializeStatus(req.params.phone);
  if (!info) return res.status(404).json({ success: false, error: 'Number not registered' });
  res.json({ success: true, data: info });
});

router.post('/freeze', (req, res) => {
  const { phoneNumber } = req.body;
  const info = registeredNumbers.get(phoneNumber);
  if (info) info.status = 'FROZEN';
  markSensorFrozen(phoneNumber);
  res.json({
    success: true,
    data: {
      message: `Transactions frozen for ${phoneNumber}`,
      frozenAt: new Date().toISOString(),
      status: serializeStatus(phoneNumber),
    },
  });
});

router.post('/mark-safe', (req, res) => {
  const { phoneNumber } = req.body;
  const info = registeredNumbers.get(phoneNumber);
  if (info) { info.status = 'ACTIVE'; info.riskScore = 0; }
  markSensorSafe(phoneNumber);
  res.json({
    success: true,
    data: {
      message: `${phoneNumber} marked as safe`,
      clearedAt: new Date().toISOString(),
      status: serializeStatus(phoneNumber),
    },
  });
});

module.exports = router;
