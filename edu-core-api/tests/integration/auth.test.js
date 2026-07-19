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

  test('should invalidate token on password change', async () => {
    // 1. Create a user
    const user = await User.create({
      email: 'pwd@example.com',
      passwordHash: 'password123',
      firstName: 'Pwd',
      lastName: 'User',
      phone: '87654321',
      role: 'ADMIN',
      tokenVersion: 0,
    });

    // 2. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pwd@example.com', password: 'password123' });

    const token = loginRes.body.data.accessToken;

    // 3. Verify access succeeds
    const meResBefore = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meResBefore.status).toBe(200);

    // 4. Change password using route
    const changePwdRes = await request(app)
      .post(`/api/v1/users/${user._id}/change-password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: 'password123', newPassword: 'newpassword123' });

    expect(changePwdRes.status).toBe(200);

    // 5. Verify old token is now rejected with 401
    const meResAfter = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meResAfter.status).toBe(401);
  });
});
