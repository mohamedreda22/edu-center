import mongoose from 'mongoose';

const guardianSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'الاسم الأول لولي الأمر مطلوب'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'الاسم الأخير لولي الأمر مطلوب'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'رقم الهاتف لولي الأمر مطلوب'],
      trim: true,
    },
    whatsapp: {
      type: String,
      trim: true,
    },
    civilId: {
      type: String,
      trim: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique phone per tenant (multiTenantPlugin injects tenantId)
guardianSchema.index({ phone: 1, tenantId: 1 }, { unique: true });

const Guardian = mongoose.model('Guardian', guardianSchema);

export default Guardian;
