// Set up required env vars for tests
process.env.NODE_ENV = 'test';

import request from 'supertest';

import { connectDB, closeDB, clearDB } from './setup.js';
import app from '../../src/app.js';
import User from '../../src/modules/users/user.model.js';

beforeAll(async () => await connectDB(), 20000);
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe('Auth Integration', () => {
  test('should login and rotate tokens', async () => {
    // 1. Create a user
    await User.create({
      email: 'test@example.com',
      passwordHash: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '12345678',
      role: 'ADMIN',
    });

    // 2. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeDefined();
    const cookie = loginRes.headers['set-cookie'][0];

    // 3. Refresh
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [cookie]);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
  });
});
