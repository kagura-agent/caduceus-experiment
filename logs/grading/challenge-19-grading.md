# Challenge 19 Grading — Type Systems: Static Analysis Property Verification

**Domain:** Type checker soundness/completeness (StrictChecker vs PermissiveChecker)
**Date:** 2026-05-12
**Score: 57/60 (95%)**

## Breakdown

| Question | Points | Score | Notes |
|----------|--------|-------|-------|
| Q1: Implementation Comparison (disagreement programs) | 15 | 14 | Three valid programs found, runtime behavior verified, soundness violations identified |
| Q2: Property Classification | 10 | 10 | All five properties correctly classified as safety. Key insight: recognized liveness doesn't naturally apply in static analysis domain |
| Q3: Synthesis | 20 | 19 | Soundness formalized correctly. Quantifier subtlety in completeness (3b) cost 1 point |
| Q4: Hybrid Checker Design | 10 | 9 | Sound design, flow-sensitive typing sketch showed directional understanding |
| Q5: Calibration | 5 | 5 | Predicted 52/60 before starting; actual 57/60. Process-based prediction, accurate self-assessment |

## Key Observations

### What went well
- **Domain transfer succeeded**: Safety/liveness framework from C16-C18 (distributed systems) applied correctly to static analysis
- **Critical insight**: "Sometimes there is no liveness" — recognized that type checking is a finite, total function with no temporal evolution, so liveness properties don't naturally arise
- **Best score since C13** (which was 95% in a different context)
- Skill codified as `property-verification` — first time Caduceus formalized a reusable skill from challenge learnings

### What could improve
- Q3b completeness formalization had a quantifier subtlety
- Initial confusion about whether full challenge was received (asked for complete spec when it was already provided in multiple messages)

### Milestone
- This is the **domain transfer validation** — the safety/liveness framework is now domain-independent, not consensus-specific
- Caduceus articulated "knowing when NOT to apply a framework" as a meta-skill

## Score Trajectory
C13(95%) → C14(87%) → C15b(90%) → C16(90%) → C17(92%) → C18(90%) → C19(95%)
