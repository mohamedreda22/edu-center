import logger from './logger.js';
import { env } from '../../config/env.js';

/**
 * WhatsApp Adapter using Twilio (Placeholder/Architecture-ready)
 */
class WhatsAppAdapter {
  constructor() {
    this.name = 'WhatsAppAdapter';
    this.accountSid = env.TWILIO_ACCOUNT_SID;
    this.authToken = env.TWILIO_AUTH_TOKEN;
    this.from = env.TWILIO_WHATSAPP_FROM; // e.g., 'whatsapp:+14155238886'
  }

  async send({ phone, message }) {
    if (!this.accountSid || !this.authToken) {
      logger.warn(
        '[WhatsAppAdapter] Twilio credentials not configured, skipping send.'
      );
      return { success: false, error: 'Not configured' };
    }

    logger.info(`[WhatsAppAdapter] Sending WhatsApp to ${phone}: ${message}`);

    // In production, you would call Twilio API:
    // const client = twilio(this.accountSid, this.authToken);
    // await client.messages.create({ from: this.from, body: message, to: `whatsapp:${phone}` });

    return { success: true };
  }
}

export default new WhatsAppAdapter();
