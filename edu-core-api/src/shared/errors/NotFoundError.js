import { AppError } from './AppError.js';

export class NotFoundError extends AppError {
  constructor(message = 'المورد غير موجود') {
    super(message, 404);
    this.code = 'NOT_FOUND_ERROR';
  }
}
