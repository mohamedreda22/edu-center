import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Models
import User from './src/modules/users/user.model.js';
import Teacher from './src/modules/teachers/teacher.model.js';
import Student from './src/modules/students/student.model.js';
import Lesson from './src/modules/lessons/lesson.model.js';
import Payment from './src/modules/payments/payment.model.js';
import { UserRole, Gender, EducationalLevels, StudentStatus, LessonStatus, PaymentStatus, CompensationType } from './src/shared/constants/enums.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is missing from .env');
  process.exit(1);
}

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    // Clear existing data (optional, but safer for a clean demo)
    console.log('🧹 Clearing old data...');
    await Promise.all([
      Teacher.deleteMany({}),
      Student.deleteMany({}),
      Lesson.deleteMany({}),
      Payment.deleteMany({}),
      User.deleteMany({ role: { $ne: UserRole.ADMIN } })
    ]);

    const salt = await bcrypt.genSalt(12);
    const commonPasswordHash = await bcrypt.hash('password123', salt);

    console.log('👤 Creating Teachers...');
    const teacherUsers = await User.insertMany([
      {
        email: 'ahmed.teacher@rakan.com',
        passwordHash: commonPasswordHash,
        firstName: 'أحمد',
        lastName: 'علي',
        phone: '90001111',
        role: UserRole.TEACHER,
        isActive: true
      },
      {
        email: 'sara.teacher@rakan.com',
        passwordHash: commonPasswordHash,
        firstName: 'سارة',
        lastName: 'محمود',
        phone: '90002222',
        role: UserRole.TEACHER,
        isActive: true
      }
    ]);

    const teachers = await Teacher.insertMany([
      {
        userId: teacherUsers[0]._id,
        employeeCode: 'TCH001',
        subjects: ['رياضيات', 'فيزياء'],
        gradesTaught: ['ثانوي', 'متوسط'],
        gender: Gender.MALE,
        hourlyRate: 15000, // 15 KWD in fils
        compensationType: CompensationType.PER_LESSON,
        isActive: true
      },
      {
        userId: teacherUsers[1]._id,
        employeeCode: 'TCH002',
        subjects: ['لغة عربية', 'تربية إسلامية'],
        gradesTaught: ['ابتدائي', 'متوسط'],
        gender: Gender.FEMALE,
        hourlyRate: 12000, // 12 KWD in fils
        compensationType: CompensationType.PER_LESSON,
        isActive: true
      }
    ]);

    console.log('🎓 Creating Students...');
    const students = await Student.insertMany([
      {
        studentCode: 'STU001',
        parentName: 'محمد جاسم',
        parentPhone: '60001111',
        area: 'حولي',
        address: 'شارع تونس، ق 4',
        grade: 'ثانوي',
        subjects: ['رياضيات'],
        status: StudentStatus.ACTIVE,
        monthlyFee: 50000 // 50 KWD
      },
      {
        studentCode: 'STU002',
        parentName: 'فاطمة العتيبي',
        parentPhone: '60002222',
        area: 'السالمية',
        address: 'شارع الخليج، ق 2',
        grade: 'متوسط',
        subjects: ['لغة عربية'],
        status: StudentStatus.ACTIVE,
        monthlyFee: 40000
      }
    ]);

    console.log('📅 Creating Lessons...');
    const lessons = await Lesson.insertMany([
      {
        studentId: students[0]._id,
        teacherId: teachers[0]._id,
        title: 'درس رياضيات متقدم',
        dayOfWeek: 'Sunday',
        startTime: '16:00',
        endTime: '17:30',
        durationHours: 1.5,
        lessonDate: new Date(),
        status: LessonStatus.SCHEDULED,
        lessonPrice: 15000,
        teacherEarnings: 10500, // 70%
        instituteRevenue: 4500 // 30%
      },
      {
        studentId: students[1]._id,
        teacherId: teachers[1]._id,
        title: 'تأسيس لغة عربية',
        dayOfWeek: 'Monday',
        startTime: '17:00',
        endTime: '18:00',
        durationHours: 1,
        lessonDate: new Date(),
        status: LessonStatus.SCHEDULED,
        lessonPrice: 12000,
        teacherEarnings: 8400,
        instituteRevenue: 3600
      }
    ]);

    console.log('💰 Creating Payments...');
    await Payment.insertMany([
      {
        studentId: students[0]._id,
        lessonId: lessons[0]._id,
        amount: 15000,
        dueDate: new Date(),
        status: PaymentStatus.PENDING
      },
      {
        studentId: students[1]._id,
        amount: 40000,
        dueDate: new Date(),
        status: PaymentStatus.PAID,
        paidDate: new Date(),
        paymentMethod: 'K-NET'
      }
    ]);

    console.log('\n✨ Seeding Complete! ✨');
    console.log('Created: 2 Teachers, 2 Students, 2 Lessons, 2 Payments.');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedData();
