import FinancialLedger from './ledger.model.js';
import StudentRegistration from '../students/registration.model.js';

export const getPredictiveFinancials = async (tenantId, growthRate = 1.0) => {
  const queryContext = tenantId ? { tenantId } : {};

  // 1. Gather historical ledger statistics (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const historicalLedger = await FinancialLedger.aggregate([
    {
      $match: {
        ...queryContext,
        transactionDate: { $gte: ninetyDaysAgo }
      }
    },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const mapStats = {};
  historicalLedger.forEach(item => {
    mapStats[item._id] = item.totalAmount;
  });

  // Calculate monthly baselines
  const baseMonthlyRevenue = ((mapStats['PACKAGE_PURCHASE'] || 0) / 3) || 5000000; // default to 5000 KWD baseline (in fils)
  const baseMonthlyExpenses = (((mapStats['EXPENSE'] || 0) + (mapStats['TEACHER_PAYMENT'] || 0)) / 3) || 3000000; // default to 3000 KWD baseline

  // 2. Gather active registration growth (last 30 days velocity)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentRegistrationsCount = await StudentRegistration.countDocuments({
    ...queryContext,
    registrationDate: { $gte: thirtyDaysAgo }
  });

  const activeRegistrations = await StudentRegistration.find({
    ...queryContext,
    status: 'ACTIVE'
  });

  let averagePricePerHour = 10000; // default 10 KWD in fils
  if (activeRegistrations.length > 0) {
    const totalRates = activeRegistrations.reduce((s, r) => s + (r.pricePerHour || 10000), 0);
    averagePricePerHour = totalRates / activeRegistrations.length;
  }

  // 3. Compute 6-Month Predictive Forecasts (scenarios)
  const forecasts = [];
  const pad = (num) => String(num).padStart(2, '0');
  const now = new Date();

  // Baseline Monthly Increment based on recent student registration growth velocity
  const registrationValueFils = recentRegistrationsCount * 12 * averagePricePerHour; // assume 12 hours/month avg purchase

  for (let i = 1; i <= 6; i++) {
    const forecastMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthLabel = `${forecastMonth.getFullYear()}/${pad(forecastMonth.getMonth() + 1)}`;

    // Apply scenario multipliers to growth velocity increments
    const projectedRevenue = baseMonthlyRevenue + (registrationValueFils * i * growthRate);
    const projectedExpenses = baseMonthlyExpenses + (registrationValueFils * i * 0.6 * (2 - growthRate)); // expenses grow slightly slower
    const projectedProfit = projectedRevenue - projectedExpenses;

    forecasts.push({
      month: monthLabel,
      projectedRevenue: Math.round(projectedRevenue),
      projectedExpenses: Math.round(projectedExpenses),
      projectedProfit: Math.round(projectedProfit)
    });
  }

  return {
    success: true,
    growthRateApplied: growthRate,
    velocity: {
      recentRegistrationsCount,
      averagePricePerHour,
      baseMonthlyRevenue,
      baseMonthlyExpenses
    },
    forecasts
  };
};
