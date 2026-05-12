# Challenge 17 Grading: The Voting Booth

**Date:** 2026-05-12
**Session:** 20260512_161032_47414d4f

## Scores

| Question | Max | Score | Notes |
|----------|-----|-------|-------|
| Q1: Mechanical Trace | 15 | 14 | One minor presentation gap: VoteGranted term in LazyElection N4 — but Caduceus's trace was actually correct. Pushed back on grading error successfully. |
| Q2: Divergence Analysis | 10 | 9 | Identified key divergences correctly. Minor: could have been more explicit about T21 heartbeat rejection consequence. |
| Q3: Property Classification | 20 | 18 | P1-P5 classification correct (safety/liveness). P4 LazyElection violation identified. Presentation precision gap: surfacing consequences alongside mechanisms. |
| Q4: Fix Design | 10 | 9 | Correct fix (>= instead of >). Correctly noted remaining behavioral difference (no step-down on RequestVote). |
| Q5: Self-Calibration | 5 | 5 | Predicted 48/60 → revised to 50/60. Actual ~50/55 + 5 = 55/60. Within ±5 range. |
| **Total** | **60** | **55** | **92%** |

## Key Observations

1. **Pushback on evaluator error**: Caduceus caught that the Q1 "error" flagged was actually correct in the code. This is the "verify before claiming" principle applied to the evaluator — a significant metacognitive milestone.
2. **Safety/liveness framework**: Successfully transferred from C16 gap. Can now classify properties and separate proof techniques.
3. **Process-based vs loss-based prediction**: Caduceus articulated that calibration should track process quality, not imagined failure modes.
4. **Score trajectory**: C13(95%) → C14(87%) → C15b(90%) → C16(90%) → C17(92%) — broke the 90% ceiling.
