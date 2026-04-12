/**
 * Structured logger with levels, colors, and JSON output.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
};

const COLORS = {
  DEBUG: '\x1b[36m',   // cyan
  INFO: '\x1b[32m',    // green
  WARN: '\x1b[33m',    // yellow
  ERROR: '\x1b[31m',   // red
  CRITICAL: '\x1b[35m', // magenta
  RESET: '\x1b[0m',
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.DEBUG;

function formatLog(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  const color = COLORS[level] || COLORS.RESET;
  const prefix = `${color}[${level}]${COLORS.RESET}`;
  const metaStr = Object.keys(meta).length
    ? ` ${JSON.stringify(meta)}`
    : '';

  if (LOG_LEVELS[level] >= currentLevel) {
    console.log(`${prefix} ${entry.timestamp} - ${message}${metaStr}`);
  }

  return entry;
}

const logger = {
  debug: (msg, meta) => formatLog('DEBUG', msg, meta),
  info: (msg, meta) => formatLog('INFO', msg, meta),
  warn: (msg, meta) => formatLog('WARN', msg, meta),
  error: (msg, meta) => formatLog('ERROR', msg, meta),
  critical: (msg, meta) => formatLog('CRITICAL', msg, meta),

  // Performance timer
  startTimer: (label) => {
    const start = performance.now();
    return {
      end: (meta = {}) => {
        const duration = Math.round(performance.now() - start);
        formatLog('INFO', `⏱ ${label} completed`, { ...meta, durationMs: duration });
        return duration;
      },
    };
  },

  // API call tracker
  apiCall: (service, method, meta = {}) => {
    const start = performance.now();
    return {
      success: (respMeta = {}) => {
        const duration = Math.round(performance.now() - start);
        formatLog('INFO', `API ✓ ${service}.${method}`, {
          ...meta,
          ...respMeta,
          durationMs: duration,
        });
      },
      failure: (error, respMeta = {}) => {
        const duration = Math.round(performance.now() - start);
        formatLog('ERROR', `API ✗ ${service}.${method}: ${error}`, {
          ...meta,
          ...respMeta,
          durationMs: duration,
        });
      },
    };
  },
};

export default logger;
