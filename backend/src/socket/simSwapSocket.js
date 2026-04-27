const { startDemoSequence } = require('../services/simEventSimulator');

function initSimSwapSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    let cleanupDemo = null;

    socket.on('subscribe', ({ phoneNumber }) => {
      console.log(`[Socket] Client ${socket.id} subscribed to ${phoneNumber}`);
      socket.join(`sim-${phoneNumber}`);
      socket.phoneNumber = phoneNumber;
    });

    socket.on('start-demo', () => {
      console.log(`[Socket] Demo started for ${socket.id}`);
      if (cleanupDemo) cleanupDemo(); // Cancel any existing demo
      cleanupDemo = startDemoSequence(socket, socket.phoneNumber || '9876543210');
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      if (cleanupDemo) cleanupDemo();
    });
  });

  console.log('[Socket] SIM swap socket initialized');
}

module.exports = { initSimSwapSocket };
