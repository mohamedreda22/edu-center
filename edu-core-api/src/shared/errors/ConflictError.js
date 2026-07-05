import { AppError } from './AppError.js';

export class ConflictError extends AppError {
  constructor(message = 'هناك تعارض في البيانات') {
    super(message, 409);
    this.code = 'CONFLICT_ERROR';
  }
}
