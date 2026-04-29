const { 
  startDemoSequence, 
  injectAnomaly, 
  performIntegrityScan,
  initSensor
} = require('../services/simEventSimulator');

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
    });

    socket.on('start-demo', () => {
      console.log(`[Socket] Demo started for ${socket.id}`);
      if (cleanupDemo) cleanupDemo();
      cleanupDemo = startDemoSequence(socket, socket.phoneNumber || '9876543210');
    });

    socket.on('trigger-anomaly', ({ type }) => {
      console.log(`[Socket] Manual anomaly ${type} triggered for ${socket.phoneNumber}`);
      injectAnomaly(socket, socket.phoneNumber, type);
    });

    socket.on('manual-scan', async () => {
      console.log(`[Socket] Manual integrity scan requested for ${socket.phoneNumber}`);
      const apiKey = process.env.IPQS_API_KEY;
      await performIntegrityScan(socket, socket.phoneNumber, apiKey);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      if (cleanupDemo) cleanupDemo();
    });
  });

  console.log('[Socket] SIM swap socket initialized');
}

module.exports = { initSimSwapSocket };
