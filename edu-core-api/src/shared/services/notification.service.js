import emailAdapter from './EmailAdapter.js';
import logger from './logger.js';

/**
 * Pluggable Notification Service
 */
class NotificationService {
  constructor() {
    this.adapters = [];
  }

  /**
   * Add a delivery channel adapter (Email, SMS, etc.)
   * @param {Object} adapter
   */
  registerAdapter(adapter) {
    this.adapters.push(adapter);
  }

  /**
   * Send notification through all registered adapters
   * @param {Object} payload
   */
  async notify(payload) {
    const { userId, title, message, type } = payload;

    logger.info(`Notification triggered for user ${userId}: ${title}`);

    const results = await Promise.allSettled(
      this.adapters.map((adapter) =>
        adapter.send({ userId, title, message, type })
      )
    );

    results.forEach((res, i) => {
      if (res.status === 'rejected') {
        logger.error(`Notification adapter ${i} failed: ${res.reason}`);
      }
    });
  }
}

export const notificationService = new NotificationService();

// Register adapters
notificationService.registerAdapter(emailAdapter);

// Mock console adapter for development
notificationService.registerAdapter({
  name: 'ConsoleAdapter',
  send: async (p) => {
    console.log(`[NOTIFICATION] To: ${p.userId} | ${p.title}: ${p.message}`);
  },
});
