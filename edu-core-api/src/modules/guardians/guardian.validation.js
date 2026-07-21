import { z } from 'zod';

export const createGuardianSchema = z.object({
  firstName: z.string({ required_error: 'الاسم الأول مطلوب' }).min(1, 'الاسم الأول مطلوب'),
  lastName: z.string({ required_error: 'الاسم الأخير مطلوب' }).min(1, 'الاسم الأخير مطلوب'),
  phone: z.string({ required_error: 'رقم هاتف ولي الأمر مطلوب' }).min(1, 'رقم هاتف ولي الأمر مطلوب'),
  email: z.string().email('صيغة البريد الإلكتروني غير صالحة').optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  civilId: z.string().optional(),
  students: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
});

export const updateGuardianSchema = createGuardianSchema.partial();
