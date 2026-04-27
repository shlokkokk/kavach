const express = require('express');
const router = express.Router();

// In-memory store for registered numbers (demo purposes)
const registeredNumbers = new Map();

router.post('/register', (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ success: false, error: 'Phone number required' });

  registeredNumbers.set(phoneNumber, {
    phoneNumber,
    registeredAt: new Date().toISOString(),
    deviceId: `DEV-${Date.now()}`,
    status: 'ACTIVE',
    riskScore: 0,
  });

  res.json({ success: true, data: { message: `Monitoring started for ${phoneNumber}` } });
});

router.get('/status/:phone', (req, res) => {
  const info = registeredNumbers.get(req.params.phone);
  if (!info) return res.status(404).json({ success: false, error: 'Number not registered' });
  res.json({ success: true, data: info });
});

router.post('/freeze', (req, res) => {
  const { phoneNumber } = req.body;
  const info = registeredNumbers.get(phoneNumber);
  if (info) info.status = 'FROZEN';
  res.json({ success: true, data: { message: `Transactions frozen for ${phoneNumber}`, frozenAt: new Date().toISOString() } });
});

router.post('/mark-safe', (req, res) => {
  const { phoneNumber } = req.body;
  const info = registeredNumbers.get(phoneNumber);
  if (info) { info.status = 'ACTIVE'; info.riskScore = 0; }
  res.json({ success: true, data: { message: `${phoneNumber} marked as safe`, clearedAt: new Date().toISOString() } });
});

module.exports = router;
