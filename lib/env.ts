import dotenv from 'dotenv';

dotenv.config();

export const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
export const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}
