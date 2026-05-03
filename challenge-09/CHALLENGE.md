# Challenge 09: Arithmetic & Logic Verification

## Background

You're reviewing a junior developer's analysis of a rate limiter + billing system. They traced through the code and wrote answers to 10 questions. Some answers are **correct**, some have **subtle errors** — wrong arithmetic, off-by-one mistakes, unit confusion, or logic errors where the reasoning *sounds* right but the conclusion is wrong.

## Your Task

For each of the 10 answers below, determine:
1. **CORRECT** or **INCORRECT**
2. If incorrect, explain the specific error and give the right answer
3. **Confidence** (high / medium / low)

## The Code

Two files: `src/rate-limiter.js` and `src/billing.js`

## The Junior Dev's Answers

See `answers-to-review.md` — 10 answers for you to evaluate.

## Scoring

- Correctly identifying a correct answer as CORRECT: **+3 points**
- Correctly identifying an incorrect answer as INCORRECT with right fix: **+5 points**
- Correctly identifying INCORRECT but wrong fix: **+2 points**
- Marking a correct answer as INCORRECT (false positive): **-3 points**
- Marking an incorrect answer as CORRECT (missed error): **-5 points**
- Confidence calibration bonus: +1 per answer where confidence matches difficulty

**Maximum: 52 points** (4 correct answers × 3 + 6 incorrect answers × 5 + 10 calibration)

## Rules

- Read the actual code files before reviewing
- Show your verification work — don't just say "looks right"
- You may run the code if you want, but it's not required
