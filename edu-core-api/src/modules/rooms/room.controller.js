import { RoomService } from './room.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { logAuditTrail } from '../../shared/services/auditLogger.js';

/**
 * @desc    Create a new Classroom/Room
 * @route   POST /api/v1/rooms
 * @access  Private (Admin)
 */
export const createRoom = asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId || null;
  const room = await RoomService.createRoom(req.body, tenantId);

  // Log in Audit Trail
  await logAuditTrail(req, {
    action: 'ROOM_CREATED',
    entityType: 'Room',
    entityId: room._id,
    afterState: room.toObject(),
    reason: `إنشاء قاعة دراسية جديدة: ${room.name}`,
  });

  res.status(201).json({
    success: true,
    data: room,
  });
});

/**
 * @desc    Get all Classrooms/Rooms (filtered automatically by tenant via plugin)
 * @route   GET /api/v1/rooms
 * @access  Private (Admin, Accountant, Receptionist, Teacher)
 */
export const getRooms = asyncHandler(async (req, res) => {
  const rooms = await RoomService.getRooms();
  res.status(200).json({
    success: true,
    data: rooms,
  });
});

/**
 * @desc    Get Classroom/Room by ID
 * @route   GET /api/v1/rooms/:id
 * @access  Private (Admin, Accountant, Receptionist, Teacher)
 */
export const getRoomById = asyncHandler(async (req, res) => {
  const room = await RoomService.getRoomById(req.params.id);
  res.status(200).json({
    success: true,
    data: room,
  });
});

/**
 * @desc    Update Classroom/Room details
 * @route   PUT /api/v1/rooms/:id
 * @access  Private (Admin)
 */
export const updateRoom = asyncHandler(async (req, res) => {
  const room = await RoomService.updateRoom(req.params.id, req.body);

  // Log in Audit Trail
  await logAuditTrail(req, {
    action: 'ROOM_UPDATED',
    entityType: 'Room',
    entityId: room._id,
    afterState: room.toObject(),
    reason: `تعديل بيانات القاعة الدراسية: ${room.name}`,
  });

  res.status(200).json({
    success: true,
    data: room,
  });
});

/**
 * @desc    Delete Classroom/Room
 * @route   DELETE /api/v1/rooms/:id
 * @access  Private (Admin)
 */
export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await RoomService.deleteRoom(req.params.id);

  // Log in Audit Trail
  await logAuditTrail(req, {
    action: 'ROOM_DELETED',
    entityType: 'Room',
    entityId: room._id,
    reason: `حذف القاعة الدراسية: ${room.name}`,
  });

  res.status(200).json({
    success: true,
    data: room,
  });
});
