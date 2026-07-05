import express from 'express';
import * as reportsController from './reports.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { UserRole } from '../../shared/constants/enums.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.ACCOUNTANT));

router.get('/overview', reportsController.getOverview);
router.get('/by-teacher', reportsController.getByTeacherReport);
router.get('/by-subject', reportsController.getBySubjectReport);
router.get('/by-level', reportsController.getByLevelReport);
router.get('/export-csv', reportsController.exportCSV);
router.get('/export-pdf', reportsController.exportPDF);

export default router;
