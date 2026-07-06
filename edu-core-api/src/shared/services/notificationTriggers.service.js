import logger from './logger.js';
import { notificationService } from './notification.service.js';
import Lesson from '../../modules/lessons/lesson.model.js';
import Payment from '../../modules/payments/payment.model.js';

/**
 * Service to trigger various automated notifications
 */
export const triggerLessonReminders = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  const dayEnd = new Date(tomorrow);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const upcomingLessons = await Lesson.find({
    lessonDate: { $gte: tomorrow, $lte: dayEnd },
    status: 'SCHEDULED',
  }).populate('studentId teacherId');

  logger.info(`Triggering reminders for ${upcomingLessons.length} lessons`);

  for (const lesson of upcomingLessons) {
    // Notify Teacher
    if (lesson.teacherId && lesson.teacherId.userId) {
      await notificationService.notify({
        userId: lesson.teacherId.userId,
        title: 'تذكير بحصة غداً',
        message: `لديك حصة غداً: ${lesson.title} في تمام الساعة ${lesson.startTime}`,
        type: 'LESSON_REMINDER',
      });
    }

    // Notify Student (if they have a userId)
    if (lesson.studentId && lesson.studentId.userId) {
      await notificationService.notify({
        userId: lesson.studentId.userId,
        title: 'تذكير بحصة غداً',
        message: `لديك حصة غداً في تمام الساعة ${lesson.startTime}`,
        type: 'LESSON_REMINDER',
      });
    }
  }
};

export const triggerPaymentReminders = async () => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const overduePayments = await Payment.find({
    dueDate: { $lt: today },
    status: { $in: ['PENDING', 'PARTIALLY_PAID'] },
  }).populate('studentId');

  logger.info(
    `Triggering reminders for ${overduePayments.length} overdue payments`
  );

  for (const payment of overduePayments) {
    if (payment.studentId && payment.studentId.userId) {
      await notificationService.notify({
        userId: payment.studentId.userId,
        title: 'تنبيه دفع متأخر',
        message: `لديك دفعة متأخرة بمبلغ ${payment.amount} KD. يرجى السداد في أقرب وقت.`,
        type: 'PAYMENT_DUE',
      });
    }
  }
};
