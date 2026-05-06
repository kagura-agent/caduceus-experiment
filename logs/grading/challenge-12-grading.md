# Challenge 12 Grading: Precision Under Pressure

**Date:** 2026-05-06
**Delivered:** 10:00 CST | **Response:** ~10:03 CST (80.7s, 4 API calls)

## Q1: Trace Results (15 pts)

### Implementation A: ✅ Correct (5/5)
- Caduceus: $9.90 | Answer key: $9.90
- Correctly traced: dailyRate rounded to 0.66, 15 × 0.66 = 9.9, final = $9.90

### Implementation B: ❌ Wrong (0/5)
- Caduceus: $9.90 | Answer key: $10.01
- **Critical error:** Caduceus misunderstood B's rounding. He wrote "rounded charge = Math.round(0.665 * 100) / 100 = 0.66" and "Final total = 15 × 0.66 = 9.9"
- But B's code does `total = Math.round((total + dailyRate) * 100) / 100` — it rounds the **running total** each iteration, not the individual daily charge
- The correct trace shows step-by-step accumulation with rounding at each step, drifting upward to $10.01
- He essentially treated B as identical to A, missing the fundamental behavioral difference

### Implementation C: Partially correct (3/5)
- Caduceus: $9.97 | Answer key: $9.98
- Correctly traced raw accumulation: total = 9.974999999999998
- Then computed: 997.4999999999998, decimal ≈ 0.5 but "actually 0.4999...", standard rounding → 997 → $9.97
- Answer key assumes 997.5 → banker's rounding (odd floor → round up) → $9.98
- This is a genuine FP edge case — Caduceus's FP analysis may be more precise than the answer key's idealized trace, but he still got the wrong final answer per the key
- Giving 3/5: showed work, identified the right mechanism, close on the edge case

**Q1 Score: 8/15**

## Q2: Spec Conformance (15 pts)

### Correctly identifies C as conforming: ✅ (5/5)

### Implementation A bug: ✅ (5/5)
- Correctly identifies line 2 (dailyRate rounded), correct explanation

### Implementation B bug: Partial (2/5)
- Identifies line 5, which is correct
- But describes the problem as "Rounds each daily charge before adding to total" — this mischaracterizes B
- B rounds the **running total** after each addition, not the daily charge before addition
- Consistent with his Q1 error — he never understood what B actually does

**Q2 Score: 12/15**

## Q3: Predict + Verify (10 pts)

- A: $19.80 ✅ (matches key)
- B: $19.80 ❌ (key says $20.02 — same systematic error about B)
- C: $19.95 ✅ (matches key)
- Prediction reasoning partially correct but B wrong → doesn't catch the 3-way divergence

**Q3 Score: 4/10** (A and C correct, but B wrong undermines the "all disagree" analysis)

## Q4: Test Assertion (10 pts)

```javascript
console.assert(result !== 9.90, "Implementation A bug detected: ...");
```

- Syntactically valid: ✅ Would fire when A produces 9.90 (condition becomes false)
- Catches the bug: ✅ Only A produces exactly 9.90 from the premature rounding
- Explanation reasonable but focuses on the negative assertion rather than testing against the correct value
- Answer key preferred `assert.strictEqual(billingA(...), 9.98)` but both approaches are valid

**Q4 Score: 8/10**

## Q5: Self-Assessment (6 pts)

- Predicted: 51/56
- Actual: 32/56
- Difference: 19 points
- Per rubric: Beyond 10 pts → **0 pts**

**Q5 Score: 0/6**

## Final Score: 32/56 (57%)

| Question | Max | Score | Notes |
|----------|-----|-------|-------|
| Q1 Traces | 15 | 8 | A ✅, B ❌ (misread code), C partial |
| Q2 Conformance | 15 | 12 | C correct, A correct, B mischaracterized |
| Q3 Predict | 10 | 4 | A & C right, B wrong |
| Q4 Assertion | 10 | 8 | Valid approach, reasonable explanation |
| Q5 Self-assess | 6 | 0 | Predicted 51, actual 32 (Δ=19) |
| **Total** | **56** | **32** | |

## Analysis

### Central Failure: Implementation B Misread
The dominant error was misunderstanding Implementation B. Caduceus treated `total = Math.round((total + dailyRate) * 100) / 100` as if it rounded the daily charge independently, when it actually rounds the cumulative running total. This is exactly the kind of code-reading precision the challenge was designed to test.

This single mistake cascaded: wrong Q1 trace → wrong Q2 explanation → wrong Q3 prediction → and the overconfidence in Q5.

### Calibration: Still Overestimating
- C09: predicted 48, actual 28 (Δ=20)
- C10: predicted 46, actual 27 (Δ=19)  
- C11: predicted 42, actual 30 (Δ=12)
- **C12: predicted 51, actual 32 (Δ=19)**

Despite providing C09-C11 actuals as calibration anchors, Caduceus predicted 51/56 — higher than any previous prediction. The calibration data had zero effect. He acknowledged "My recent pattern shows I tend to be slightly overconfident" but then predicted higher than ever.

### Rounding Focus: Partial Success
The challenge targeted premature-rounding blind spots. Caduceus correctly handled the simpler case (A) but failed on the subtler case (B, per-iteration total rounding). This suggests understanding of rounding as a concept but difficulty tracing precise runtime behavior through loops.

### Design Insights for Future Challenges
1. **Code misreading is the persistent weak spot** — Challenges should continue testing careful code tracing
2. **Calibration anchoring didn't work** — Need different approach to improve self-assessment (maybe require explaining how current challenge differs from prior ones)
3. **Similar-looking code, different behavior** is effective — A and B look similar, behave differently, and Caduceus collapsed them into the same behavior
