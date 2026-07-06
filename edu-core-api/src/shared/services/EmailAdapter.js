import logger from './logger.js';

/**
 * Mock Email Adapter
 */
class EmailAdapter {
  constructor() {
    this.name = 'EmailAdapter';
  }

  async send({ userId, title, message }) {
    // In a real implementation, you would use nodemailer or a service like SendGrid
    logger.info(
      `[EMAIL ADAPTER] Sending email to user ${userId}: [${title}] ${message}`
    );

    // Simulate async work
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 100);
    });
  }
}

export default new EmailAdapter();
