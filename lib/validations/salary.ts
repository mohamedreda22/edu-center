import { z } from 'zod';

export const salarySchema = z.object({
  teacherId: z.string().min(1, 'يرجى اختيار المعلم'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2030),
  lessonsCount: z.coerce.number().min(0).default(0),
  hoursWorked: z.coerce.number().min(0).default(0),
  hourlyRate: z.coerce.number().min(0).default(0),
  transportationAllowance: z.coerce.number().min(0).default(0),
  bonuses: z.coerce.number().min(0).default(0),
  deductions: z.coerce.number().min(0).default(0),
  notes: z.string().optional().or(z.literal('')),
});

export type SalaryInput = z.infer<typeof salarySchema>;
