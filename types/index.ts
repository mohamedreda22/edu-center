// Type definitions for the institute management system
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'ADMIN' | 'RECEPTIONIST' | 'TEACHER';
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string;
  userId: string;
  studentId: string;
  user?: User;
  dateOfBirth: Date;
  address: string;
  enrollmentDate: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'WITHDRAWN';
  gpa?: number;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  lessons?: Lesson[];
  payments?: Payment[];
}

export interface Teacher {
  id: string;
  userId: string;
  employeeId: string;
  user?: User;
  department: string;
  hireDate: Date;
  bio?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  studentId: string;
  teacherId: string;
  student?: Student;
  teacher?: Teacher;
  title: string;
  description: string;
  durationHours: number;
  lessonDate: Date;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  studentId: string;
  lessonId: string;
  student?: Student;
  lesson?: Lesson;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paymentMethod?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface Stats {
  totalStudents: number;
  activeStudents: number;
  newStudentsThisMonth: number;
  activeTeachers: number;
}
