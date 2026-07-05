import { calculateCommission } from '../../src/shared/services/commissionCalculator.js';

describe('Commission Calculator', () => {
  test('should calculate 70/30 split correctly', () => {
    const result = calculateCommission({ lessonPrice: 10, teacherPercentage: 0.7 });
    expect(result.teacherEarnings).toBe(7);
    expect(result.instituteRevenue).toBe(3);
  });

  test('should handle zero price', () => {
    const result = calculateCommission({ lessonPrice: 0, teacherPercentage: 0.7 });
    expect(result.teacherEarnings).toBe(0);
    expect(result.instituteRevenue).toBe(0);
  });

  test('should round to 3 decimal places (fils)', () => {
    const result = calculateCommission({ lessonPrice: 10.1234, teacherPercentage: 0.7 });
    expect(result.teacherEarnings).toBe(7.086);
    expect(result.instituteRevenue).toBe(3.037);
  });
});
