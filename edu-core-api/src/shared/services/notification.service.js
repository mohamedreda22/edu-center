import emailAdapter from './EmailAdapter.js';
import logger from './logger.js';
import whatsAppAdapter from './WhatsAppAdapter.js';
import User from '../../modules/users/user.model.js';

/**
 * Pluggable Notification Service
 */
class NotificationService {
  constructor() {
    this.adapters = [];
  }

  /**
   * Add a delivery channel adapter (Email, SMS, WhatsApp, etc.)
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
    const { userId, title, message, type, data = {} } = payload;

    logger.info(`Notification triggered for user ${userId}: ${title}`);

    // Fetch user for contact info if only userId is provided
    const contactInfo = { email: payload.email, phone: payload.phone };
    if (userId && (!contactInfo.email || !contactInfo.phone)) {
      const user = await User.findById(userId).select('email phone');
      if (user) {
        contactInfo.email = contactInfo.email || user.email;
        contactInfo.phone = contactInfo.phone || user.phone;
      }
    }

    const results = await Promise.allSettled(
      this.adapters.map((adapter) =>
        adapter.send({
          userId,
          title,
          message,
          type,
          email: contactInfo.email,
          phone: contactInfo.phone,
          data,
        })
      )
    );

    results.forEach((res, i) => {
      if (res.status === 'rejected') {
        logger.error(
          `Notification adapter ${this.adapters[i].name} failed: ${res.reason}`
        );
      } else if (res.value && res.value.success === false) {
        logger.warn(
          `Notification adapter ${this.adapters[i].name} returned failure: ${res.value.error}`
        );
      }
    });
  }
}

export const notificationService = new NotificationService();

// Register adapters
notificationService.registerAdapter(emailAdapter);
notificationService.registerAdapter(whatsAppAdapter);

// Mock console adapter for development
notificationService.registerAdapter({
  name: 'ConsoleAdapter',
  send: async (p) => {
    console.log(
      `[NOTIFICATION] To: ${p.userId || p.phone || p.email} | ${p.title}: ${p.message}`
    );
    return { success: true };
  },
});
