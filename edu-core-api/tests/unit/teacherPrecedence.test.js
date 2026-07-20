import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// Mock the dependencies
jest.unstable_mockModule('../../src/modules/teachers/teacher.model.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

jest.unstable_mockModule(
  '../../src/modules/tenants/SettingsService.js',
  () => ({
    SettingsService: {
      getStageHourlyRate: jest.fn(),
      getTeacherPercentage: jest.fn(),
      getTransportationDeductionRate: jest.fn(),
    },
  })
);

// Mock the transaction model to avoid DB requirements
jest.unstable_mockModule(
  '../../src/modules/ledger/transaction.model.js',
  () => ({
    default: {
      find: jest.fn(),
    },
  })
);

const { FinancialCalculationService } = await import(
  '../../src/modules/ledger/FinancialCalculationService.js'
);
const Teacher = (await import('../../src/modules/teachers/teacher.model.js'))
  .default;
const { SettingsService } = await import(
  '../../src/modules/tenants/SettingsService.js'
);

describe('Teacher Specific Precedence in Commission Calculations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should prioritize teacher-specific percentage over tenant defaults', async () => {
    const teacherId = new mongoose.Types.ObjectId();
    const teacherDoc = {
      _id: teacherId,
      tenantId: 'tenant1',
      teacherPercentage: 0.85, // 80% custom rate
      compensationType: 'PER_LESSON',
      usesInstituteCar: false,
    };

    Teacher.findById.mockResolvedValue(teacherDoc);
    SettingsService.getTeacherPercentage.mockResolvedValue(75); // General default (75%)

    const lesson = {
      teacherId,
      lessonPrice: 10000, // 10 KWD in fils
      status: 'SCHEDULED', // Verify non-completed calculates correctly too!
    };

    const earnings =
      await FinancialCalculationService.calculateLessonEarnings(lesson);

    // Earnings should use 85% instead of 75% default:
    // 10000 fils * 0.85 = 8500 fils teacher earnings
    expect(earnings.teacherEarnings).toBe(8500);
    expect(earnings.instituteRevenue).toBe(1500);

    // SettingsService percentage should NOT have been called as fallback!
    expect(SettingsService.getTeacherPercentage).not.toHaveBeenCalled();
  });

  test('should fallback to tenant default if teacher-specific percentage is missing', async () => {
    const teacherId = new mongoose.Types.ObjectId();
    const teacherDoc = {
      _id: teacherId,
      tenantId: 'tenant1',
      teacherPercentage: null, // missing custom rate
      compensationType: 'PER_LESSON',
      usesInstituteCar: false,
    };

    Teacher.findById.mockResolvedValue(teacherDoc);
    SettingsService.getTeacherPercentage.mockResolvedValue(70); // General default (70%)

    const lesson = {
      teacherId,
      lessonPrice: 10000, // 10 KWD in fils
      status: 'COMPLETED',
    };

    const earnings =
      await FinancialCalculationService.calculateLessonEarnings(lesson);

    // Earnings should fallback to 70%:
    // 10000 * 0.70 = 7000 fils
    expect(earnings.teacherEarnings).toBe(7000);
    expect(earnings.instituteRevenue).toBe(3000);

    // SettingsService percentage SHOULD have been called as fallback
    expect(SettingsService.getTeacherPercentage).toHaveBeenCalledWith('tenant1');
  });
});
