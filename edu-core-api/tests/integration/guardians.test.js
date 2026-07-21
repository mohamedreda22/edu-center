process.env.NODE_ENV = 'test';

import mongoose from 'mongoose';
import request from 'supertest';

import { connectDB, closeDB, clearDB } from './setup.js';
import app from '../../src/app.js';
import User from '../../src/modules/users/user.model.js';
import Student from '../../src/modules/students/student.model.js';
import Guardian from '../../src/modules/guardians/guardian.model.js';

beforeAll(async () => await connectDB(), 20000);
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe('Guardian Domain & Automated Synchronization Integration', () => {
  let adminToken;
  let adminUser;

  beforeEach(async () => {
    // Create an admin user and log in to get bearer token
    adminUser = await User.create({
      email: 'admin@example.com',
      passwordHash: 'password123',
      firstName: 'System',
      lastName: 'Admin',
      phone: '87654321',
      role: 'ADMIN',
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });

    adminToken = loginRes.body.data.accessToken;
  });

  test('should automatically create and link a Guardian record when a Student is created', async () => {
    // Create first student
    const studentRes = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        parentName: 'عبدالرحمن العتيبي',
        parentPhone: '96590001122',
        whatsapp: '96590001122',
        address: 'الكويت، الجابرية',
        grade: 'متوسط',
        status: 'ACTIVE',
      });

    expect(studentRes.status).toBe(201);
    expect(studentRes.body.success).toBe(true);

    const studentId = studentRes.body.data._id;

    // Retrieve Guardians list
    const guardiansRes = await request(app)
      .get('/api/v1/guardians')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(guardiansRes.status).toBe(200);
    expect(guardiansRes.body.success).toBe(true);
    expect(guardiansRes.body.data.length).toBe(1);

    const guardian = guardiansRes.body.data[0];
    expect(guardian.phone).toBe('96590001122');
    expect(guardian.firstName).toBe('عبدالرحمن');
    expect(guardian.lastName).toBe('العتيبي');
    expect(guardian.students.map(s => s._id.toString())).toContain(studentId);
  });

  test('should link a second sibling student automatically to the same Guardian record', async () => {
    // 1. Create first student
    const firstRes = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        parentName: 'عبدالعزيز العتيبي',
        parentPhone: '96590003344',
        address: 'الكويت، سلوى',
        grade: 'متوسط',
        status: 'ACTIVE',
      });

    expect(firstRes.status).toBe(201);
    const firstId = firstRes.body.data._id;

    // 2. Create second student (Sibling) with same parentPhone
    const secondRes = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        parentName: 'فاطمة العتيبي',
        parentPhone: '96590003344',
        address: 'الكويت، سلوى',
        grade: 'ابتدائي',
        status: 'ACTIVE',
      });

    expect(secondRes.status).toBe(201);
    const secondId = secondRes.body.data._id;

    // 3. Verify there is still only exactly ONE Guardian record with both students linked!
    const guardiansRes = await request(app)
      .get('/api/v1/guardians')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(guardiansRes.body.data.length).toBe(1);

    const guardian = guardiansRes.body.data[0];
    const linkedIds = guardian.students.map(s => s._id.toString());
    expect(linkedIds).toContain(firstId);
    expect(linkedIds).toContain(secondId);
  });
});
