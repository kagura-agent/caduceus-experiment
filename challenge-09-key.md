# Challenge 09 — Answer Key

## Summary: 4 CORRECT, 6 INCORRECT

## A1: CORRECT ✓
90,000ms = 60000 × 1.5. Straightforward multiplication, answer is right.

## A2: INCORRECT ✗ — Ignores overage multiplier
**Junior says:** 12,000 × $0.001 = $12.00 usage, total $21.99
**Actual:** In `calculateUsageCost()`, when `requestCount > tierConfig.maxRequests`:
- Within-tier: 10,000 × $0.001 = $10.00
- Overage: (12,000 - 10,000) × $0.001 × **2.5** (overageMultiplier) = 2,000 × $0.0025 = $5.00
- Usage cost: $15.00
- Total: $9.99 + $15.00 = **$24.99**
**Error type:** Missed the overage branch entirely — treated all requests at base rate.

## A3: INCORRECT ✗ — Off-by-one (wrong about execution order)
**Junior says:** N = 91 (check runs before increment)
**Actual:** In `tryRequest()`, the code order is:
1. `client.requestCount++` ← **increment FIRST**
2. `if (client.requestCount >= this.maxRequests * this.penaltyThreshold)` ← check AFTER
So on request #90: count goes 89→90, then 90 >= 90 → penalty. **N = 90**.
**Error type:** Misread code execution order — claimed check is before increment when it's after.

## A4: CORRECT ✓
15s × 2 tokens/s = 30, capped at bucket size 20. Math and logic both correct.

## A5: CORRECT ✓
50,000 ≤ 100,000 → no overage → 50,000 × $0.0005 = $25.00. Correct.

## A6: INCORRECT ✗ — Wrong price per request (decimal error)
**Junior says:** 200,000 × $0.002 = $400.00, total $544.49
**Actual:** Enterprise `pricePerRequest` is **$0.0002** (not $0.002 — off by 10×).
- Usage: 200,000 × $0.0002 = $40.00
- Subtotal: ($199.99 + $40.00 + $5.00) × 0.9 = $244.99 × 0.9 = **$220.49**
**Error type:** Decimal place error reading the tier config — $0.0002 misread as $0.002.

## A7: CORRECT ✓
1000 / 2 = 500ms. Correct formula and arithmetic.

## A8: INCORRECT ✗ — Misses discount
**Junior says:** 30% utilization → "no discount (below usage threshold)" → $22.99
**Actual:** `discountThreshold = 0.5` means discount applies when utilization **< 50%**. 30% < 50% AND tier is not 'free' → discount applies.
- Subtotal before discount: $22.99
- After 10% discount: $22.99 × 0.9 = **$20.69**
**Error type:** Inverted the discount condition — thought low utilization means no discount, when it's the opposite (low util = discount to retain customer).

## A9: INCORRECT ✗ — Premature rounding
**Junior says:** Daily rate $3.00 × 20 = $60.00 refund
**Actual:** In `calculateRefund()`:
- `dailyRate` (raw) = 89.99 / 30 = 2.99966666...
- `refund` = 2.99966666... × 20 = 59.99333... → `round2()` = **$59.99**
- The returned `dailyRate` is `round2(dailyRate)` = $3.00 (display only)
- But `refund = dailyRate * remainingDays` uses the **unrounded** dailyRate
- Actual refund: **$59.99** (not $60.00)
**Error type:** Used the rounded display value for subsequent calculation instead of the raw value. Classic premature rounding bug.

## A10: CORRECT ✓ (but reasoning has a minor issue)
Free tier at $0 is indeed cheapest. The per-tier calculations are all correct:
- Free: $0, Starter: $17.99, Pro: $48.59, Enterprise: $181.43
Note: The free tier doesn't actually apply discount (blocked by `tier.name !== 'free'`), but since the subtotal is $0 either way, this doesn't affect the answer.

## Error Type Distribution
1. **Overage calculation miss** (A2) — didn't follow the branching logic
2. **Code execution order** (A3) — misread when increment vs check happens
3. **Decimal place error** (A6) — misread a config value
4. **Inverted condition** (A8) — got the discount logic backwards
5. **Premature rounding** (A9) — used rounded intermediate for further calc
6. ~None missed~ — A10 has slightly wrong reasoning but correct answer

## Scoring Guide
- A1 CORRECT → +3
- A2 INCORRECT → +5 (must identify overage multiplier miss)
- A3 INCORRECT → +5 (must identify off-by-one and correct to 90)
- A4 CORRECT → +3
- A5 CORRECT → +3
- A6 INCORRECT → +5 (must identify $0.0002 not $0.002)
- A7 CORRECT → +3
- A8 INCORRECT → +5 (must identify discount applies)
- A9 INCORRECT → +5 (must identify premature rounding)
- A10 CORRECT → +3
- Calibration: +1 per correct confidence assessment
- **Maximum: 52 points** (12 + 30 + 10)
