import { AppError } from './AppError.js';

export class AuthError extends AppError {
  constructor(
    message = 'غير مصرح لك بالدخول',
    statusCode = 401,
    code = 'AUTH_ERROR'
  ) {
    super(message, statusCode);
    this.code = code;
  }
}
