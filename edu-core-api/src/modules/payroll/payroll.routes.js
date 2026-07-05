import express from 'express';
import * as payrollController from './payroll.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { UserRole } from '../../shared/constants/enums.js';

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.ACCOUNTANT),
  payrollController.getAllPayroll
);

router.post(
  '/generate',
  authorize(UserRole.ADMIN, UserRole.ACCOUNTANT),
  payrollController.generatePayroll
);

router.patch(
  '/:id/paid',
  authorize(UserRole.ADMIN, UserRole.ACCOUNTANT),
  payrollController.markPaid
);

export default router;
