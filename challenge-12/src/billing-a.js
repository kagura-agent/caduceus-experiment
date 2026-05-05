// billing-a.js — "Round Early" approach
function calculateBill(planPrice, daysInMonth, activeDays) {
  const dailyRate = Math.round(planPrice / daysInMonth * 100) / 100;
  let total = 0;
  for (const day of activeDays) {
    total += dailyRate;
  }
  return Math.round(total * 100) / 100;
}

module.exports = { calculateBill };
