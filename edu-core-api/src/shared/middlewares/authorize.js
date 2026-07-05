import { ForbiddenError } from '../errors/ForbiddenError.js';

/**
 * Authorize roles
 * @param  {...string} roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('ليس لديك صلاحية للقيام بهذا الإجراء'));
      return;
    }
    next();
  };
};
