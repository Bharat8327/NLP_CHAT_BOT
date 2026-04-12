import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const dbConnect = async () => {
  const mongoUrl = process.env.MONGO_URI;

  if (!mongoUrl) {
    logger.warn('MONGO_URI not set — database features disabled');
    return;
  }

  try {
    const connect = await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 10000, // 10s timeout
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 to prevent Node.js IPv6 ECONNREFUSED errors
    });
    logger.info('MongoDB Connected', { host: connect.connection.host });
  } catch (error) {
    logger.error('MongoDB connection failed — server will run without DB', {
      error: error.message,
    });
    // Don't exit — let the server run for socket.io features
    // DB-dependent routes will return 500 errors gracefully
  }
};

// Handle mongoose connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', { error: err.message });
});

export default dbConnect;
