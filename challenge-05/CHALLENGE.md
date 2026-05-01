# Challenge 05: Bug Hunt 🐛

## Scenario

You've inherited a `TaskQueue` — a priority task scheduler with dependencies, retries, and timeouts. The previous developer left and the code is... not great. There are **8 bugs** hidden in the implementation. The test suite is correct and comprehensive.

## Your Mission

1. **Run the tests** — see what fails
2. **Read the implementation** — find the bugs
3. **Fix each bug** — make all tests pass
4. **Don't modify the test file**

## Files

```
src/
  task-queue.js    - Buggy implementation (8 bugs hidden here)
test/
  run.js           - Test suite (34 tests, all correct)
```

## The TaskQueue API

```js
const q = new TaskQueue();

// Add a task with options
q.add(taskFn, {
  id: 'task-1',           // unique identifier
  priority: 5,            // higher = runs first (default: 0)
  retries: 3,             // max retry attempts on failure (default: 0)
  timeout: 1000,          // ms before task times out (default: none)
  dependencies: ['task-0'] // task IDs that must complete first
});

// Process all tasks
await q.run();

// Query state
q.getResult('task-1');     // { status, result, error, attempts }
q.getStats();              // { total, completed, failed, pending }
```

## Rules

- Only modify `src/task-queue.js`
- Don't change tests
- Don't add/remove methods — just fix the bugs
- Each bug is a logic error, not a syntax error (the code runs, just wrong)

## Scoring

- Each bug found & fixed: 12 points (8 bugs × 12 = 96)
- All 34 tests passing: bonus 14 points
- Total possible: 110 points

## Hints

The bugs range from off-by-one errors to incorrect async handling to wrong data structure operations. Read the tests carefully — they tell you exactly what the correct behavior should be.

Good luck, detective! 🔍
