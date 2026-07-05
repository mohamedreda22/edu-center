import { AppError } from './AppError.js';

export class ValidationError extends AppError {
  constructor(message = 'خطأ في التحقق من البيانات', details = []) {
    super(message, 400);
    this.code = 'VALIDATION_ERROR';
    this.details = details;
  }
}
