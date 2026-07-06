import logger from './logger.js';
import ActivityLog from '../../modules/activity-log/activityLog.model.js';

export const logActivity = async ({
  userId,
  action,
  entityType,
  entityId,
  metadata,
  req,
}) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent'),
    });
  } catch (error) {
    logger.error('Failed to write activity log', error);
  }
};
