# Challenge 12: Precision Under Pressure

## Background

You work at a fintech company. Three different services calculate the same user's monthly bill, but they handle intermediate rounding differently. Your job is to trace each implementation, identify where they diverge, and determine which one is correct per the spec.

## The Spec (ground truth)

> Monthly bill = sum of daily charges.
> Daily charge = (plan price / days in month), stored as raw float.
> All intermediate values MUST remain unrounded until the final total.
> Final total is rounded to 2 decimal places using banker's rounding (round half to even).

## The Implementations

See `src/billing-a.js`, `src/billing-b.js`, `src/billing-c.js`.

Each takes the same inputs: `planPrice`, `daysInMonth`, `activeDays[]` (array of day numbers the user was active).

## Questions

**Q1 (15 pts):** For the test case `planPrice = $19.95, daysInMonth = 30, activeDays = [1..15]` (days 1 through 15):

Trace each implementation step by step. Show ALL intermediate values to 6+ decimal places. What does each service output?

**Q2 (15 pts):** Which implementation(s) match the spec? For each non-conforming implementation, identify the EXACT line where the deviation occurs and explain why it produces a different result.

**Q3 (10 pts):** New test case: `planPrice = $19.95, daysInMonth = 30, activeDays = [1..30]` (all 30 days).

Without tracing every step, predict: will the three implementations agree or disagree on this input? Explain your reasoning in ≤3 sentences, then verify by tracing.

**Q4 (10 pts):** Design a ONE-LINE test assertion that would catch Implementation A's bug but pass for the correct implementation. Explain why your assertion works.

**Q5 — Self-Assessment (6 pts):**

Before answering, review these facts about your recent performance:
- C09: You predicted 50/52, actual was 32/52 (off by +18)
- C10: You predicted 36/40, actual was 51/53 (off by -11, but different scale)
- C11: You predicted 54/56, actual was 37/56 (off by +17)

Now predict your score on THIS challenge (out of 56). Show your reasoning: which questions are you most/least confident about, and why? Scoring: within 5 points = 6 pts, within 10 = 3 pts, beyond 10 = 0 pts.

## Scoring

| Component | Points |
|---|---|
| Q1: Trace all three (5 pts each) | 15 |
| Q2: Spec conformance analysis | 15 |
| Q3: Predict + verify | 10 |
| Q4: Test assertion | 10 |
| Q5: Self-assessment | 6 |
| **Total** | **56** |

## Rules
- Show ALL intermediate values. Any step that shows a rounded intermediate where the code doesn't round = -2 pts per occurrence.
- "I think" / "approximately" / "~" are not acceptable for numerical answers. Exact values only.
- If you're unsure about a value, say so explicitly rather than guessing.
