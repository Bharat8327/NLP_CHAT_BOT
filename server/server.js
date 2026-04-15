import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import helmet from 'helmet';
import { Server } from 'socket.io';

// Config
import dbConnect from './config/dbConnect.js';
import logger from './utils/logger.js';

// Routers
import authRouter from './routers/authRouter.js';
import chatHistoryRouter from './routers/chatHistoryRouter.js';
import sessionRouter from './routers/sessionRouter.js';

// Middleware
import { apiLimiter, authLimiter, createSocketRateLimiter } from './middleware/rateLimiter.js';

// Controllers
import geminiController from './controller/geminiController.js';

// ────────────────────────────────────────────
// Environment
// ────────────────────────────────────────────
dotenv.config();

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Validate critical env vars (including JWT_SECRET)
const requiredEnv = ['GEMINI_API_KEY', 'MODEL', 'MONGO_URI', 'JWT_SECRET'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    logger.critical(`Missing required env variable: ${key}`);
    process.exit(1);
  }
}

// ────────────────────────────────────────────
// Express App
// ────────────────────────────────────────────
const app = express();

// Trust Render's Load Balancer / Cloudflare proxy
app.set('trust proxy', 1);

// Security headers with CSP enabled
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", CLIENT_URL, "wss:", "ws:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
  })
);

// Compression for all responses
app.use(compression());

// Body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('short'));

// Cookies
app.use(cookieParser());

// CORS
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN', 'x-xsrf-token'],
  })
);

// ────────────────────────────────────────────
// API Routes
// ────────────────────────────────────────────

// Health check
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'running',
    message: 'NLP Chat Bot Server 🚀',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

// Health check (safe — no sensitive server info)
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Auth routes (with stricter rate limiting)
app.use('/api/auth', authLimiter, authRouter);

// Chat history routes (protected by auth middleware inside router)
app.use('/api/chat', apiLimiter, chatHistoryRouter);

// Session/preferences routes
app.use('/api/session', apiLimiter, sessionRouter);

// LiveKit token endpoint (if LiveKit is configured)
if (process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET) {
  const loadLiveKit = async () => {
    try {
      const { AccessToken } = await import('livekit-server-sdk');

      app.get('/token', (req, res) => {
        try {
          const identity =
            req.query.identity || 'user_' + Math.random().toString(36).slice(2, 8);
          const room = req.query.room || 'default-room';

          const at = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET,
            { identity }
          );

          at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

          const token = at.toJwt();
          logger.info('LiveKit token generated', { identity, room });
          res.status(200).json({ token });
        } catch (err) {
          logger.error('LiveKit token error', { error: err.message });
          res.status(500).json({ error: 'Failed to generate token' });
        }
      });

      logger.info('LiveKit token endpoint registered');
    } catch {
      logger.warn('LiveKit SDK not loaded — token endpoint disabled');
    }
  };
  loadLiveKit();
} else {
  logger.info('LiveKit credentials not found — token endpoint disabled');
}

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack?.split('\n')[0] });
  res.status(500).json({ error: 'Internal server error' });
});

// ────────────────────────────────────────────
// HTTP + Socket.IO Server
// ────────────────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Performance: enable binary transport for audio
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 5e6, // 5MB max for audio data
});

// Create socket rate limiter
const socketRateLimiter = createSocketRateLimiter({
  windowMs: 60000,  // 1 minute
  maxMessages: 30,   // 30 messages per minute
});

// Track connected clients
let connectedClients = 0;

io.on('connection', (socket) => {
  connectedClients++;
  logger.info('Client connected', {
    socketId: socket.id,
    totalClients: connectedClients,
    transport: socket.conn.transport.name,
  });

  // Register Gemini stream handler with rate limiter
  geminiController.handleGeminiStream(socket, socketRateLimiter);

  // Handle transport upgrade (polling → websocket)
  socket.conn.on('upgrade', (transport) => {
    logger.debug('Transport upgraded', {
      socketId: socket.id,
      transport: transport.name,
    });
  });

  socket.on('disconnect', (reason) => {
    connectedClients--;
    logger.info('Client disconnected', {
      socketId: socket.id,
      reason,
      totalClients: connectedClients,
    });
  });

  socket.on('error', (err) => {
    logger.error('Socket error', { socketId: socket.id, error: err.message });
  });
});

// ────────────────────────────────────────────
// Start Server
// ────────────────────────────────────────────
server.listen(PORT, async () => {
  try {
    await dbConnect();
    logger.info(`✅ Server running on port ${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
      clientUrl: CLIENT_URL,
      model: process.env.MODEL,
    });
  } catch (err) {
    logger.critical('Failed to start server', { error: err.message });
    process.exit(1);
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  io.close();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.critical('Uncaught exception', { error: err.message });
  process.exit(1);
});
