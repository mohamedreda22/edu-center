import { z } from 'zod';

export const paymentSchema = z.object({
  studentId: z.string().min(1, 'يرجى اختيار الطالب'),
  amount: z.coerce.number().positive('المبلغ يجب أن يكون أكبر من 0'),
  dueDate: z.string().min(1, 'يرجى تحديد تاريخ الاستحقاق'),
  paidDate: z.string().optional().or(z.literal('')),
  status: z.enum(['PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE']).optional().default('PENDING'),
  paymentMethod: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
