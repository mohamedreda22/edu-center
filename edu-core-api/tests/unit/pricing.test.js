import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { PricingService } from '../../src/shared/services/pricing.service.js';
import { SiblingDiscountResolver, FlatDiscountStrategy, TieredDiscountStrategy, NoDiscountStrategy } from '../../src/shared/services/pricing/discountStrategies.js';

describe('Enterprise Pricing & Sibling Discount Rule Engine', () => {
  describe('Strategy Pattern Class Structure', () => {
    test('NoDiscountStrategy should always return 0%', () => {
      const strategy = new NoDiscountStrategy();
      expect(strategy.calculateDiscount(0, {})).toBe(0);
      expect(strategy.calculateDiscount(1, {})).toBe(0);
      expect(strategy.calculateDiscount(5, {})).toBe(0);
    });

    test('FlatDiscountStrategy should return 0% for oldest sibling, and configured flat percent for others', () => {
      const strategy = new FlatDiscountStrategy();
      const settings = {
        financialRules: { siblingDiscountPercentage: 15 }
      };
      expect(strategy.calculateDiscount(0, settings)).toBe(0);
      expect(strategy.calculateDiscount(1, settings)).toBe(15);
      expect(strategy.calculateDiscount(2, settings)).toBe(15);

      // Fallback if settings are missing
      expect(strategy.calculateDiscount(1, {})).toBe(10);
    });

    test('TieredDiscountStrategy should return tiered rates based on sibling count', () => {
      const strategy = new TieredDiscountStrategy();
      const settings = {
        financialRules: { siblingDiscountTiers: [0, 5, 10, 15] }
      };
      expect(strategy.calculateDiscount(0, settings)).toBe(0);  // 1st sibling: 0%
      expect(strategy.calculateDiscount(1, settings)).toBe(5);  // 2nd sibling: 5%
      expect(strategy.calculateDiscount(2, settings)).toBe(10); // 3rd sibling: 10%
      expect(strategy.calculateDiscount(3, settings)).toBe(15); // 4th sibling: 15%
      expect(strategy.calculateDiscount(4, settings)).toBe(15); // 5th sibling: 15% (max tier)
    });

    test('SiblingDiscountResolver should resolve correct strategy based on settings', () => {
      expect(SiblingDiscountResolver.resolveStrategy({ financialRules: { siblingDiscountType: 'NONE' } })).toBeInstanceOf(NoDiscountStrategy);
      expect(SiblingDiscountResolver.resolveStrategy({ financialRules: { siblingDiscountType: 'TIERED' } })).toBeInstanceOf(TieredDiscountStrategy);
      expect(SiblingDiscountResolver.resolveStrategy({ financialRules: { siblingDiscountType: 'FLAT' } })).toBeInstanceOf(FlatDiscountStrategy);
      expect(SiblingDiscountResolver.resolveStrategy({})).toBeInstanceOf(FlatDiscountStrategy);
    });
  });

  describe('PricingService.calculateWeeklyHours', () => {
    test('should calculate weekly hours correctly', () => {
      const reg = {
        from1: '14:00',
        to1: '16:00', // 2 hours
        from2: '10:00',
        to2: '11:30'  // 1.5 hours
      };
      expect(PricingService.calculateWeeklyHours(reg)).toBe(3.5);
    });

    test('should handle missing inputs gracefully', () => {
      expect(PricingService.calculateWeeklyHours(null)).toBe(0);
      expect(PricingService.calculateWeeklyHours({ from1: '14:00' })).toBe(0);
    });
  });
});
