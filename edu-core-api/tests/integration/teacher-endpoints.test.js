process.env.NODE_ENV = 'test';

import mongoose from 'mongoose';
import request from 'supertest';

import { connectDB, closeDB, clearDB } from './setup.js';
import app from '../../src/app.js';
import Lesson from '../../src/modules/lessons/lesson.model.js';
import Student from '../../src/modules/students/student.model.js';
import Teacher from '../../src/modules/teachers/teacher.model.js';
import User from '../../src/modules/users/user.model.js';

beforeAll(async () => await connectDB(), 20000);
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe('Teacher Endpoints Integration', () => {
  test('should fetch teacher profile and teacher students successfully', async () => {
    // 1. Create a Teacher User
    const user = await User.create({
      email: 'ahmed.teacher@rakan.com',
      passwordHash: 'password123',
      firstName: 'أحمد',
      lastName: 'علي',
      phone: '90001111',
      role: 'TEACHER',
      isActive: true,
    });

    // 2. Create the corresponding Teacher document
    const teacher = await Teacher.create({
      userId: user._id,
      employeeCode: 'TCH001',
      subjects: ['رياضيات'],
      gradesTaught: ['ثانوي'],
      hourlyRate: 15000,
      isActive: true,
    });

    // 3. Create a Student
    const student = await Student.create({
      studentCode: 'STU001',
      parentName: 'محمد جاسم',
      parentPhone: '60001111',
      area: 'حولي',
      address: 'شارع تونس، ق 4',
      grade: 'ثانوي',
      subjects: ['رياضيات'],
      monthlyFee: 50000,
    });

    // 4. Create a Lesson linking them
    await Lesson.create({
      studentId: student._id,
      teacherId: teacher._id,
      title: 'درس رياضيات متقدم',
      dayOfWeek: 'Sunday',
      startTime: '16:00',
      endTime: '17:30',
      durationHours: 1.5,
      lessonDate: new Date(),
      lessonPrice: 15000,
      teacherEarnings: 10500,
      instituteRevenue: 4500,
    });

    // 5. Login as the Teacher
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ahmed.teacher@rakan.com', password: 'password123' });

    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.accessToken;
    expect(token).toBeDefined();

    // 6. Fetch Teacher Profile
    const profileRes = await request(app)
      .get('/api/v1/teachers/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.success).toBe(true);
    expect(profileRes.body.data.userId.firstName).toBe('أحمد');

    // 7. Fetch Teacher Students
    const studentsRes = await request(app)
      .get('/api/v1/students/my-students')
      .set('Authorization', `Bearer ${token}`);

    expect(studentsRes.status).toBe(200);
    expect(studentsRes.body.success).toBe(true);
    expect(studentsRes.body.data).toBeDefined();
    expect(studentsRes.body.data.length).toBe(1);
    expect(studentsRes.body.data[0].parentName).toBe('محمد جاسم');
  });

  test('should successfully create teacher with auto-user creation and empty userId', async () => {
    // 1. Create admin user to authenticate the creation request
    const admin = await User.create({
      email: 'admin.create@rakan.com',
      passwordHash: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      phone: '88888888',
      role: 'ADMIN',
      isActive: true,
      tokenVersion: 0,
    });

    // 2. Login as admin
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.create@rakan.com', password: 'password123' });

    const token = loginRes.body.data.accessToken;

    // 3. Post to create teacher with empty userId (which frontend FormDialog sends)
    const createRes = await request(app)
      .post('/api/v1/teachers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: '',
        firstName: 'نبيل',
        lastName: 'العوضي',
        email: 'nabil@rakan.com',
        phone: '94444444',
        gender: 'MALE',
        hourlyRate: '15.5', // test numeric coercion!
        department: 'التربية الإسلامية',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.employeeCode).toBeDefined();
    expect(createRes.body.data.hourlyRate).toBe(15500); // 15.5 * 1000 fils
  });

  test('should fail to create teacher with invalid data format (400 Bad Request)', async () => {
    const admin = await User.create({
      email: 'admin.fail@rakan.com',
      passwordHash: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      phone: '77777777',
      role: 'ADMIN',
      isActive: true,
      tokenVersion: 0,
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.fail@rakan.com', password: 'password123' });

    const token = loginRes.body.data.accessToken;

    const createRes = await request(app)
      .post('/api/v1/teachers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: '',
        firstName: 'فشل',
        lastName: 'التحقق',
        email: 'not-an-email', // invalid email
        phone: '1234',
      });

    expect(createRes.status).toBe(400);
    expect(createRes.body.success).toBe(false);
  });
});
