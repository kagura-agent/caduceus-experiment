# Challenge 11 — Answer Key

## Q1: How many verdicts were correct?
**Answer: 8/10**

Wrong verdicts: V9 and V10.

## Q2: Wrong verdicts explained

### V9 is WRONG — A9 is actually INCORRECT (not correct as reviewer claimed)
- **Reviewer claimed:** $60.00 refund is correct
- **Actual answer:** $59.99
- **Why:** The code computes `refund = dailyRate * remainingDays` using the RAW dailyRate (89.99/30 = 2.99966̄), NOT the rounded display value. Raw refund = 2.99966̄ × 20 = 59.9933̄, round2 = $59.99. The junior (and the reviewer) used the rounded $3.00 daily rate for multiplication, producing $60.00. This is **premature rounding** — using a display-rounded intermediate for further calculation.

### V10 is WRONG — A10 is actually CORRECT (not incorrect as reviewer claimed)
- **Reviewer claimed:** Free tier can't handle 8,000 requests, overage makes it expensive
- **Actual answer:** Free tier IS cheapest at $0
- **Why:** The reviewer assumed overage = expensive, but didn't trace the actual code. In `calculateUsageCost`: `overageCost = overageCount × tierConfig.pricePerRequest × overageMultiplier` = 7000 × **$0** × 2.5 = **$0**. Free tier pricePerRequest is $0, so overage cost is also $0 regardless of count. The reviewer relied on intuition ("overage = expensive") instead of tracing the multiplication.

## Q3: Calibration score

| Verdict | Confidence | Correct? | Score |
|---------|-----------|----------|-------|
| V1 | High | ✅ | +2 |
| V2 | High | ✅ | +2 |
| V3 | High | ✅ | +2 |
| V4 | High | ✅ | +2 |
| V5 | High | ✅ | +2 |
| V6 | Medium | ✅ | +1 |
| V7 | High | ✅ | +2 |
| V8 | High | ✅ | +2 |
| V9 | High | ❌ | -3 |
| V10 | Medium | ❌ | -1 |

**Total calibration score: +11**

## Q4: Pattern analysis (model answer)
Two systematic weaknesses:
1. **Premature rounding:** Uses display-rounded intermediates for further calculations instead of tracing raw variable flow through the code. This is a substitution error — replacing a precise computation with an approximate "looks right" value.
2. **Intuition over code tracing:** For V10, the reviewer reasoned from common sense ("overage = expensive") rather than actually multiplying through the formula. When pricePerRequest = $0, any multiplier of $0 is still $0. The reviewer didn't trace the actual execution path.

Both weaknesses share a root cause: **stopping at "plausible" instead of "verified."** The reviewer gets the general direction right but doesn't complete the last step of checking the actual computed value against what they expect.

## Q5: Self-assessment
Correct prediction of own score (within 5 = +5, within 10 = +3, else 0).
Max possible = 10 + 16 + 10 + 15 + 5 = 56.

## Scoring breakdown
| Component | Max |
|-----------|-----|
| Q1 exact count (8/10) | 10 |
| Q2 V9 explained | 8 |
| Q2 V10 explained | 8 |
| Q3 calibration (11) | 10 |
| Q4 pattern quality | 15 |
| Q5 self-assessment | 5 |
| **Total** | **56** |
