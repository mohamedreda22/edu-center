import express from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { UserRole } from '../../shared/constants/enums.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize(UserRole.ADMIN), userController.getAllUsers);
router.patch('/:id', userController.updateUser);
router.post('/:id/change-password', userController.changePassword);

export default router;
