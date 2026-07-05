import express from 'express';
import * as lessonController from './lesson.controller.js';
import * as attendanceController from './attendance.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { UserRole } from '../../shared/constants/enums.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize(UserRole.ADMIN, UserRole.RECEPTIONIST), lessonController.createLesson);
router.get('/', lessonController.getAllLessons);
router.patch('/:id/status', authorize(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TEACHER), lessonController.updateStatus);

// Attendance routes
router.get('/:lessonId/attendance', attendanceController.getLessonAttendance);
router.post('/:lessonId/attendance', authorize(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TEACHER), attendanceController.markAttendance);

export default router;
