import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string({ required_error: 'اسم القاعة مطلوب' }).min(1, 'اسم القاعة مطلوب'),
  code: z.string({ required_error: 'كود القاعة مطلوب' }).min(1, 'كود القاعة مطلوب'),
  capacity: z.number({ required_error: 'السعة الاستيعابية مطلوبة' }).positive('يجب أن تكون السعة أكبر من الصفر'),
  type: z.enum(['LECTURE', 'LAB', 'TUTORIAL', 'OFFICE', 'OTHER'], {
    required_error: 'نوع القاعة غير صالح',
  }),
  equipment: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
});

export const updateRoomSchema = createRoomSchema.partial();
