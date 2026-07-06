import express from 'express';

import * as salaryController from './salary.controller.js';
import { salarySchema, updateSalarySchema } from './salary.validation.js';
import { UserRole } from '../../shared/constants/enums.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { validate } from '../../shared/middlewares/validate.js';

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.ACCOUNTANT),
  validate(salarySchema),
  salaryController.createSalary
);

router.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.ACCOUNTANT),
  salaryController.getAllSalaries
);

router.get('/:id', salaryController.getSalary);

router.patch(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.ACCOUNTANT),
  validate(updateSalarySchema),
  salaryController.updateSalary
);

router.delete('/:id', authorize(UserRole.ADMIN), salaryController.deleteSalary);

export default router;
