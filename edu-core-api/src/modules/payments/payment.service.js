import Payment from './payment.model.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { notificationService } from '../../shared/services/notification.service.js';

export const createPayment = async (paymentData) => {
  const payment = await Payment.create(paymentData);

  // Hook point: Send notification to student's user if exists
  if (payment.studentId) {
    notificationService.notify({
      userId: payment.studentId,
      title: 'استلام دفعة',
      message: `تم تسجيل مبلغ ${payment.amount} KD بنجاح.`,
      type: 'PAYMENT_RECEIVED',
    });
  }

  return payment;
};

export const getAllPayments = async (query = {}) => {
  const { studentId, status, page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (studentId) filter.studentId = studentId;
  if (status) filter.status = status;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('studentId', 'parentName studentCode')
      .populate('lessonId', 'title lessonDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);

  return {
    payments,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPaymentById = async (id) => {
  const payment = await Payment.findById(id)
    .populate('studentId')
    .populate('lessonId');
  if (!payment) throw new NotFoundError('السجل المالي غير موجود');
  return payment;
};

export const updatePayment = async (id, updateData) => {
  const payment = await Payment.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!payment) throw new NotFoundError('السجل المالي غير موجود');
  return payment;
};

export const deletePayment = async (id) => {
  const payment = await Payment.findByIdAndDelete(id);
  if (!payment) throw new NotFoundError('السجل المالي غير موجود');
  return payment;
};
