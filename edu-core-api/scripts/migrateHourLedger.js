import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

async function runMigration() {
  console.log('\n🚀 Starting Hour Ledger Immutable Backfill Migration Script...\n');

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('❌ Error: MONGO_URI is missing in your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');

    // Inline schema registrations to ensure they compile in isolated script context
    const hourTransactionSchema = new mongoose.Schema(
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
        registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentRegistration', required: true },
        lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
        amount: { type: Number, required: true },
        type: { type: String, required: true },
        description: { type: String, trim: true },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        transactionDate: { type: Date, default: Date.now },
      },
      { timestamps: true }
    );

    const studentRegistrationSchema = new mongoose.Schema(
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
        registrationId: { type: String },
        subject: { type: String, required: true },
        purchasedHours: { type: Number, default: 0 },
        consumedHours: { type: Number, default: 0 },
        status: { type: String, default: 'ACTIVE' },
        registrationDate: { type: Date, default: Date.now },
      },
      { timestamps: true }
    );

    const HourTransaction = mongoose.models.HourTransaction || mongoose.model('HourTransaction', hourTransactionSchema);
    const StudentRegistration = mongoose.models.StudentRegistration || mongoose.model('StudentRegistration', studentRegistrationSchema);

    // Fetch all student registrations
    const regs = await StudentRegistration.find({});
    console.log(`Found ${regs.length} student registrations to inspect.`);

    let backfilledPurchasedCount = 0;
    let backfilledConsumedCount = 0;

    for (const reg of regs) {
      // 1. Backfill PURCHASE transaction if missing
      const purchaseTx = await HourTransaction.findOne({
        registrationId: reg._id,
        type: 'PURCHASE',
      });

      if (!purchaseTx && reg.purchasedHours > 0) {
        await HourTransaction.create({
          studentId: reg.studentId,
          registrationId: reg._id,
          amount: reg.purchasedHours,
          type: 'PURCHASE',
          description: 'رصيد ابتدائي مهاجر (Migrated Initial Purchased Hours)',
          performedBy: reg.studentId, // fallback to studentId
          transactionDate: reg.registrationDate || new Date(),
        });
        backfilledPurchasedCount++;
      }

      // 2. Backfill CONSUMED transaction if missing and consumedHours > 0
      const consumedTx = await HourTransaction.findOne({
        registrationId: reg._id,
        type: 'CONSUMED',
      });

      if (!consumedTx && reg.consumedHours > 0) {
        await HourTransaction.create({
          studentId: reg.studentId,
          registrationId: reg._id,
          amount: -reg.consumedHours,
          type: 'CONSUMED',
          description: 'ساعات مستهلكة مهاجرة (Migrated Initial Consumed Hours)',
          performedBy: reg.studentId, // fallback to studentId
          transactionDate: reg.registrationDate || new Date(),
        });
        backfilledConsumedCount++;
      }
    }

    console.log('\n=======================================');
    console.log('✨ Migration Backfill Summary:');
    console.log(`- Total Registrations Checked: ${regs.length}`);
    console.log(`- Backfilled Initial Purchase Transactions: ${backfilledPurchasedCount}`);
    console.log(`- Backfilled Initial Consumed Transactions: ${backfilledConsumedCount}`);
    console.log('=======================================\n');
    console.log('✅ Hour Ledger Backfill Migration finished successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed with error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

runMigration();
