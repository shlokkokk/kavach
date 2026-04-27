require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");

const audioRoutes = require("./routes/audio.routes");
const jobscanRoutes = require("./routes/jobscan.routes");
const simswapRoutes = require("./routes/simswap.routes");
const { initSimSwapSocket } = require("./socket/simSwapSocket");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: true, // Allow any origin dynamically
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "KAVACH Backend",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/audio", audioRoutes);
app.use("/api/job", jobscanRoutes);
app.use("/api/sim", simswapRoutes);

// Error handling
app.use(errorMiddleware);

// Initialize WebSocket
initSimSwapSocket(io);

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🛡️  KAVACH Backend running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready on ws://localhost:${PORT}`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health\n`);
});
