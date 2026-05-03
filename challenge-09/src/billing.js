// Billing system — calculates costs based on rate limiter usage
// Integrates with RateLimiter for usage tracking

class BillingCalculator {
  constructor(config = {}) {
    this.tiers = config.tiers || [
      { name: 'free',       maxRequests: 1000,   pricePerRequest: 0,       monthlyBase: 0 },
      { name: 'starter',    maxRequests: 10000,   pricePerRequest: 0.001,  monthlyBase: 9.99 },
      { name: 'pro',        maxRequests: 100000,  pricePerRequest: 0.0005, monthlyBase: 49.99 },
      { name: 'enterprise', maxRequests: Infinity, pricePerRequest: 0.0002, monthlyBase: 199.99 }
    ];
    this.overageMultiplier = config.overageMultiplier || 2.5;
    this.penaltyFee = config.penaltyFee || 5.00;
    this.discountThreshold = config.discountThreshold || 0.5; // 50% utilization for discount
    this.discountRate = config.discountRate || 0.1; // 10% discount
    this.billingCycleMs = config.billingCycleMs || 30 * 24 * 60 * 60 * 1000; // 30 days
  }

  getTier(tierName) {
    return this.tiers.find(t => t.name === tierName) || this.tiers[0];
  }

  calculateUsageCost(tier, requestCount) {
    const tierConfig = typeof tier === 'string' ? this.getTier(tier) : tier;
    
    if (requestCount <= tierConfig.maxRequests) {
      return requestCount * tierConfig.pricePerRequest;
    }

    // Within-tier cost + overage
    const withinTier = tierConfig.maxRequests * tierConfig.pricePerRequest;
    const overageCount = requestCount - tierConfig.maxRequests;
    const overageCost = overageCount * tierConfig.pricePerRequest * this.overageMultiplier;
    
    return withinTier + overageCost;
  }

  calculateMonthlyBill(tierName, requestCount, penaltyCount = 0) {
    const tier = this.getTier(tierName);
    
    const baseCost = tier.monthlyBase;
    const usageCost = this.calculateUsageCost(tier, requestCount);
    const penalties = penaltyCount * this.penaltyFee;
    
    let subtotal = baseCost + usageCost + penalties;
    
    // Apply discount if utilization is below threshold
    const utilization = requestCount / tier.maxRequests;
    if (utilization < this.discountThreshold && tier.name !== 'free') {
      subtotal = subtotal * (1 - this.discountRate);
    }
    
    return {
      tier: tier.name,
      baseCost: round2(baseCost),
      usageCost: round2(usageCost),
      penalties: round2(penalties),
      discount: utilization < this.discountThreshold && tier.name !== 'free' ? this.discountRate : 0,
      subtotal: round2(subtotal),
      utilization: round2(utilization * 100)
    };
  }

  projectMonthlyCost(tierName, dailyAvgRequests, dailyAvgPenalties = 0) {
    const monthlyRequests = dailyAvgRequests * 30;
    const monthlyPenalties = dailyAvgPenalties * 30;
    return this.calculateMonthlyBill(tierName, monthlyRequests, monthlyPenalties);
  }

  recommendTier(monthlyRequests) {
    // Find cheapest tier for given usage
    let bestTier = null;
    let bestCost = Infinity;

    for (const tier of this.tiers) {
      const bill = this.calculateMonthlyBill(tier.name, monthlyRequests);
      if (bill.subtotal < bestCost) {
        bestCost = bill.subtotal;
        bestTier = tier.name;
      }
    }

    return { tier: bestTier, estimatedCost: round2(bestCost) };
  }

  calculateRefund(tierName, requestCount, daysUsed, totalDays = 30) {
    const bill = this.calculateMonthlyBill(tierName, requestCount);
    const dailyRate = bill.subtotal / totalDays;
    const remainingDays = totalDays - daysUsed;
    const refund = dailyRate * remainingDays;
    
    // Minimum refund is 0, maximum is 80% of subtotal
    return {
      fullBill: bill.subtotal,
      dailyRate: round2(dailyRate),
      remainingDays,
      rawRefund: round2(refund),
      actualRefund: round2(Math.min(refund, bill.subtotal * 0.8))
    };
  }
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { BillingCalculator };
