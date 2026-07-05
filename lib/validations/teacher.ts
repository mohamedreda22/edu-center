import { z } from 'zod';

export const teacherSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين'),
  phone: z.string().regex(/^\d{10,15}$/, 'رقم الجوال يجب أن يكون 10-15 رقم'),
  whatsapp: z.string().regex(/^\d{10,15}$/, 'رقم واتساب يجب أن يكون 10-15 رقم').optional().or(z.literal('')),
  civilId: z.string().optional().or(z.literal('')),
  subjects: z.string().min(1, 'يرجى إدخال المواد'),
  gradesTaught: z.string().min(1, 'يرجى إدخال الصفوف'),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  nationality: z.string().optional().or(z.literal('')),
  experience: z.coerce.number().min(0).default(0),
  address: z.string().optional().or(z.literal('')),
  googleMapsUrl: z.string().optional().or(z.literal('')),
  availableDays: z.string().optional().or(z.literal('')),
  availableHours: z.string().optional().or(z.literal('')),
  ownsCar: z.boolean().optional().default(false),
  transportationAvailable: z.boolean().optional().default(false),
  hourlyRate: z.coerce.number().min(0).default(0),
  rating: z.coerce.number().min(0).max(5).optional(),
  notes: z.string().optional().or(z.literal('')),
  commissionModel: z.enum(['SEVENTY_THIRTY', 'SIXTYFIVE_THIRTYFIVE']).optional().default('SEVENTY_THIRTY'),
  usesInstituteCar: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export type TeacherInput = z.infer<typeof teacherSchema>;
