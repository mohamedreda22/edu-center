import mongoose from 'mongoose';

import { env } from './env.js';
import logger from '../shared/services/logger.js';

export const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(env.MONGO_URI, options);
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Simplified connection monitoring
    mongoose.connection.on('error', (err) => {
      logger.error(`❌ MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    return conn;
  } catch (error) {
    logger.error(`❌ MongoDB initial connection error: ${error.message}`);
    // Do not exit process here, let the caller handle it if necessary
    throw error;
  }
};
