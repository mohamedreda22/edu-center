import express from 'express';

import * as guardianController from './guardian.controller.js';
import { createGuardianSchema, updateGuardianSchema } from './guardian.validation.js';
import { UserRole } from '../../shared/constants/enums.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { validate } from '../../shared/middlewares/validate.js';

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.RECEPTIONIST),
  validate(createGuardianSchema),
  guardianController.createGuardian
);

router.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.RECEPTIONIST),
  guardianController.getGuardians
);

router.get(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.RECEPTIONIST),
  guardianController.getGuardianById
);

router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.RECEPTIONIST),
  validate(updateGuardianSchema),
  guardianController.updateGuardian
);

router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  guardianController.deleteGuardian
);

router.post(
  '/:id/students',
  authorize(UserRole.ADMIN, UserRole.RECEPTIONIST),
  guardianController.linkStudent
);

export default router;
