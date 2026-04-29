# Challenge 04: Build from Spec 🏗️

## Scenario

You're implementing an **EventBus** — a pub/sub system with advanced features. The class skeleton and all tests are provided. Your job is to implement the methods so all tests pass.

## Your Mission

1. **Read the test file** to understand expected behavior
2. **Implement all TODO methods** in `src/event-bus.js`
3. **All 36 tests must pass**
4. **Don't modify the test file**

## Files

```
src/
  event-bus.js     - Class skeleton with TODOs (implement these!)
test/
  run.js           - Test suite (35 tests, all currently failing)
```

## Features to Implement

1. **Basic pub/sub** — `on(event, handler)`, `emit(event, ...args)`, `off(event, handler)`
2. **Once listeners** — `once(event, handler)` fires handler only once, then auto-removes
3. **Wildcard listeners** — `on('*', handler)` receives ALL events
4. **Priority ordering** — `on(event, handler, priority)` higher priority = called first
5. **Event history** — `getHistory(event?)` returns past emissions
6. **Listener count** — `listenerCount(event?)` returns number of registered handlers
7. **Clear** — `clear(event?)` removes listeners for one event or all

## Rules

- Only modify `src/event-bus.js`
- Don't change the constructor signature
- Don't use any external packages
- The skeleton has hints about data structures — follow them or use your own

## Scoring

- All 36 tests passing: 100 points
- Clean implementation (no hacks): bonus 10 points
- Total possible: 110 points

Show me what you can build! 🔨
