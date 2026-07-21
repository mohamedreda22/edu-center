import StudentRegistration from './registration.model.js';
import Student from './student.model.js';
import Payment from '../payments/payment.model.js';
import { SettingsService } from '../tenants/SettingsService.js';
import { PricingService } from '../../shared/services/pricing.service.js';
import HourLedgerService from './hourLedger.service.js';

export const StudentCalculationService = {
  /**
   * Calculates the weekly hours for a registration
   */
  calculateRegistrationWeeklyHours: PricingService.calculateWeeklyHours,

  /**
   * Calculates student sibling discount percentage
   */
  getSiblingDiscountPercentage: PricingService.getSiblingDiscountPercentage,

  /**
   * Calculates student registration package totals
   */
  calculateRegistrationTotals: PricingService.calculateRegistrationTotals,

  /**
   * Computes student aggregates chronologically with optional DB persistence (Pure Immutable Ledger-based)
   */
  recalculateStudentBalances: async (studentId, save = false) => {
    const student = await Student.findById(studentId);
    if (!student) {
      return null;
    }

    // 1. Fetch all student registrations
    const regs = await StudentRegistration.find({ studentId }).sort({
      registrationDate: 1,
    });

    // 2. If save is true, sync registrations from HourTransaction first to ensure exact integrity!
    if (save) {
      for (const reg of regs) {
        await HourLedgerService.updateRegistrationStatus(reg._id);
      }
      // Reload registrations to get updated stored values
      const updatedRegs = await StudentRegistration.find({ studentId }).sort({
        registrationDate: 1,
      });
      regs.length = 0;
      regs.push(...updatedRegs);
    }

    // 3. Compute totals directly from registration state (backed by HourTransactions)
    const totalPurchasedHours = regs.reduce(
      (sum, r) => sum + r.purchasedHours,
      0
    );
    const totalConsumedHours = regs.reduce(
      (sum, r) => sum + r.consumedHours,
      0
    );
    const remainingHours = totalPurchasedHours - totalConsumedHours;

    // Set primaryRow flag for UI presentation
    let idx = 0;
    for (const reg of regs) {
      reg.primaryRow = idx === 0;
      idx++;
      if (save) {
        await reg.save();
      }
    }

    // 4. Financial Outstanding Balance
    const totalRegistrationsAmount = regs.reduce(
      (sum, r) => sum + r.totalAmount,
      0
    );

    const totalPaidPayments = (
      await Payment.find({ studentId, status: 'PAID' })
    ).reduce((sum, p) => sum + p.amount, 0);

    const outstandingBalance = totalRegistrationsAmount - totalPaidPayments;

    // 5. Weekly Hours
    const activeRegs = regs.filter((r) => r.status === 'ACTIVE');
    const weeklyHours = activeRegs.reduce(
      (sum, r) => sum + PricingService.calculateWeeklyHours(r),
      0
    );

    // 6. Sum up teacher due of every registration
    let totalTeacherDue = 0;
    for (const r of regs) {
      const teacherDue = await PricingService.calculateRegistrationTeacherDue(
        r,
        student.grade,
        student.tenantId
      );
      totalTeacherDue += teacherDue;
    }

    // Payment Status:
    let paymentStatus = 'No Dues';
    if (totalRegistrationsAmount > 0) {
      if (outstandingBalance <= 0) {
        paymentStatus = 'Fully Paid';
      } else if (totalPaidPayments > 0) {
        paymentStatus = 'Partially Paid';
      } else {
        paymentStatus = 'Not Paid';
      }
    }

    // Balance Alert:
    const lowHoursThreshold = await SettingsService.getLowHoursThreshold(
      student.tenantId
    );
    let balanceAlert = 'OK';
    if (remainingHours < 0) {
      balanceAlert = 'Hours Exceeded';
    } else if (remainingHours <= lowHoursThreshold) {
      balanceAlert = 'Balance Running Low';
    }

    return {
      totalPurchasedHours,
      totalConsumedHours,
      remainingHours,
      totalRegistrationsAmount,
      totalPaidPayments,
      outstandingBalance,
      weeklyHours,
      paymentStatus,
      balanceAlert,
      teacherDue: totalTeacherDue,
    };
  },
};
