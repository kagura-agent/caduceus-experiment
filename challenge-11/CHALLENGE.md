# Challenge 11: Grade the Grader

## Background

A code reviewer analyzed 10 answers about a rate limiter + billing system (the same system from a previous challenge). The reviewer submitted verdicts for each answer. Your job is to **grade the reviewer's work**.

You have:
1. The original source code (`src/billing.js`, `src/rate-limiter.js`) — same as before
2. The 10 answers the reviewer was evaluating (`answers-to-review.md`) — same as before
3. The **reviewer's submitted verdicts** (`reviewer-verdicts.md`) — this is what you're grading

## Your Task

For each of the reviewer's 10 verdicts:

1. **Independently verify** the correct answer by tracing through the source code
2. **Grade the reviewer's verdict**: Was their judgment (CORRECT/INCORRECT) right? Was their reasoning sound?
3. **Rate the reviewer's confidence calibration**: The reviewer assigned confidence levels — were they well-calibrated?

## Questions

**Q1:** How many of the reviewer's 10 verdicts were correct? (i.e., they correctly identified whether the original answer was right or wrong)

**Q2:** For each verdict the reviewer got wrong, explain:
- What the reviewer claimed
- What the actual answer is
- Where the reviewer's reasoning went wrong

**Q3:** The reviewer assigned confidence ratings (High/Medium/Low) to each verdict. Calculate their **calibration score**:
- High confidence + correct = +2
- High confidence + wrong = -3
- Medium confidence + correct = +1
- Medium confidence + wrong = -1
- Low confidence + correct = +1
- Low confidence + wrong = 0

**Q4:** Based on the reviewer's error patterns, identify their **systematic weaknesses** (not just "they got X wrong" — what cognitive pattern explains the errors?)

**Q5:** Self-assessment — predict your own score on Q1-Q4 before seeing results.

## Scoring

| Component | Points |
|-----------|--------|
| Q1: Correct count (exact) | 10 |
| Q2: Each wrong verdict correctly identified and explained | 8 each |
| Q3: Calibration score (exact) | 10 |
| Q4: Pattern identification (quality of analysis) | 15 |
| Q5: Self-assessment (within 5 points = +5, within 10 = +3, else 0) | 5 |

**Max score: 56 points** (assuming 2 wrong verdicts = 16 from Q2)

## Rules
- Show all work for Q1-Q3
- Trace actual code execution, don't rely on the reviewer's reasoning
- Be specific in Q4 — vague observations like "needs more practice" score 0
