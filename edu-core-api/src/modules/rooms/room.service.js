import Room from './room.model.js';
import { AppError } from '../../shared/errors/AppError.js';
import logger from '../../shared/services/logger.js';

export const RoomService = {
  /**
   * Create a new classroom/room
   */
  createRoom: async (data, tenantId = null) => {
    // Check if code is already registered
    const exists = await Room.findOne({ code: data.code });
    if (exists) {
      throw new AppError('كود الغرفة المحجوز مسبقاً في هذا الفرع', 400);
    }
    return Room.create({ ...data, tenantId });
  },

  /**
   * Get all classrooms/rooms
   */
  getRooms: async (filter = {}) => {
    return Room.find(filter).sort({ name: 1 });
  },

  /**
   * Get room by ID
   */
  getRoomById: async (id) => {
    const room = await Room.findById(id);
    if (!room) {
      throw new AppError('الغرفة غير موجودة', 404);
    }
    return room;
  },

  /**
   * Update classroom/room details
   */
  updateRoom: async (id, data) => {
    const room = await Room.findById(id);
    if (!room) {
      throw new AppError('الغرفة غير موجودة', 404);
    }

    if (data.code && data.code !== room.code) {
      const exists = await Room.findOne({ code: data.code, _id: { $ne: id } });
      if (exists) {
        throw new AppError('كود الغرفة مسجل لغرفة أخرى بالفعل', 400);
      }
    }

    return Room.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  /**
   * Delete classroom/room (soft delete is handled by global plugin)
   */
  deleteRoom: async (id) => {
    const room = await Room.findById(id);
    if (!room) {
      throw new AppError('الغرفة غير موجودة', 404);
    }

    // Check if there are any upcoming scheduled lessons in this room
    const Lesson = (await import('../lessons/lesson.model.js')).default;
    const hasLessons = await Lesson.findOne({
      roomId: id,
      lessonDate: { $gte: new Date() },
      status: 'SCHEDULED',
    });

    if (hasLessons) {
      throw new AppError(
        'لا يمكن حذف الغرفة لوجود حصص دراسية مجدولة فيها مستقبلاً',
        400
      );
    }

    room.isDeleted = true;
    room.deletedAt = new Date();
    await room.save();
    return room;
  },

  /**
   * Dynamic Room Scheduling Conflict Detection with minute-level precision
   */
  checkRoomConflict: async ({
    roomId,
    lessonDate,
    startTime,
    endTime,
    excludeLessonId = null,
  }) => {
    if (!roomId) return null;

    const Lesson = (await import('../lessons/lesson.model.js')).default;

    // Use UTC midnight bounds just like lesson retrieval to ensure timezone-safe overlaps
    const startOfDay = new Date(lessonDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(lessonDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const query = {
      roomId,
      lessonDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['SCHEDULED', 'COMPLETED'] },
    };

    if (excludeLessonId) {
      query._id = { $ne: excludeLessonId };
    }

    const dayLessons = await Lesson.find(query);

    // Evaluate overlap: (start1 < end2) && (end1 > start2)
    for (const l of dayLessons) {
      const isOverlap = startTime < l.endTime && endTime > l.startTime;
      if (isOverlap) {
        logger.warn(
          `[RoomService] Scheduling conflict found in Room ${roomId} with Lesson ${l._id} (${l.startTime} - ${l.endTime})`
        );
        return l; // Return the conflicting lesson
      }
    }

    return null;
  },
};

export default RoomService;
