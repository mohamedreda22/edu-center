import { z } from 'zod';

export const generatePayrollSchema = z.object({
  teacherId: z.string({ required_error: 'المعلم مطلوب' }),
  month: z.number({ required_error: 'الشهر مطلوب' }).min(1).max(12),
  year: z.number({ required_error: 'السنة مطلوبة' }).min(2020),
});
