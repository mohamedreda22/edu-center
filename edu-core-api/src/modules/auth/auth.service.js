import { AuthError } from '../../shared/errors/AuthError.js';
import * as tokenService from '../../shared/services/tokenService.js';
import User from '../users/user.model.js';

/**
 * Login user
 * @param {string} email
 * @param {string} password
 * @param {string} ipAddress
 * @param {string} userAgent
 * @returns {Promise<object>} { user, accessToken, refreshToken }
 */
export const login = async (email, password, ipAddress, userAgent) => {
  const user = await User.findOne({ email }).select(
    '+passwordHash loginAttempts lockUntil isActive deletedAt'
  );

  if (!user) {
    throw new AuthError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
  }

  if (user.isLocked) {
    throw new AuthError(
      'تم قفل الحساب مؤقتاً بسبب محاولات دخول خاطئة، يرجى المحاولة لاحقاً',
      401
    );
  }

  if (!(await user.comparePassword(password))) {
    // Increment login attempts
    user.loginAttempts += 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 mins
    }
    await user.save();
    throw new AuthError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
  }

  if (user.isActive === false || user.deletedAt) {
    throw new AuthError('هذا الحساب غير نشط', 401);
  }

  // Reset attempts on success
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  const accessToken = tokenService.signAccessToken(user);
  const refreshToken = await tokenService.signRefreshToken(
    user._id,
    null,
    ipAddress,
    userAgent
  );

  // Remove password from output
  user.passwordHash = undefined;

  return { user, accessToken, refreshToken };
};

/**
 * Refresh tokens
 * @param {string} refreshToken
 * @param {string} ipAddress
 * @param {string} userAgent
 * @returns {Promise<object>}
 */
export const refresh = async (refreshToken, ipAddress, userAgent) => {
  return tokenService.rotateRefreshToken(refreshToken, ipAddress, userAgent);
};

/**
 * Logout user from current session
 * @param {string} refreshToken
 */
export const logout = async (refreshToken) => {
  if (refreshToken) {
    await tokenService.revokeRefreshToken(refreshToken);
  }
};

/**
 * Logout user from all sessions
 * @param {string} userId
 */
export const logoutAll = async (userId) => {
  await tokenService.revokeAllUserTokens(userId);
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
};

/**
 * Get user by ID
 * @param {string} userId
 * @returns {Promise<object>}
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AuthError('المستخدم غير موجود أو غير نشط', 401);
  }
  return user;
};
