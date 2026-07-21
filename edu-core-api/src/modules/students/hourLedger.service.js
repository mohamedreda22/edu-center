import mongoose from 'mongoose';
import HourTransaction from './hourTransaction.model.js';
import StudentRegistration from './registration.model.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';

export const HourLedgerService = {
  /**
   * Records a single hour transaction in the ledger under optional session.
   */
  recordHourEntry: async (data, session = null) => {
    const options = session ? { session } : {};

    const [entry] = await HourTransaction.create([data], options);

    // Dynamic reactive status synchronization
    await HourLedgerService.updateRegistrationStatus(
      data.registrationId,
      session
    );

    return entry;
  },

  /**
   * Recalculates total and consumed hours chronologically to set status.
   */
  updateRegistrationStatus: async (registrationId, session = null) => {
    const options = session ? { session } : {};

    const reg =
      await StudentRegistration.findById(registrationId).session(session);
    if (!reg) {
      throw new NotFoundError('عقد الاشتراك غير موجود');
    }

    // Aggregate total hours acquired (PURCHASE + BONUS + TRANSFER_IN + positive ADJUSTMENT)
    const acquiredResult = await HourTransaction.aggregate([
      {
        $match: {
          registrationId: new mongoose.Types.ObjectId(registrationId),
          type: { $in: ['PURCHASE', 'BONUS', 'TRANSFER_IN'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]).session(session);

    // Aggregate positive adjustments
    const positiveAdjustResult = await HourTransaction.aggregate([
      {
        $match: {
          registrationId: new mongoose.Types.ObjectId(registrationId),
          type: 'ADJUSTMENT',
          amount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]).session(session);

    // Aggregate consumed hours (CONSUMED + TRANSFER_OUT + REFUND + negative ADJUSTMENT)
    const consumedResult = await HourTransaction.aggregate([
      {
        $match: {
          registrationId: new mongoose.Types.ObjectId(registrationId),
          type: { $in: ['CONSUMED', 'TRANSFER_OUT', 'REFUND'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]).session(session);

    // Aggregate negative adjustments
    const negativeAdjustResult = await HourTransaction.aggregate([
      {
        $match: {
          registrationId: new mongoose.Types.ObjectId(registrationId),
          type: 'ADJUSTMENT',
          amount: { $lt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]).session(session);

    const baseAcquired = acquiredResult[0]?.total || 0;
    const positiveAdjust = positiveAdjustResult[0]?.total || 0;
    const totalPurchased = baseAcquired + positiveAdjust;

    const baseConsumed = consumedResult[0]?.total || 0;
    const negativeAdjust = negativeAdjustResult[0]?.total || 0;
    const totalConsumed = Math.abs(baseConsumed + negativeAdjust);

    const remaining = totalPurchased - totalConsumed;
    const status = remaining <= 0 ? 'COMPLETED' : 'ACTIVE';

    await StudentRegistration.updateOne(
      { _id: registrationId },
      {
        $set: {
          purchasedHours: totalPurchased,
          consumedHours: totalConsumed,
          status,
        },
      },
      options
    );
  },

  /**
   * Retrieves chronological hour transactions for a specific registration contract.
   */
  getRegistrationHistory: async (registrationId) => {
    return HourTransaction.find({ registrationId })
      .populate('performedBy', 'firstName lastName')
      .populate('lessonId', 'startTime lessonDate subject')
      .sort({ transactionDate: -1 });
  },

  /**
   * Retrieves chronological hour transactions for an entire student aggregate.
   */
  getStudentHistory: async (studentId) => {
    return HourTransaction.find({ studentId })
      .populate('performedBy', 'firstName lastName')
      .populate('registrationId', 'subject')
      .populate('lessonId', 'startTime lessonDate subject')
      .sort({ transactionDate: -1 });
  },
};
export default HourLedgerService;
