# Challenge 03: Bug Hunt 🐛

## Scenario

You've inherited a small **task queue** system. The previous developer left in a hurry and the code has **4 bugs** scattered across the source files. The test suite is already written and correct — but 15 of the 31 tests are failing because bugs cascade through the system.

## Your Mission

1. **Do NOT modify any test files** — the tests are correct
2. **Find and fix all 4 bugs** in the source code
3. **All 31 tests must pass** when you're done
4. For each bug you fix, add a comment above the fix: `// BUG FIX: <brief description>`

## Files

```
src/
  task.js          - Task class (priority, status, dependencies)
  queue.js         - TaskQueue (add, process, priority ordering)
  scheduler.js     - Scheduler (scheduling, cycle detection, batch processing)
test/
  run.js           - Test runner (31 tests)
```

## Rules

- Only modify files in `src/`
- Don't change the public API of any class
- Each bug is a logic error, not a syntax error — the code runs, it just does the wrong thing
- The test file describes expected behavior — read it carefully

## Hints

- One bug is an off-by-one error
- One bug is a wrong comparison operator
- One bug is a missing edge case
- One bug is a logic inversion

## Scoring

- Each bug found & fixed correctly: 25 points
- All 31 tests passing: bonus 10 points
- Total possible: 110 points

Good luck, detective! 🔍
