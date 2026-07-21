/**
 * Enterprise Sibling Discount Strategy contract and implementations.
 * Designed to support Flat, Tiered, and custom extensible rule engines.
 */

export class SiblingDiscountStrategy {
  /**
   * Calculates the sibling discount percentage for a sibling at a specific index in the sibling list.
   * Sibling list is assumed to be ordered chronologically by registration/creation date (oldest first).
   *
   * @param {number} siblingIndex - The 0-based index of the sibling (0 is the first/oldest sibling).
   * @param {Object} tenantSettings - The Tenant Settings rules.
   * @returns {number} The discount percentage (0 to 100).
   */
  calculateDiscount(siblingIndex, tenantSettings) {
    throw new Error(
      'calculateDiscount must be implemented by strategy subclasses'
    );
  }
}

/**
 * Strategy: No sibling discount applied.
 */
export class NoDiscountStrategy extends SiblingDiscountStrategy {
  calculateDiscount(siblingIndex, tenantSettings) {
    return 0;
  }
}

/**
 * Strategy: Flat rate discount applied to second and subsequent siblings.
 */
export class FlatDiscountStrategy extends SiblingDiscountStrategy {
  calculateDiscount(siblingIndex, tenantSettings) {
    if (siblingIndex <= 0) {
      return 0;
    }
    const rules = tenantSettings?.financialRules || {};
    return typeof rules.siblingDiscountPercentage === 'number'
      ? rules.siblingDiscountPercentage
      : 10; // Default flat fallback 10%
  }
}

/**
 * Strategy: Tiered rate discount based on sibling count/rank.
 * Rank 1 (index 0): 0%
 * Rank 2 (index 1): 5%
 * Rank 3 (index 2): 10%
 * Rank 4+ (index 3+): 15%
 */
export class TieredDiscountStrategy extends SiblingDiscountStrategy {
  calculateDiscount(siblingIndex, tenantSettings) {
    if (siblingIndex <= 0) {
      return 0;
    }
    const rules = tenantSettings?.financialRules || {};
    const tiers = rules.siblingDiscountTiers || [0, 5, 10, 15]; // index-based percentages

    if (siblingIndex < tiers.length) {
      return tiers[siblingIndex];
    }
    return tiers[tiers.length - 1]; // Return max tier for subsequent siblings
  }
}

/**
 * Strategy Factory / Resolver to dynamically resolve strategy based on Tenant Settings.
 */
export const SiblingDiscountResolver = {
  /**
   * Resolves the correct strategy based on the tenant's configured siblingDiscountType.
   *
   * @param {Object} tenantSettings - The Tenant Settings document.
   * @returns {SiblingDiscountStrategy} The resolved discount strategy.
   */
  resolveStrategy(tenantSettings) {
    const rules = tenantSettings?.financialRules || {};
    const strategyType = rules.siblingDiscountType || 'FLAT'; // FLAT, TIERED, NONE

    switch (strategyType.toUpperCase()) {
      case 'TIERED':
        return new TieredDiscountStrategy();
      case 'NONE':
        return new NoDiscountStrategy();
      case 'FLAT':
      default:
        return new FlatDiscountStrategy();
    }
  },
};
