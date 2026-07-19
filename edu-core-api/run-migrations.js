import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './src/shared/services/logger.js';
import { runDatabaseMigrations } from './src/shared/mongoose/migrationRunner.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  logger.error('❌ MONGO_URI is missing from environment variables.');
  process.exit(1);
}

async function execute() {
  try {
    logger.info('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    logger.info('✅ Connected to MongoDB.');

    // Run Versioned Database Migrations
    await runDatabaseMigrations();

    logger.info('✨ All migrations applied successfully!');
  } catch (err) {
    logger.error(`❌ Migration script execution failed: ${err.message}`);
  } finally {
    await mongoose.disconnect();
    logger.info('🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
}

execute();
