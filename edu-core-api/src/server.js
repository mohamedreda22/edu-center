import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import logger from './shared/services/logger.js';

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    const PORT = env.PORT || 5000;
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });

    // Handle Unhandled Rejections
    process.on('unhandledRejection', (err) => {
      logger.error('❌ UNHANDLED REJECTION! Shutting down...');
      logger.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle Sigterm
    process.on('SIGTERM', () => {
      logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        logger.info('💥 Process terminated!');
      });
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
