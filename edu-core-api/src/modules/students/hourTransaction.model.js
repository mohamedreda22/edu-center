import mongoose from 'mongoose';

const hourTransactionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentRegistration',
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
      index: true,
    },
    amount: {
      type: Number, // Number of hours (positive for additions, negative for deductions)
      required: true,
    },
    type: {
      type: String,
      enum: [
        'PURCHASE', // Sourced from standard billing packages
        'BONUS', // Sourced from promotional/compensation gifts
        'TRANSFER_IN', // Sourced from transfers from other subjects/siblings
        'TRANSFER_OUT', // Sourced from transfers to other subjects/siblings
        'CONSUMED', // Deducted upon completion of scheduled lessons
        'REFUND', // Sourced from cancellations and package refunds
        'ADJUSTMENT', // Sourced from manual administrative corrections
      ],
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indices for reporting and aggregations
hourTransactionSchema.index({ studentId: 1, type: 1 });
hourTransactionSchema.index({ registrationId: 1, transactionDate: -1 });

const HourTransaction = mongoose.model(
  'HourTransaction',
  hourTransactionSchema
);

export default HourTransaction;
