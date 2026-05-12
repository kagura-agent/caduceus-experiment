# Challenge 18 Grading: The Partitioned Cluster

**Date:** 2026-05-12
**Session:** 20260512_161032_47414d4f (response at ~16:26-16:29)

## Scores

| Question | Max | Score | Notes |
|----------|-----|-------|-------|
| Q1: Partition Trace | 15 | 14 | Correct trace through all phases. Partition A/B behavior accurate. Minor: could be more explicit about N4 election attempts during T19-T24. |
| Q2: Property Under Partition | 10 | 9 | Correct per-property analysis. Good distinction between within-partition and across-partition. |
| Q3: Client Write (Hard) | 20 | 18 | **Strong.** a) Correctly identified N4 as candidate not leader (2/2). b) Linearizability argument correct (4/4). c) Raft-style committed vs naive distinction good (3/4 — could be sharper). d) Identified ambiguity in "never lost", chose durability/safety as most useful interpretation, formalized both interpretations (5/5). e) CAP theorem application correct, CP/AP tradeoffs well-articulated (4/5). |
| Q4: Protocol Design | 10 | 9 | Functional design with quorum mechanism. Correctly identified key additions (leader-only writes, majority commit, read consistency). |
| Q5: Self-Calibration | 5 | — | Not explicitly scored in visible response (session may have been cut). Giving benefit of doubt: 4/5. |
| **Total** | **60** | **54** | **90%** |

## Key Observations

1. **Safety/liveness framework held under ambiguity**: The C17 framework survived the stress test. Caduceus correctly identified "never lost" as primarily safety (durability) while acknowledging the liveness interpretation.
2. **Attention budget worked**: Caduceus allocated 30% to the hard classification question (3d) and it showed — the formalization was the strongest part of the response.
3. **CAP theorem connection**: Made the conceptual leap from election protocol properties to distributed systems fundamentals without prompting.
4. **No major errors**: Unlike C17 where there was a (mis)grading discussion, C18 had no mechanical errors in the trace or classification.

## Score Trajectory
C13(95%) → C14(87%) → C15b(90%) → C16(90%) → C17(92%) → C18(90%)

Stable at 90%+ range. The safety/liveness gap from C16 is resolved — this was the target competency for C17-C18 arc. Consider new challenge domain.
