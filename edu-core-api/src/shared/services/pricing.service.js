import mongoose from 'mongoose';
import Student from '../../modules/students/student.model.js';
import TenantSettings from '../../modules/tenants/tenantSettings.model.js';
import { SiblingDiscountResolver } from './pricing/discountStrategies.js';
import { toFils } from '../utils/money.js';
import { SettingsService } from '../../modules/tenants/SettingsService.js';

export const PricingService = {
  /**
   * Calculates student sibling discount percentage based on Resolved Strategy Pattern.
   *
   * @param {string} studentId - The target student ID.
   * @param {import('mongoose').ClientSession} [session] - Optional transactional session.
   * @returns {Promise<number>} Discount percentage (0 to 100).
   */
  getSiblingDiscountPercentage: async (studentId, session = null) => {
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return 0;
    }
    const student = await Student.findById(studentId).session(session);
    if (!student) {
      return 0;
    }

    let filter = { tenantId: student.tenantId, deletedAt: null };
    if (student.siblingGroup && student.siblingGroup.trim() !== '') {
      filter.siblingGroup = student.siblingGroup.trim();
    } else {
      filter.parentPhone = student.parentPhone;
    }

    // Sort chronologically by registration/creation date (oldest first)
    const siblings = await Student.find(filter).sort({ createdAt: 1 }).session(session);

    if (siblings.length <= 1) {
      return 0;
    }

    const siblingIndex = siblings.findIndex(
      (s) => s._id.toString() === studentId.toString()
    );

    if (siblingIndex === -1) {
      return 0;
    }

    // Fetch tenant settings to resolve discount strategy
    if (!student.tenantId) {
      return 0;
    }
    const settings = await TenantSettings.findOne({ tenantId: student.tenantId }).session(session);
    const strategy = SiblingDiscountResolver.resolveStrategy(settings);

    return strategy.calculateDiscount(siblingIndex, settings);
  },

  /**
   * Calculates the weekly hours based on from1/to1 and from2/to2 timings of a registration.
   */
  calculateWeeklyHours: (reg) => {
    if (!reg || !reg.from1 || !reg.to1) {
      return 0;
    }

    const parseTimeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const parts = timeStr.split(':');
      if (parts.length !== 2) return 0;
      return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    };

    const duration1 = Math.max(
      0,
      parseTimeToMinutes(reg.to1) - parseTimeToMinutes(reg.from1)
    );
    let duration2 = 0;
    if (reg.from2 && reg.to2) {
      duration2 = Math.max(
        0,
        parseTimeToMinutes(reg.to2) - parseTimeToMinutes(reg.from2)
      );
    }

    const totalMinutes = duration1 + duration2;
    return Math.round((totalMinutes / 60) * 10) / 10;
  },

  /**
   * Calculates student registration package totals
   */
  calculateRegistrationTotals: async (studentId, pricePerHour, purchasedHours, session = null) => {
    const priceInFils = toFils(pricePerHour);
    const discountPct = await PricingService.getSiblingDiscountPercentage(studentId, session);
    const baseTotal = priceInFils * purchasedHours;
    const discountAmount = Math.round(baseTotal * (discountPct / 100));
    const totalAmount = baseTotal - discountAmount;

    return {
      priceInFils,
      discountPct,
      discountAmount,
      totalAmount,
    };
  },

  /**
   * Calculates teacher due for a single student registration (Without dynamic imports / circular references)
   */
  calculateRegistrationTeacherDue: async (reg, studentGrade, tenantId, session = null) => {
    if (!reg) {
      return 0;
    }

    // Use frozen snapshot hourly rate or fallback to live settings stage rate
    const stageRateInFils =
      typeof reg.pricePerHour === 'number' && reg.pricePerHour > 0
        ? reg.pricePerHour
        : await SettingsService.getStageHourlyRate(tenantId, studentGrade);

    // Use frozen snapshot teacher percentage or fallback to live settings percentage
    const teacherPercentage =
      typeof reg.teacherPercentageSnapshot === 'number'
        ? reg.teacherPercentageSnapshot
        : await SettingsService.getTeacherPercentage(tenantId);

    const teacherPctDecimal = teacherPercentage / 100;

    // Direct consumed hours snapshot or aggregated sum (can be negative/positive)
    const baseDue = reg.consumedHours * stageRateInFils * teacherPctDecimal;
    return Math.round(baseDue);
  },
};

export default PricingService;
