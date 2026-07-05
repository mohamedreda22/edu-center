import mongoose from 'mongoose';

import { env } from './env.js';
import logger from '../shared/services/logger.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Check if replica set is enabled
    const admin = mongoose.connection.db.admin();
    const status = await admin.replSetGetStatus().catch(() => null);

    if (!status) {
      logger.warn(
        '⚠️ WARNING: MongoDB is NOT running as a replica set. Transactions will not work.'
      );
      if (env.NODE_ENV === 'production') {
        logger.error('❌ ERROR: Replica set is required for production.');
        process.exit(1);
      }
    } else {
      logger.info('✅ MongoDB Replica Set detected. Transactions are enabled.');
    }
  } catch (error) {
    logger.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};
