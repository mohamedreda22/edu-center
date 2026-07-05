import { ValidationError } from '../errors/ValidationError.js';

/**
 * Validate request against Zod schema
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source - The property of req to validate (default: 'body')
 */
export const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const validatedData = await schema.parseAsync(req[source]);
      // Override with validated data to ensure type safety and remove unknown fields if configured in Zod
      req[source] = validatedData;
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
