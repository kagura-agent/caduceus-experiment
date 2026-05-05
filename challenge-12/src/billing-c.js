// billing-c.js — "Round Late" approach
function calculateBill(planPrice, daysInMonth, activeDays) {
  const dailyRate = planPrice / daysInMonth;
  let total = 0;
  for (const day of activeDays) {
    total += dailyRate;
  }
  // Banker's rounding (round half to even)
  const shifted = total * 100;
  const floor = Math.floor(shifted);
  const decimal = shifted - floor;
  if (decimal === 0.5) {
    return (floor % 2 === 0 ? floor : floor + 1) / 100;
  }
  return Math.round(shifted) / 100;
}

module.exports = { calculateBill };
