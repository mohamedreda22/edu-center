import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'اسم الغرفة مطلوب'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'كود الغرفة مطلوب'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'السعة الاستيعابية مطلوبة'],
      min: [1, 'يجب أن تكون السعة الاستيعابية طالباً واحداً على الأقل'],
    },
    type: {
      type: String,
      required: [true, 'نوع الغرفة مطلوب'],
      enum: {
        values: ['LECTURE', 'LAB', 'TUTORIAL', 'OFFICE', 'OTHER'],
        message: 'نوع الغرفة غير صالح',
      },
      default: 'LECTURE',
    },
    equipment: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique room codes per tenant/branch (multiTenantPlugin injects tenantId index)
roomSchema.index({ code: 1, tenantId: 1 }, { unique: true });

const Room = mongoose.model('Room', roomSchema);

export default Room;
