import express from 'express';

import * as roomController from './room.controller.js';
import { createRoomSchema, updateRoomSchema } from './room.validation.js';
import { UserRole } from '../../shared/constants/enums.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { validate } from '../../shared/middlewares/validate.js';

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  authorize(UserRole.ADMIN),
  validate(createRoomSchema),
  roomController.createRoom
);

router.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.RECEPTIONIST, UserRole.TEACHER),
  roomController.getRooms
);

router.get(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.RECEPTIONIST, UserRole.TEACHER),
  roomController.getRoomById
);

router.put(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(updateRoomSchema),
  roomController.updateRoom
);

router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  roomController.deleteRoom
);

export default router;
