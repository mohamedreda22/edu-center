import { z } from 'zod';

export const reportQuerySchema = z.object({
  month: z
    .preprocess((val) => parseInt(val), z.number().min(1).max(12))
    .optional(),
  year: z.preprocess((val) => parseInt(val), z.number().min(2020)).optional(),
  teacherId: z.string().optional(),
});
