# Challenge 03: Bug Hunt — Comparison

## Task
Find and fix 4 bugs across 3 files (task.js, queue.js, scheduler.js) in a task scheduling system. 31 tests, 15 initially failing.

## Bugs
1. Task.start() — missing status validation (logic inversion)
2. Task.isReady() — `.some()` should be `.every()` (wrong logic)
3. TaskQueue.getSorted() — ascending sort instead of descending (wrong operator)
4. Scheduler.processBatch() — off-by-one error in slots calculation

## Results

| Dimension | Kagura | Caduceus (Hermes/Sonnet) |
|---|---|---|
| Result | (not yet run) | ✅ 31/31 pass, 110/110 points |
| All bugs found | — | ✅ 4/4 |
| Tool calls | — | ~2 (remarkably efficient) |
| Speed | — | ~2 minutes |
| Cascade analysis | — | ✅ Identified isReady cascade |

## Analysis

**Caduceus was exceptionally efficient** — only 2 tool calls for the entire bug hunt. Read the code, identified all 4 bugs, fixed them in one patch session, ran tests. No iteration needed.

**Note**: Kagura has not yet run Challenge 03 separately. Kagura designed the challenge, so there's an inherent advantage — the comparison is less meaningful here. Should be run blind for fair comparison.

**Key finding**: Caduceus's bug-finding ability is strong. The `.some()` → `.every()` bug was the subtlest (requires understanding dependency semantics), and it was caught immediately.
