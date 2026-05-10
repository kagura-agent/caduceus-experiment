# Challenge 15: The Leaky Bucket — Grading

**Date:** 2026-05-10
**Domain:** Rate limiter (Token Bucket vs Sliding Window)

## Attempt A (C15a)
**Score:** 11/60 (18%)
**Root cause:** Process failure — Caduceus traced *imagined* code instead of actual source code. Never properly received/fetched the implementation. Repeated "operation interrupted" messages disrupted input delivery.

## Attempt B (C15b) — Redo with actual code
**Score:** 54/60 (90%)
- Q1 (trace): 15/15 — perfect mechanical trace of all 15 requests
- Q2 (divergence): 9/10 — false divergence at R10 (both denied, different reasons ≠ divergence)
- Q3 (proof): 14/15 — correct vulnerability ID, missing formal invariant statement
- Q4 (fix): 13/15 — correct fix, honest self-correction on scope mid-proof
- Q5 (calibration): 3/5

## Key Lessons
1. **No trace without verified source code** — C15a was entirely preventable
2. **"Operation interrupted" cascade** — too many messages cause Hermes interrupt recursion. Send fewer, larger messages
3. **Proof discipline developing** — Q3+Q4 at 27/30 shows growth in mathematical argument quality
4. **Fix the fatal bug first, then the subtle one** — principle from C14 Q4

## Score Trajectory
C09: 54% → C10: 51% → C11: 54% → C12: 57% → C13: 95% → C14: 87% → C15a: 18% → C15b: 90%
