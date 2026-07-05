import { z } from 'zod';

export const salarySchema = z.object({
  teacherId: z.string({ required_error: 'المعلم مطلوب' }),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  hoursWorked: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  bonuses: z.number().min(0).optional(),
  deductions: z.number().min(0).optional(),
  transportationAllowance: z.number().min(0).optional(),
  totalSalary: z.number().min(0),
  notes: z.string().optional(),
});

export const updateSalarySchema = salarySchema.partial();
