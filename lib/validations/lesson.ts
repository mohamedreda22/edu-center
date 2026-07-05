import { z } from 'zod';
import { educationalLevels } from './student';

export const lessonSchema = z.object({
  teacherId: z.string().min(1, 'يرجى اختيار المعلم'),
  studentId: z.string().min(1, 'يرجى اختيار الطالب'),
  subject: z.string().min(1, 'يرجى إدخال المادة'),
  dayOfWeek: z.string().min(1, 'يرجى اختيار اليوم'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'صيغة الوقت HH:mm'),
  durationHours: z.coerce.number().min(0.5, 'المدة يجب أن تكون 0.5 ساعة على الأقل'),
  date: z.string().min(1, 'يرجى اختيار التاريخ'),
  notes: z.string().optional().or(z.literal('')),
  lessonPrice: z.coerce.number().min(0, 'سعر الحصة يجب أن يكون 0 أو أكثر').default(0),
  educationalLevel: z.enum(educationalLevels).optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional().default('SCHEDULED'),
});

export type LessonInput = z.infer<typeof lessonSchema>;
