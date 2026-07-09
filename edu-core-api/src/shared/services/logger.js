import winston from 'winston';

import { env } from '../../config/env.js';

const { combine, timestamp, errors, splat, json, colorize, printf } =
  winston.format;

// Custom format for console logging
const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (
      metadata &&
      Object.keys(metadata).length > 0 &&
      metadata.service !== 'edu-core-api'
    ) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    if (stack) {
      msg += `\n${stack}`;
    }
    return msg;
  })
);

// Custom format for file/production logging (JSON)
const productionFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  json()
);

const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  format: productionFormat,
  defaultMeta: { service: 'edu-core-api' },
  transports: [
    new winston.transports.Console({
      format: env.NODE_ENV === 'development' ? consoleFormat : productionFormat,
      stderrLevels: ['error'],
    }),
  ],
});

// File logging is disabled in production to optimize for Hostinger Runtime Logs
// and avoid potential disk space/permission issues.
if (env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  );
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

export default logger;
