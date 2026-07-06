import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import logger from './shared/services/logger.js';
import {
  triggerLessonReminders,
  triggerPaymentReminders,
} from './shared/services/notificationTriggers.service.js';

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    const PORT = env.PORT || 5000;
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);

      // Setup simple daily check for notifications (mocking a cron job)
      const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
      setInterval(async () => {
        try {
          await triggerLessonReminders();
          await triggerPaymentReminders();
        } catch (error) {
          logger.error('Error in automated notification triggers:', error);
        }
      }, CHECK_INTERVAL);

      // Also run once on startup in dev
      if (env.NODE_ENV === 'development') {
        triggerLessonReminders().catch((err) =>
          logger.error('Startup Lesson Reminder failed:', err)
        );
        triggerPaymentReminders().catch((err) =>
          logger.error('Startup Payment Reminder failed:', err)
        );
      }
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
