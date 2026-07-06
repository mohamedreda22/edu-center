import { z } from 'zod';

import { UserRole } from '../../shared/constants/enums.js';

export const createUserSchema = z.object({
  email: z
    .string({ required_error: 'البريد الإلكتروني مطلوب' })
    .email('البريد الإلكتروني غير صالح'),
  password: z
    .string({ required_error: 'كلمة المرور مطلوبة' })
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  firstName: z.string({ required_error: 'الاسم الأول مطلوب' }).trim(),
  lastName: z.string({ required_error: 'الاسم الأخير مطلوب' }).trim(),
  phone: z.string({ required_error: 'رقم الهاتف مطلوب' }).trim(),
  role: z.nativeEnum(UserRole).default(UserRole.RECEPTIONIST),
});

export const updateUserSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح').optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string({ required_error: 'كلمة المرور القديمة مطلوبة' }),
  newPassword: z
    .string({ required_error: 'كلمة المرور الجديدة مطلوبة' })
    .min(6, 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'),
});
