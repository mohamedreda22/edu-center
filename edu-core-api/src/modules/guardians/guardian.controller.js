import { GuardianService } from './guardian.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { logAuditTrail } from '../../shared/services/auditLogger.js';

/**
 * @desc    Create a new Guardian
 * @route   POST /api/v1/guardians
 * @access  Private (Admin, Receptionist)
 */
export const createGuardian = asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId || null;
  const guardian = await GuardianService.createGuardian(req.body, tenantId);

  // Log in Audit Trail
  await logAuditTrail(req, {
    action: 'GUARDIAN_CREATED',
    entityType: 'Guardian',
    entityId: guardian._id,
    afterState: guardian.toObject(),
    reason: `إنشاء ملف ولي أمر جديد: ${guardian.firstName} ${guardian.lastName}`,
  });

  res.status(201).json({
    success: true,
    data: guardian,
  });
});

/**
 * @desc    Get all Guardians
 * @route   GET /api/v1/guardians
 * @access  Private (Admin, Accountant, Receptionist)
 */
export const getGuardians = asyncHandler(async (req, res) => {
  const guardians = await GuardianService.getGuardians();
  res.status(200).json({
    success: true,
    data: guardians,
  });
});

/**
 * @desc    Get Guardian by ID
 * @route   GET /api/v1/guardians/:id
 * @access  Private (Admin, Accountant, Receptionist)
 */
export const getGuardianById = asyncHandler(async (req, res) => {
  const guardian = await GuardianService.getGuardianById(req.params.id);
  res.status(200).json({
    success: true,
    data: guardian,
  });
});

/**
 * @desc    Update Guardian details
 * @route   PUT /api/v1/guardians/:id
 * @access  Private (Admin, Receptionist)
 */
export const updateGuardian = asyncHandler(async (req, res) => {
  const guardian = await GuardianService.updateGuardian(
    req.params.id,
    req.body
  );

  // Log in Audit Trail
  await logAuditTrail(req, {
    action: 'GUARDIAN_UPDATED',
    entityType: 'Guardian',
    entityId: guardian._id,
    afterState: guardian.toObject(),
    reason: `تعديل بيانات ولي الأمر: ${guardian.firstName} ${guardian.lastName}`,
  });

  res.status(200).json({
    success: true,
    data: guardian,
  });
});

/**
 * @desc    Delete Guardian
 * @route   DELETE /api/v1/guardians/:id
 * @access  Private (Admin)
 */
export const deleteGuardian = asyncHandler(async (req, res) => {
  const guardian = await GuardianService.deleteGuardian(req.params.id);

  // Log in Audit Trail
  await logAuditTrail(req, {
    action: 'GUARDIAN_DELETED',
    entityType: 'Guardian',
    entityId: guardian._id,
    reason: `حذف ملف ولي الأمر: ${guardian.firstName} ${guardian.lastName}`,
  });

  res.status(200).json({
    success: true,
    data: guardian,
  });
});

/**
 * @desc    Link Student to Guardian
 * @route   POST /api/v1/guardians/:id/students
 * @access  Private (Admin, Receptionist)
 */
export const linkStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const guardian = await GuardianService.linkStudentToGuardian(
    req.params.id,
    studentId
  );

  res.status(200).json({
    success: true,
    data: guardian,
  });
});
