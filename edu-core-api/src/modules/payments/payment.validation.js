import { z } from 'zod';

import { PaymentStatus } from '../../shared/constants/enums.js';

export const paymentSchema = z.object({
  studentId: z.string({ required_error: 'الطالب مطلوب' }),
  lessonId: z.string().optional(),
  amount: z.number().min(0, 'المبلغ يجب أن يكون 0 أو أكثر'),
  dueDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  paidDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  status: z.nativeEnum(PaymentStatus).optional(),
  paymentMethod: z.string().optional(),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePaymentSchema = paymentSchema.partial();
