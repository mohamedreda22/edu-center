import express from 'express';

import * as authController from './auth.controller.js';
import { loginSchema } from './auth.validation.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { validate } from '../../shared/middlewares/validate.js';

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected routes
router.use(authenticate);
router.post('/logout-all', authController.logoutAll);
router.get('/me', authController.me);
router.get('/sessions', authController.getSessions);
router.delete('/sessions/:sessionId', authController.revokeSession);

export default router;
