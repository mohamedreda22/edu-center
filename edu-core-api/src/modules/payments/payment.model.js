import mongoose from 'mongoose';
import { PaymentStatus } from '../../shared/constants/enums.js';

const paymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'يجب تحديد الطالب'],
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
    },
    amount: {
      type: Number,
      required: [true, 'المبلغ مطلوب'],
      min: [0, 'المبلغ لا يمكن أن يكون أقل من 0'],
    },
    dueDate: {
      type: Date,
    },
    paidDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentMethod: {
      type: String, // e.g., 'K-NET', 'CASH', 'TRANSFER'
    },
    transactionRef: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ studentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ dueDate: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
