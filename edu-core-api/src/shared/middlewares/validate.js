import { ValidationError } from '../errors/ValidationError.js';

/**
 * Validate request body against Zod schema
 * @param {import('zod').ZodSchema} schema
 */
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      const details = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      next(new ValidationError('خطأ في البيانات المرسلة', details));
    }
  };
};
