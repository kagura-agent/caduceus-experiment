# Challenge 14: Answer Key 🎯

## Q1: Step-by-step traces (20 pts)

### Key behavioral differences between X and Y

- **X (EagerScheduler):** `enqueue()` pushes, sorts by priority (then enqueuedAt), and calls `_promote()`. `_promote()` moves tasks from queue head to running while slots are available.
- **Y (LazyScheduler):** `enqueue()` only pushes — NO sort, NO `_promote()`. `_promote()` is only called inside `finish()` (after successfully removing from running) and `cancel()` (only in the "stopped" path — cancelling a *running* task). Since nothing ever reaches running without `_promote()`, and `_promote()` is never triggered by enqueue, **Y never promotes anything for this entire scenario**.

---

### Implementation X (EagerScheduler) — Full Trace

**t=0: enqueue("build", 3)**
- Push: `{id:"build", priority:3, enqueuedAt:0}`
- Sort: `[build(3)]`
- `_promote()`: running.size(0) < 2, shift build → running
- **Queue:** `[]`
- **Running:** `{build}`
- **Completed:** `[]`

**t=50: enqueue("lint", 1)**
- Push: `{id:"lint", priority:1, enqueuedAt:50}`
- Sort: `[lint(1)]` (only item)
- `_promote()`: running.size(1) < 2, shift lint → running
- **Queue:** `[]`
- **Running:** `{build, lint}`
- **Completed:** `[]`

**t=100: enqueue("test", 2)**
- Push: `{id:"test", priority:2, enqueuedAt:100}`
- Sort: `[test(2)]` (only item)
- `_promote()`: running.size(2) = maxConcurrent, cannot promote
- **Queue:** `[test(2)]`
- **Running:** `{build, lint}`
- **Completed:** `[]`

**t=150: finish("lint")**
- `running.get("lint")` → found ✓
- Remove lint from running
- Push to completed: `{id:"lint", priority:1, startedAt:50, finishedAt:150}`
- `_promote()`: running.size(1) < 2, shift test → running (startedAt: 150)
- **Return:** `true`
- **Queue:** `[]`
- **Running:** `{build, test}`
- **Completed:** `[lint]`

**t=200: enqueue("deploy", 2)**
- Push: `{id:"deploy", priority:2, enqueuedAt:200}`
- Sort: `[deploy(2)]` (only item)
- `_promote()`: running.size(2) = maxConcurrent, cannot promote
- **Queue:** `[deploy(2)]`
- **Running:** `{build, test}`
- **Completed:** `[lint]`

**t=250: cancel("test")**
- `queue.findIndex("test")`: NOT in queue (queue has [deploy])
- `running.has("test")`: YES
- Remove test from running
- Push to completed: `{id:"test", ..., finishedAt:250, cancelled:true}`
- `_promote()`: running.size(1) < 2, shift deploy → running (startedAt: 250)
- **Return:** `"stopped"`
- **Queue:** `[]`
- **Running:** `{build, deploy}`
- **Completed:** `[lint, test(cancelled)]`

**t=300: enqueue("notify", 4)**
- Push: `{id:"notify", priority:4, enqueuedAt:300}`
- Sort: `[notify(4)]` (only item)
- `_promote()`: running.size(2) = maxConcurrent, cannot promote
- **Queue:** `[notify(4)]`
- **Running:** `{build, deploy}`
- **Completed:** `[lint, test(cancelled)]`

**t=350: finish("build")**
- `running.get("build")` → found ✓
- Remove build from running
- Push to completed: `{id:"build", priority:3, startedAt:0, finishedAt:350}`
- `_promote()`: running.size(1) < 2, shift notify → running (startedAt: 350)
- **Return:** `true`
- **Queue:** `[]`
- **Running:** `{deploy, notify}`
- **Completed:** `[lint, test(cancelled), build]`

**t=400: enqueue("cleanup", 3)**
- Push: `{id:"cleanup", priority:3, enqueuedAt:400}`
- Sort: `[cleanup(3)]` (only item)
- `_promote()`: running.size(2) = maxConcurrent, cannot promote
- **Queue:** `[cleanup(3)]`
- **Running:** `{deploy, notify}`
- **Completed:** `[lint, test(cancelled), build]`

**t=450: finish("deploy")**
- `running.get("deploy")` → found ✓
- Remove deploy from running
- Push to completed: `{id:"deploy", priority:2, startedAt:250, finishedAt:450}`
- `_promote()`: running.size(1) < 2, shift cleanup → running (startedAt: 450)
- **Return:** `true`
- **Queue:** `[]`
- **Running:** `{notify, cleanup}`
- **Completed:** `[lint, test(cancelled), build, deploy]`

**t=500: getState()**
- **queued:** `[]`
- **running:** `["notify", "cleanup"]`
- **completedCount:** `4`
- **completedIds:** `["lint", "test", "build", "deploy"]`

---

### Implementation Y (LazyScheduler) — Full Trace

**t=0: enqueue("build", 3)**
- Push: `{id:"build", priority:3, basePriority:3, enqueuedAt:0}`
- NO sort, NO `_promote()`
- **Queue:** `[build(3)]`
- **Running:** `{}`
- **Completed:** `[]`

**t=50: enqueue("lint", 1)**
- Push: `{id:"lint", priority:1, basePriority:1, enqueuedAt:50}`
- NO sort, NO `_promote()`
- **Queue:** `[build(3), lint(1)]`
- **Running:** `{}`
- **Completed:** `[]`

**t=100: enqueue("test", 2)**
- Push: `{id:"test", priority:2, basePriority:2, enqueuedAt:100}`
- NO sort, NO `_promote()`
- **Queue:** `[build(3), lint(1), test(2)]`
- **Running:** `{}`
- **Completed:** `[]`

**t=150: finish("lint")**
- `running.get("lint")` → **NOT FOUND** (lint is in queue, never promoted to running)
- Returns immediately, NO `_promote()` called
- **Return:** `false`
- **Queue:** `[build(3), lint(1), test(2)]`
- **Running:** `{}`
- **Completed:** `[]`

**t=200: enqueue("deploy", 2)**
- Push: `{id:"deploy", priority:2, basePriority:2, enqueuedAt:200}`
- NO sort, NO `_promote()`
- **Queue:** `[build(3), lint(1), test(2), deploy(2)]`
- **Running:** `{}`
- **Completed:** `[]`

**t=250: cancel("test")**
- `queue.findIndex("test")` → **idx=2** (found in queue!)
- `splice(2, 1)` removes test from queue
- Returns "cancelled" — this path does NOT call `_promote()`
- **Return:** `"cancelled"`
- **Queue:** `[build(3), lint(1), deploy(2)]`
- **Running:** `{}`
- **Completed:** `[]`

**t=300: enqueue("notify", 4)**
- Push: `{id:"notify", priority:4, basePriority:4, enqueuedAt:300}`
- NO sort, NO `_promote()`
- **Queue:** `[build(3), lint(1), deploy(2), notify(4)]`
- **Running:** `{}`
- **Completed:** `[]`

**t=350: finish("build")**
- `running.get("build")` → **NOT FOUND** (build is in queue, never promoted)
- Returns immediately, NO `_promote()` called
- **Return:** `false`
- **Queue:** `[build(3), lint(1), deploy(2), notify(4)]`
- **Running:** `{}`
- **Completed:** `[]`

**t=400: enqueue("cleanup", 3)**
- Push: `{id:"cleanup", priority:3, basePriority:3, enqueuedAt:400}`
- NO sort, NO `_promote()`
- **Queue:** `[build(3), lint(1), deploy(2), notify(4), cleanup(3)]`
- **Running:** `{}`
- **Completed:** `[]`

**t=450: finish("deploy")**
- `running.get("deploy")` → **NOT FOUND** (deploy is in queue, never promoted)
- Returns immediately, NO `_promote()` called
- **Return:** `false`
- **Queue:** `[build(3), lint(1), deploy(2), notify(4), cleanup(3)]`
- **Running:** `{}`
- **Completed:** `[]`

**t=500: getState()**
- **queued:** `["build", "lint", "deploy", "notify", "cleanup"]`
- **running:** `[]`
- **completedCount:** `0`
- **completedIds:** `[]`

---

### Return Value Summary

| Operation | X Return | Y Return |
|-----------|----------|----------|
| t=150: finish("lint") | `true` | `false` |
| t=250: cancel("test") | `"stopped"` | `"cancelled"` |
| t=350: finish("build") | `true` | `false` |
| t=450: finish("deploy") | `true` | `false` |

---

## Q2: Divergence Points (15 pts)

**Y's fundamental flaw: `_promote()` is never called on `enqueue()`**, meaning tasks are never moved from queue to running. The only triggers for `_promote()` are: (1) `finish()` after successfully removing a running task, and (2) `cancel()` when stopping a running task. Since no task ever reaches running, neither trigger fires — creating a complete deadlock.

### Divergence 1: t=0 — enqueue("build", 3)

- **X:** build is promoted to running immediately. Running: `{build}`, Queue: `[]`
- **Y:** build stays in queue. Running: `{}`, Queue: `[build]`
- **Why:** X calls `_promote()` in `enqueue()`. Y does not. This is the root divergence that cascades through every subsequent operation.

### Divergence 2: t=50 — enqueue("lint", 1)

- **X:** lint is promoted to running (2nd slot). Running: `{build, lint}`, Queue: `[]`
- **Y:** lint stays in queue. Running: `{}`, Queue: `[build, lint]`
- **Why:** Same — Y's `enqueue()` never calls `_promote()`.

### Divergence 3: t=150 — finish("lint")

- **X:** lint is found in running, removed, test promoted. Returns `true`. Running: `{build, test}`, Completed: `[lint]`
- **Y:** lint is NOT in running (still in queue). Returns `false`. Nothing changes. Running: `{}`, Completed: `[]`
- **Why:** Since Y never promoted lint to running, `finish("lint")` can't find it. The `finish()` method only checks `this.running`, not `this.queue`. Return value diverges: `true` vs `false`.

### Divergence 4: t=250 — cancel("test")

- **X:** test is in running (was promoted at t=150). Returns `"stopped"`, deploy promoted. Running: `{build, deploy}`
- **Y:** test is in queue at index 2. Returns `"cancelled"`, removed from queue. NO `_promote()` called. Running: `{}`
- **Why:** In X, test was promoted to running at t=150, so cancel finds it via `running.has()` → "stopped" path (which calls `_promote()`). In Y, test was never promoted, so cancel finds it via `queue.findIndex()` → "cancelled" path (which does NOT call `_promote()`). Return value diverges: `"stopped"` vs `"cancelled"`.

### Divergence 5: t=350 — finish("build")

- **X:** build is in running (promoted at t=0). Returns `true`, notify promoted. Running: `{deploy, notify}`
- **Y:** build is in queue. Returns `false`. Nothing changes. Running: `{}`
- **Why:** Same root cause — Y never promoted build.

### Divergence 6: t=450 — finish("deploy")

- **X:** deploy is in running (promoted at t=250). Returns `true`, cleanup promoted. Running: `{notify, cleanup}`
- **Y:** deploy is in queue. Returns `false`. Nothing changes. Running: `{}`
- **Why:** Same root cause — Y never promoted deploy.

### Divergence 7: t=500 — getState()

- **X:** queued: `[]`, running: `["notify", "cleanup"]`, completedCount: 4, completedIds: `["lint", "test", "build", "deploy"]`
- **Y:** queued: `["build", "lint", "deploy", "notify", "cleanup"]`, running: `[]`, completedCount: 0, completedIds: `[]`
- **Why:** Complete state divergence. X has processed 4 tasks and has 2 running. Y has processed nothing — all 5 remaining tasks are stuck in the queue forever.

---

## Q3: The Production Bug (10 pts)

### Scenario: Deploy runs before tests complete

Consider a CI pipeline with dependency chain: `lint → test → build → deploy`.

**Setup:**
- `maxConcurrent = 2`
- t=0: enqueue("lint", 1), enqueue("deploy", 4)
- Both are promoted. lint and deploy start running.
- t=50: enqueue("test", 2), enqueue("build", 3)
- Both queued: [test(2), build(3)]
- t=100: finish("lint") → triggers `_promote()`

**At t=100 in `_promote()` (LazyScheduler):**
- Aging for test: waitTime = 100-50 = 50ms, effective = 2 - floor(50/100) = 2 - 0 = 2
- Aging for build: waitTime = 100-50 = 50ms, effective = 3 - floor(50/100) = 3 - 0 = 3
- test runs next (correct so far)

**Now consider a longer wait. Same setup but:**
- t=0: enqueue("lint", 1), enqueue("test", 2) → both promoted
- t=50: enqueue("build", 3)
- t=100: enqueue("deploy", 5)
- Both queued: [build(3), deploy(5)]
- t=500: finish("lint") → triggers `_promote()`

**At t=500 in `_promote()`:**
- build: waitTime = 500-50 = 450ms, effective = 3 - floor(450/100) = 3 - 4 = **-1**
- deploy: waitTime = 500-100 = 400ms, effective = 5 - floor(400/100) = 5 - 4 = **1**

Build gets effective priority -1, deploy gets 1. Both would be promoted (2 slots now available after lint finishes). But consider if only 1 slot opens: build (-1) runs before deploy (1), which is correct.

**The dangerous case:** What if a genuinely critical hotfix arrives at t=499?
- t=499: enqueue("hotfix", 1)
- t=500: finish("lint") → `_promote()`
  - build: effective = 3 - 4 = **-1**
  - deploy: effective = 5 - 4 = **1**
  - hotfix: waitTime = 500-499 = 1ms, effective = 1 - 0 = **1**
  
Sorted: build(-1), deploy(1), hotfix(1). **Build runs first, then deploy OR hotfix** (tiebreaker: enqueuedAt).

The critical hotfix (genuinely priority 1) is behind build (base priority 3!) because aging gave build an artificially low effective priority of -1. In a deployment pipeline, this means a low-priority build task blocks a critical hotfix from running, and if deploy has a dependency on the hotfix completing first, the deploy will execute with stale code.

**The mechanism:** Aging reduces effective priority without any floor. Tasks that have waited long enough can achieve *any* effective priority, including negative values that beat genuinely critical tasks. This violates the invariant that a task with basePriority 1 should always run before a task with basePriority 3, regardless of wait time.

---

## Q4: Fix the Bug (10 pts)

The minimal fix: cap the effective priority so aging can never push a task below priority 1 (the highest genuine priority level). This prevents low-priority tasks from aging past genuinely high-priority tasks while still allowing starvation prevention (a priority-4 task can age down to priority 1, matching — but never beating — the highest priority).

**Change in `_promote()` (1 line modified):**

```javascript
_promote() {
    for (const task of this.queue) {
      const waitTime = this.time - task.enqueuedAt;
      // OLD: task.priority = task.basePriority - Math.floor(waitTime / 100);
      task.priority = Math.max(1, task.basePriority - Math.floor(waitTime / 100));  // NEW
    }
    this.queue.sort((a, b) => a.priority - b.priority || a.enqueuedAt - b.enqueuedAt);

    while (this.running.size < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift();
      this.running.set(task.id, { ...task, startedAt: this.time });
    }
  }
```

**What this achieves:**
- **Prevents priority inversion:** A task with basePriority 3 can age from 3 → 2 → 1 but never to 0 or negative. It can at most *tie* with a genuinely priority-1 task, where the tiebreaker (enqueuedAt) gives precedence to the earlier-enqueued task.
- **Preserves anti-starvation:** Low-priority tasks (e.g., basePriority 4) still age toward priority 1 over time, ensuring they eventually get scheduled rather than being starved indefinitely by a constant stream of higher-priority tasks.
- **1 line changed:** Only the aging calculation line is modified, well within the ≤5 line budget.

**Note:** This fix addresses the aging problem. The separate issue (Y not calling `_promote()` on `enqueue()`) is a different bug that would require adding `this._promote();` at the end of `enqueue()` — but that's outside the scope of this question which specifically asks about the aging mechanism.

---

## Q5: Self-Assessment (5 pts)

**Predicted score: 52/60**

**Reasoning:**

- **Q1 (20 pts):** High confidence. The trace is mechanical and I followed every code path carefully. The critical insight — Y never calls `_promote()` on enqueue, so nothing ever reaches running — drives the entire trace. Every return value and state is derived directly from the code. I expect ~18-19/20, possibly losing a point on formatting or minor detail.

- **Q2 (15 pts):** High confidence. I identified 7 divergence points with clear root cause analysis. The root cause is consistent (Y's missing `_promote()` in enqueue) and each divergence follows logically. I expect ~13-14/15.

- **Q3 (10 pts):** Medium-high confidence. The scenario demonstrates how aging can create negative effective priorities that beat genuinely high-priority tasks. The mechanism explanation is grounded in the actual formula. I expect ~8/10 — the scenario is realistic but might not be the exact framing the rubric expects.

- **Q4 (10 pts):** Medium confidence. The `Math.max(1, ...)` fix is minimal (1 line) and correctly prevents priority inversion while preserving anti-starvation. However, I'm uncertain whether the rubric expects me to also fix the missing `_promote()` in enqueue, or whether capping at 1 is the "right" floor value. I expect ~7-8/10.

- **Q5 (5 pts):** If my prediction of 52 is within 5 points of actual → 5/5, within 10 → 3/5. Given high confidence in Q1-Q2 and medium in Q3-Q4, I believe 52 is a reasonable center estimate.

**Most confident about:** Q1 trace — mechanical execution with clear code paths.
**Least confident about:** Q4 fix — whether the fix is considered sufficient or if additional changes are expected.

---

## Score Breakdown Summary

| Question | Max | Expected |
|----------|-----|----------|
| Q1 Traces | 20 | 18-19 |
| Q2 Divergences | 15 | 13-14 |
| Q3 Bug analysis | 10 | 8 |
| Q4 Fix | 10 | 7-8 |
| Q5 Calibration | 5 | 5 |
| **Total** | **60** | **~52** |
