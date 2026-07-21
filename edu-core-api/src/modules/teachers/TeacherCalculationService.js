import { PricingService } from '../../shared/services/pricing.service.js';

export const TeacherCalculationService = {
  /**
   * Calculates teacher due for a single student registration
   */
  calculateRegistrationTeacherDue: PricingService.calculateRegistrationTeacherDue,
};
