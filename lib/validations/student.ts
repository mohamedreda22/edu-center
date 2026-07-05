import { z } from 'zod';

export const educationalLevels = ['تأسيس', 'ابتدائي', 'ثانوي', 'جامعات ومعاهد', 'أجنبي', 'احتياجات'] as const;

export const studentSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين'),
  phone: z.string().regex(/^\d{10,15}$/, 'رقم الهاتف يجب أن يكون 10-15 رقم'),
  parentName: z.string().optional().or(z.literal('')),
  parentPhone: z.string().regex(/^\d{10,15}$/).optional().or(z.literal('')),
  whatsapp: z.string().regex(/^\d{10,15}$/).optional().or(z.literal('')),
  area: z.string().optional().or(z.literal('')),
  address: z.string().min(3, 'العنوان يجب أن يكون على الأقل 3 أحرف'),
  googleMapsUrl: z.string().optional().or(z.literal('')),
  school: z.string().optional().or(z.literal('')),
  grade: z.enum(educationalLevels, { message: 'يرجى اختيار المرحلة الدراسية' }),
  subjects: z.string().min(1, 'يرجى إدخال المواد الدراسية'),
  preferredTeacherGender: z.enum(['MALE', 'FEMALE']).optional(),
  preferredSchedule: z.string().optional().or(z.literal('')),
  monthlyFee: z.coerce.number().min(0, 'الرسوم يجب أن تكون 0 أو أكثر').optional().default(0),
  notes: z.string().optional().or(z.literal('')),
});

export type StudentInput = z.infer<typeof studentSchema>;
