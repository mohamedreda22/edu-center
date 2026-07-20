import mongoose from 'mongoose';

import logger from './logger.js';

/**
 * Registry mapping parent models to their dependent child models,
 * specifying the exact foreign key field path on the child schema.
 */
const CASCADE_RELATIONS = {
  Student: [
    { modelName: 'StudentRegistration', foreignKey: 'studentId' },
    { modelName: 'Lesson', foreignKey: 'studentId' },
    { modelName: 'Payment', foreignKey: 'studentId' },
  ],
  Teacher: [
    { modelName: 'Lesson', foreignKey: 'teacherId' },
    { modelName: 'PayrollRecord', foreignKey: 'teacherId' },
  ],
};

export const CascadeDeleteService = {
  /**
   * Automatically propagates soft deletion parameters recursively to child records
   * @param {string} parentModelName - Name of the parent model (e.g. 'Student')
   * @param {ObjectId|string} parentId - Unique identifier of the deleted parent record
   * @param {Object} deleteMetadata - Deletion metadata fields
   * @param {Date} deleteMetadata.deletedAt - Soft deletion timestamp
   * @param {boolean} deleteMetadata.isDeleted - Logical deletion state
   * @param {ObjectId} [deleteMetadata.deletedBy] - User ID responsible for deletion
   * @param {ClientSession} [session] - Optional Mongoose session for atomic transactional cascade
   */
  cascadeSoftDelete: async (
    parentModelName,
    parentId,
    deleteMetadata,
    session = null
  ) => {
    const relations = CASCADE_RELATIONS[parentModelName];
    if (!relations || relations.length === 0) {
      return;
    }

    const { deletedAt, isDeleted, deletedBy } = deleteMetadata;
    const options = session ? { session } : {};

    logger.info(
      `[CascadeDeleteService] Initiating soft delete cascade for ${parentModelName}:${parentId}`
    );

    for (const rel of relations) {
      try {
        const ChildModel = mongoose.model(rel.modelName);
        if (!ChildModel) {
          logger.warn(
            `[CascadeDeleteService] Child model "${rel.modelName}" is not loaded or registered.`
          );
          continue;
        }

        // Apply soft deletion updates to all matching child records
        const result = await ChildModel.updateMany(
          { [rel.foreignKey]: parentId, deletedAt: null },
          {
            $set: {
              deletedAt: deletedAt || new Date(),
              isDeleted: isDeleted ?? true,
              deletedBy: deletedBy || null,
            },
          },
          { ...options, bypassTenant: true, withDeleted: true } // Bypass filters to capture child records
        );

        logger.info(
          `[CascadeDeleteService] Cascaded soft delete successfully to ${rel.modelName}. Modified ${result.modifiedCount} records.`
        );

        // Fetch modified child IDs to trigger recursive cascading (for multi-level child nesting)
        if (result.modifiedCount > 0 && CASCADE_RELATIONS[rel.modelName]) {
          const children = await ChildModel.find(
            { [rel.foreignKey]: parentId },
            { _id: 1 }
          ).session(session);

          for (const child of children) {
            await CascadeDeleteService.cascadeSoftDelete(
              rel.modelName,
              child._id,
              deleteMetadata,
              session
            );
          }
        }
      } catch (err) {
        logger.error(
          `[CascadeDeleteService] Failed to cascade soft delete from ${parentModelName} to ${rel.modelName}: ${err.message}`
        );
      }
    }
  },
};
export default CascadeDeleteService;
