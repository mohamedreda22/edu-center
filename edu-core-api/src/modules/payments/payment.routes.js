import express from 'express';
import * as paymentController from './payment.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { validate } from '../../shared/middlewares/validate.js';
import { paymentSchema, updatePaymentSchema } from './payment.validation.js';
import { UserRole } from '../../shared/constants/enums.js';

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.ACCOUNTANT),
  validate(paymentSchema),
  paymentController.createPayment
);

router.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.ACCOUNTANT),
  paymentController.getAllPayments
);

router.get('/:id', paymentController.getPayment);

router.patch(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.ACCOUNTANT),
  validate(updatePaymentSchema),
  paymentController.updatePayment
);

router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  paymentController.deletePayment
);

export default router;
