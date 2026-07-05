import { AppError } from './AppError.js';

export class ForbiddenError extends AppError {
  constructor(message = 'ليس لديك صلاحية للقيام بهذا الإجراء') {
    super(message, 403);
    this.code = 'FORBIDDEN_ERROR';
  }
}
