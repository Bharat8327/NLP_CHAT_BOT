import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

/**
 * General API rate limiter — 100 requests per 15 minutes per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Auth rate limiter — 20 login/register attempts per 15 minutes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
  handler: (req, res, next, options) => {
    logger.warn('Auth rate limit exceeded', { ip: req.ip });
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Chat rate limiter — 60 messages per minute per IP.
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Message rate limit exceeded. Please slow down.' },
});

/**
 * Socket.io rate limiter (manual implementation).
 * Returns a middleware function that tracks message counts per socket.
 */
export function createSocketRateLimiter({
  windowMs = 60000,
  maxMessages = 30,
} = {}) {
  const socketCounts = new Map();

  // Cleanup expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of socketCounts.entries()) {
      if (now - data.windowStart > windowMs) {
        socketCounts.delete(key);
      }
    }
  }, windowMs);

  return (socketId) => {
    const now = Date.now();
    let data = socketCounts.get(socketId);

    if (!data || now - data.windowStart > windowMs) {
      data = { windowStart: now, count: 0 };
      socketCounts.set(socketId, data);
    }

    data.count++;

    if (data.count > maxMessages) {
      logger.warn('Socket rate limit exceeded', { socketId, count: data.count });
      return false; // blocked
    }

    return true; // allowed
  };
}
