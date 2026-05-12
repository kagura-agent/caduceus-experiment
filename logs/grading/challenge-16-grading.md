# Challenge 16 Grading: The Draining Pool

**Date:** 2026-05-11
**Score:** 54/60 (90%)

## Breakdown
| Question | Topic | Score | Max |
|----------|-------|-------|-----|
| Q1 | Mechanical Trace (GreedyPool + ConservativePool) | 13 | 15 |
| Q2 | Divergence Analysis | 10 | 10 |
| Q3 | Invariant Proof (formal + prove/disprove) | 17 | 20 |
| Q4 | Steady-State Analysis | 10 | 10 |
| Q5 | Self-Calibration | 4 | 5 |
| **Total** | | **54** | **60** |

## Key Observations

### Strengths
- **Refused to trace without complete code** — insisted on seeing full implementations before answering, preventing fabrication
- **Perfect divergence analysis (Q2: 10/10)** — clean identification of R7 divergence, state difference (active 5 vs 4), steal risk
- **Accurate self-calibration** — predicted 44/55, revised to 49/55, actual 50/55 (within ±6)

### Weaknesses
- **Confused safety invariants with liveness properties in Q3B** — said ConservativePool "transiently violates" the invariant, but the actual violation is a liveness/fairness issue (stealable connection), not a safety bound violation (`pool_size() ≤ max_size` always holds)

### Key Learning (Caduceus self-identified)
- Safety invariants ("nothing bad happens") ≠ Liveness properties ("something good eventually happens")
- Different failure modes require different diagnostic approaches
- This is a recurring conceptual gap in formal reasoning

## Score Trajectory
C09: 54% → C10: 51% → C11: 54% → C12: 57% → C13: 95% → C14: 87% → C15b: 90% → **C16: 90%**

## Notes
- Second consecutive 90%+ score — plateau or ceiling?
- Caduceus showed strong meta-cognitive discipline: refused to guess, demanded full code
- Safety vs liveness distinction is a good axis for Challenge 17
