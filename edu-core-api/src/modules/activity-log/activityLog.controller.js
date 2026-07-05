import * as auditLogger from '../../shared/services/auditLogger.service.js';
import ActivityLog from './activityLog.model.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

export const getActivityLogs = asyncHandler(async (req, res) => {
  const { userId, entityType, entityId, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (userId) filter.userId = userId;
  if (entityType) filter.entityType = entityType;
  if (entityId) filter.entityId = entityId;

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    ActivityLog.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: logs,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  });
});
