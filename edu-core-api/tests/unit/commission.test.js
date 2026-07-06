import { calculateCommission } from '../../src/shared/services/commissionCalculator.js';
import { toFils } from '../../src/shared/utils/money.js';

describe('Commission Calculator (with fils)', () => {
  test('should calculate 70/30 split correctly', () => {
    const result = calculateCommission({
      lessonPrice: toFils(10),
      teacherPercentage: 0.7,
    });
    expect(result.teacherEarnings).toBe(7000);
    expect(result.instituteRevenue).toBe(3000);
  });

  test('should handle zero price', () => {
    const result = calculateCommission({
      lessonPrice: 0,
      teacherPercentage: 0.7,
    });
    expect(result.teacherEarnings).toBe(0);
    expect(result.instituteRevenue).toBe(0);
  });

  test('should round to nearest integer fil', () => {
    const result = calculateCommission({
      lessonPrice: toFils(10.1234), // 10123 fils
      teacherPercentage: 0.7,
    });
    // 10123 * 0.7 = 7086.1 => 7086
    expect(result.teacherEarnings).toBe(7086);
    expect(result.instituteRevenue).toBe(3037); // 10123 - 7086 = 3037
  });
});
