import GeneralLedger from './generalLedger.model.js';
import Transaction from './transaction.model.js';
import StudentRegistration from '../students/registration.model.js';
import HourTransaction from '../students/hourTransaction.model.js';
import Student from '../students/student.model.js';

export const runReconciliationAudit = async (tenantId) => {
  const queryContext = tenantId ? { tenantId } : {};

  // 1. Double-Entry General Ledger Balance Integrity Check
  const doubleEntryAggregate = await GeneralLedger.aggregate([
    { $match: queryContext },
    {
      $group: {
        _id: null,
        totalDebits: { $sum: { $cond: [{ $eq: ['$direction', 'DEBIT'] }, '$amount', 0] } },
        totalCredits: { $sum: { $cond: [{ $eq: ['$direction', 'CREDIT'] }, '$amount', 0] } },
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = doubleEntryAggregate[0] || { totalDebits: 0, totalCredits: 0, count: 0 };
  const ledgerDiscrepancy = Math.abs(stats.totalDebits - stats.totalCredits);
  const ledgerIsBalanced = ledgerDiscrepancy === 0;

  // 2. Student Hour Consistency Auditing
  const registrationAggregate = await StudentRegistration.aggregate([
    { $match: { ...queryContext, status: 'ACTIVE' } },
    {
      $lookup: {
        from: 'hourtransactions',
        localField: '_id',
        foreignField: 'registrationId',
        as: 'hours'
      }
    },
    {
      $project: {
        _id: 1,
        studentId: 1,
        subject: 1,
        totalPurchasedHours: 1,
        totalConsumedHours: 1,
        remainingHours: 1,
        actualLedgerSum: { $sum: '$hours.amount' }
      }
    }
  ]);

  const hourAnomalies = [];
  for (const reg of registrationAggregate) {
    // In our transactional Hour Ledger, remainingHours must equal totalPurchasedHours + actualLedgerSum (since consumed is negative)
    // Let's assert if actualLedgerSum is consistent
    const expectedRemaining = reg.totalPurchasedHours + reg.actualLedgerSum;
    if (Math.abs(reg.remainingHours - expectedRemaining) > 0.01) {
      const student = await Student.findById(reg.studentId).select('studentName parentName');
      hourAnomalies.push({
        registrationId: reg._id,
        studentName: student?.studentName || student?.parentName || 'طالب غير معروف',
        subject: reg.subject,
        remainingHours: reg.remainingHours,
        expectedRemaining,
        discrepancy: Math.abs(reg.remainingHours - expectedRemaining)
      });
    }
  }

  // 3. Anomalous Transaction Detection
  // Find unusually high overrides, high cash entries, or payments over 1000 KWD (1,000,000 fils)
  const anomalies = [];
  const highValueTx = await Transaction.find({
    ...queryContext,
    amount: { $gt: 1000000 } // Over 1000 KWD
  }).populate('studentId').limit(10);

  highValueTx.forEach(tx => {
    anomalies.push({
      id: tx._id,
      type: 'HIGH_VALUE_TRANSACTION',
      severity: 'WARNING',
      message: `تم رصد عملية دفع بقيمة استثنائية (${tx.amount / 1000} د.ك) للطالب ${tx.studentId?.parentName || 'غير معروف'}`,
      date: tx.transactionDate
    });
  });

  // Find duplicate transaction custom invoice numbers
  const duplicateInvoices = await Transaction.aggregate([
    { $match: { ...queryContext, transactionId: { $ne: null } } },
    { $group: { _id: '$transactionId', count: { $sum: 1 }, docs: { $push: '$$ROOT' } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  duplicateInvoices.forEach(group => {
    anomalies.push({
      type: 'DUPLICATE_INVOICE_NUMBER',
      severity: 'CRITICAL',
      message: `رقم الفاتورة/المستند الحسابي (${group._id}) مكرر في أكثر من عملية دفع مالي`,
      count: group.count,
      date: group.docs[0]?.transactionDate
    });
  });

  return {
    success: true,
    timestamp: new Date(),
    summary: {
      ledgerIsBalanced,
      totalDebits: stats.totalDebits,
      totalCredits: stats.totalCredits,
      discrepancy: ledgerDiscrepancy,
      ledgerEntriesAudited: stats.count,
      totalHourRegistrationsAudited: registrationAggregate.length,
      hourDiscrepancyCount: hourAnomalies.length,
      totalAnomaliesFound: anomalies.length + hourAnomalies.length
    },
    hourAnomalies,
    anomalies
  };
};
