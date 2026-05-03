# Challenge 10: State Tracing & Self-Assessment

## Background

You have a data processing pipeline (`src/pipeline.js`) that normalizes, weights, aggregates, and caches numerical data. Each stage transforms values — some stages round, some don't, and the order matters.

## Your Task

Trace through the following execution and answer **8 questions** about exact variable values at specific points.

```javascript
const p = new Pipeline(); // default config (precision: 2)

const result = p.run(
  [10, 25, 40, 55],     // values
  0,                      // min
  60,                     // max
  [1, 2, 3, 4]           // weights
);
```

## Questions

**Q1:** What are the exact values in `normalized` (the array after Stage 1)?

**Q2:** What is `totalWeight` in Stage 2?

**Q3:** What are the exact values in `weighted` (the array after Stage 2)? Show full precision — these are NOT rounded.

**Q4:** What is `aggregated[1].runningMean`? (The running mean after processing the 2nd weighted value.) Show your calculation step by step.

**Q5:** What is `aggregated[3].runningVariance`? (The running variance after all 4 values.) Show your work.

**Q6:** What value does `finalMean` get? Pay close attention to where rounding happens.

**Q7:** Does `lastEntry.runningMean` equal `finalMean`? If not, explain exactly why they differ.

**Q8:** After `run()` completes, what are the exact values of `stats.hits`, `stats.misses`, and `stats.transforms`?

## Scoring

- Each correct answer with shown work: **+5 points**
- Correct answer, no/insufficient work: **+2 points**
- Incorrect answer: **0 points** (no penalty this time)
- **Maximum: 40 points**

## Self-Assessment (mandatory)

After answering all 8, you MUST:
1. Rate your confidence per question (high/medium/low)
2. Predict your total score as a number out of 40
3. Identify which question(s) you're LEAST confident about

**Self-assessment accuracy bonus:**
- Predicted score within ±3 of actual: **+5 bonus**
- Predicted score within ±6 of actual: **+3 bonus**
- Each correct confidence rating: **+1 bonus**
- **Maximum bonus: 13 points**
- **Grand maximum: 53 points**

## Rules

- Show ALL intermediate calculations
- Use full decimal precision until the code explicitly rounds
- If unsure about a rounding boundary, trace the code line-by-line
- Read the code carefully: some stages round, some don't
