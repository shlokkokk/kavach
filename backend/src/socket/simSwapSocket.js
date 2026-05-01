const { 
  startDemoSequence, 
  injectAnomaly, 
  performIntegrityScan,
  initSensor,
  getSensorState,
} = require('../services/simEventSimulator');

function emitSimStatus(socket, phoneNumber) {
  const state = getSensorState(phoneNumber);
  if (!state) {
    return;
  }

  socket.emit('sim-status', {
    phoneNumber: state.phoneNumber,
    deviceId: state.deviceId,
    riskScore: state.riskScore,
    isFrozen: state.isFrozen,
    lastScanAt: state.lastScanAt,
    carrierData: state.carrierData,
    alerts: state.alerts,
    events: state.events,
    triggeredRules: state.triggeredRules,
    location: state.location,
    updatedAt: state.updatedAt,
  });
}

function initSimSwapSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    let cleanupDemo = null;

    socket.on('subscribe', ({ phoneNumber }) => {
      console.log(`[Socket] Client ${socket.id} subscribed to ${phoneNumber}`);
      socket.join(`sim-${phoneNumber}`);
      socket.phoneNumber = phoneNumber;
      
      // Initialize sensor state for this number
      initSensor(phoneNumber);
      emitSimStatus(socket, phoneNumber);
    });

    socket.on('start-demo', () => {
      console.log(`[Socket] Demo started for ${socket.id}`);
      if (cleanupDemo) cleanupDemo();
      cleanupDemo = startDemoSequence(socket, socket.phoneNumber || '9876543210');
    });

    socket.on('trigger-anomaly', ({ type }) => {
      console.log(`[Socket] Manual anomaly ${type} triggered for ${socket.phoneNumber}`);
      injectAnomaly(socket, socket.phoneNumber, type);
      emitSimStatus(socket, socket.phoneNumber);
    });

    socket.on('manual-scan', async () => {
      console.log(`[Socket] Manual integrity scan requested for ${socket.phoneNumber}`);
      const apiKey = process.env.IPQS_API_KEY;
      await performIntegrityScan(socket, socket.phoneNumber, apiKey);
      emitSimStatus(socket, socket.phoneNumber);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      if (cleanupDemo) cleanupDemo();
    });
  });

  console.log('[Socket] SIM swap socket initialized');
}

module.exports = { initSimSwapSocket };
