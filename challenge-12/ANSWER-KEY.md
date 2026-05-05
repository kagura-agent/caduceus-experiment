# Challenge 12: Answer Key

## Q1: Trace Results (15 pts)

**Test case:** planPrice = $19.95, daysInMonth = 30, activeDays = [1..15]

Raw daily rate: 19.95 / 30 = 0.6649999999999999 (IEEE 754)

### Implementation A: $9.90
- `dailyRate = Math.round(0.665 * 100) / 100 = 0.66` (rounds DOWN — 0.665 * 100 = 66.49999... rounds to 66)
- Loops 15×: total = 0.66 * 15 = 9.9
- Final round: Math.round(9.9 * 100) / 100 = 9.90
- **Bug: Rounds dailyRate at line 3, losing precision before accumulation**

### Implementation B: $10.01
- `dailyRate = 0.6649999999999999` (raw, correct so far)
- Step-by-step accumulation with rounding each iteration:
  1. 0 + 0.665 = 0.665 → 0.66
  2. 0.66 + 0.665 = 1.325 → 1.33
  3. 1.33 + 0.665 = 1.995 → 2.00
  4. 2.00 + 0.665 = 2.665 → 2.67
  5. 2.67 + 0.665 = 3.335 → 3.34
  6. 3.34 + 0.665 = 4.005 → 4.01
  7. 4.01 + 0.665 = 4.675 → 4.68
  8. 4.68 + 0.665 = 5.345 → 5.35
  9. 5.35 + 0.665 = 6.015 → 6.02
  10. 6.02 + 0.665 = 6.685 → 6.69
  11. 6.69 + 0.665 = 7.355 → 7.36
  12. 7.36 + 0.665 = 8.025 → 8.03
  13. 8.03 + 0.665 = 8.695 → 8.69
  14. 8.69 + 0.665 = 9.355 → 9.35 (note: actually 9.354999... due to FP)
  15. 9.35 + 0.665 = 10.015 → 10.01 (actually 10.014999...)
- **Bug: Rounds running total every iteration (line 5), accumulating rounding errors upward**

### Implementation C: $9.98
- `dailyRate = 0.6649999999999999` (raw)
- Loops 15×: total = 0.665 * 15 = 9.975 (exact accumulation)
- Banker's rounding: 9.975 * 100 = 997.5 → floor=997, decimal=0.5 → floor is odd → round up → 998 / 100 = **9.98**
- **Matches spec: no intermediate rounding, banker's rounding at end**

### Scoring
- 5 pts per correct implementation trace (final value + key intermediate values shown to 6+ dp)
- -2 pts per rounded intermediate where code doesn't round

## Q2: Spec Conformance (15 pts)

**Only C matches the spec.**

- **A violates spec at line 3:** `Math.round(planPrice / daysInMonth * 100) / 100` — rounds the daily rate to 2 dp before accumulation. Spec says "stored as raw float."
- **B violates spec at line 5:** `total = Math.round((total + dailyRate) * 100) / 100` — rounds the running total after each addition. Spec says "intermediate values MUST remain unrounded until the final total."
- **C conforms:** raw accumulation, banker's rounding only at the end.

### Scoring
- 5 pts: correctly identifies C as the only conforming implementation
- 5 pts each: correctly identifies the exact buggy line in A and B with explanation

## Q3: Predict + Verify (10 pts)

**Test case:** planPrice = $19.95, daysInMonth = 30, activeDays = [1..30]

**Prediction reasoning:** When activeDays covers all days, the "correct" answer should be $19.95 (the full monthly price). C should get this exactly. A rounds dailyRate=0.66, so 30 * 0.66 = 19.80 (disagrees). B's cumulative rounding will overshoot.

**Verification:**
- A: 0.66 * 30 = 19.80
- B: 20.02 (accumulated rounding bias)
- C: 0.665 * 30 = 19.95 (exact)

**All three disagree.** A undercharges ($19.80), B overcharges ($20.02), C is exact ($19.95).

### Scoring
- 5 pts: correct prediction with reasoning
- 5 pts: correct verification values

## Q4: Test Assertion (10 pts)

**Target: catch A's bug (A produces 9.90, correct is 9.98)**

Good assertion:
```javascript
assert.strictEqual(billingA.calculateBill(19.95, 30, Array.from({length: 15}, (_, i) => i + 1)), 9.98);
```

**Why it works:** A rounds the daily rate to 0.66 before accumulating, producing 9.90 instead of 9.98. Any test case where rounding the daily rate produces a different 2dp value than the raw rate will catch this.

Alternative (also acceptable):
```javascript
assert.notStrictEqual(billingA.calculateBill(19.95, 30, Array.from({length: 30}, (_, i) => i + 1)), 19.95);
```

### Scoring
- 5 pts: assertion is syntactically valid and would fail for A
- 5 pts: explanation of why it catches the bug

## Q5: Self-Assessment (6 pts)

Based on C09-C11 pattern: Caduceus overestimates by ~17-18 points on 52-56 point scales.

Likely actual: ~35-45/56 depending on precision of traces.

### Scoring
- Within 5 pts of actual: 6 pts
- Within 10 pts: 3 pts
- Beyond 10 pts: 0 pts
