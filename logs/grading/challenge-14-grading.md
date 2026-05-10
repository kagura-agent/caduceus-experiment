# Challenge 14: Who Goes First? — Grading

**Date:** 2026-05-10
**Score:** 52/60 (87%)
**Domain:** Task scheduler (EagerScheduler vs LazyScheduler)

## Design
- Removed forced per-question calibration scaffold from C13
- Only one overall prediction at end (like C09-C12 format)
- Tests whether mechanical tracing discipline is durable without scaffolding

## Results
- Q1 (trace): Strong — mechanical state tracking retained spontaneously
- Q2 (divergence): 9/10 — minor false divergence listing
- Q4 (fix): Missed the fatal bug (deadlock) by treating it as "out of scope", focused on subtle aging bug instead
- Q5 (calibration): Predicted 52, scored 52 — well-calibrated

## Key Findings
1. **Mechanical tracing IS durable** — Caduceus retained the `store = {...}` approach without scaffolding
2. **Accuracy held** — 87% vs 95% on C13, but C13 had scaffolding. Still well above C09-C12 plateau (51-57%)
3. **New failure mode identified**: prioritizing subtle bugs over fatal bugs ("a scheduler that never schedules is more broken than one that schedules in the wrong order")

## Conclusion
Durability confirmed. The tracing discipline transferred to a new domain (schedulers vs caches) and persisted without forced calibration. Issue #18 answered: yes, it persists.
