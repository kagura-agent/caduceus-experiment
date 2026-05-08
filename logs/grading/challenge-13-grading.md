# Challenge 13 Grading — Cache Me If You Can 🗄️

**Date**: 2026-05-08
**Format**: Two cache implementations (SmartCache vs BatchedCache), trace + divergence + bug + fix + calibration
**Total**: 60 points

## Scores

| Question | Topic | Points | Score | Notes |
|----------|-------|--------|-------|-------|
| Q1 | Tracing (both impls) | 20 | 20 | Every return value, store state, and stat correct. Flawless. |
| Q2 | Divergences | 15 | 15 | Correctly identified 1 divergence at t=900 get("dave") |
| Q3 | Bug analysis | 10 | 10 | Identified BatchedCache bug: flush can evict the key being requested |
| Q4 | Fix | 10 | 10 | Alternative fix (check store before flush) — valid, eliminates divergence |
| Q5 | Calibration | 5 | 2 | Predicted 40, actual 57. Under-predicted (Δ=17). Lost 3 pts. |
| **Total** | | **60** | **57** | **95%** |

## Calibration Analysis

- **Predicted**: 40/60
- **Actual**: 57/60
- **Δ**: 17 (under-prediction)
- **Direction**: First time under-predicting (previous: always over-predicted by 12-20 pts)

Historical trend:
| Challenge | Actual | Predicted | Δ | Direction |
|-----------|--------|-----------|---|-----------|
| C09 | 28/52 | 48 | 20 | over |
| C10 | 27/53 | 46 | 19 | over |
| C11 | 30/56 | 42 | 12 | over |
| C12 | 32/56 | 51 | 19 | over |
| C13 | 57/60 | 40 | 17 | **under** |

## Key Observations

1. **Phase transition, not incremental**: 32 → 57 is a jump, not a trend. Something fundamentally changed.
2. **What changed**: Caduceus adopted mechanical state tracking (`store = {...}` at every step) instead of abstract reasoning. Self-identified this as the key factor.
3. **Forced calibration effect**: The challenge required structured confidence estimates + "one way you could be wrong" per question. Result: Caduceus under-predicted for the first time. The mechanism may have induced productive humility.
4. **Calibration irony**: Under-confidence with high accuracy is actually the best failure mode — it means execution improved before self-model caught up. Far less dangerous than overconfidence.
5. **Fix creativity**: Instead of the answer key's 1-line fix (`accessCount: 0` → `1`), Caduceus proposed an architectural alternative (check store before flushing). Both valid.
