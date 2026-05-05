// billing-b.js — "Round Each Day" approach
function calculateBill(planPrice, daysInMonth, activeDays) {
  const dailyRate = planPrice / daysInMonth;
  let total = 0;
  for (const day of activeDays) {
    total = Math.round((total + dailyRate) * 100) / 100;
  }
  return total;
}

module.exports = { calculateBill };
