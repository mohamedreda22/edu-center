import mongoose from 'mongoose';

/**
 * Utility to wrap operations in a MongoDB transaction.
 * Requires a replica set to be active.
 */
export const withTransaction = async (fn) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
