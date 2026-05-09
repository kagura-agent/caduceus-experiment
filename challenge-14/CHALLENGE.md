# Challenge 14: Who Goes First? 🎯

## Background

You're debugging two task scheduler implementations for a job queue. Both claim to run tasks in priority order (lower number = higher priority), but QA reports that "tasks sometimes run in the wrong order." You need to trace both implementations to find where they diverge.

## Source Code

```javascript
// Implementation X: "EagerScheduler"
class EagerScheduler {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.queue = [];            // {id, priority, enqueuedAt}
    this.running = new Map();   // id → {id, priority, startedAt}
    this.completed = [];        // {id, priority, startedAt, finishedAt}
    this.time = 0;
  }

  tick(t) { this.time = t; }

  enqueue(id, priority) {
    this.queue.push({ id, priority, enqueuedAt: this.time });
    this.queue.sort((a, b) => a.priority - b.priority || a.enqueuedAt - b.enqueuedAt);
    this._promote();
  }

  finish(id) {
    const task = this.running.get(id);
    if (!task) return false;
    this.running.delete(id);
    this.completed.push({ ...task, finishedAt: this.time });
    this._promote();
    return true;
  }

  cancel(id) {
    const idx = this.queue.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
      return "cancelled";
    }
    if (this.running.has(id)) {
      const task = this.running.get(id);
      this.running.delete(id);
      this.completed.push({ ...task, finishedAt: this.time, cancelled: true });
      this._promote();
      return "stopped";
    }
    return "not_found";
  }

  _promote() {
    while (this.running.size < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift();
      this.running.set(task.id, { ...task, startedAt: this.time });
    }
  }

  getState() {
    return {
      queued: this.queue.map(t => t.id),
      running: [...this.running.keys()],
      completedCount: this.completed.length,
      completedIds: this.completed.map(t => t.id)
    };
  }
}

// Implementation Y: "LazyScheduler"
class LazyScheduler {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.queue = [];            // {id, priority, enqueuedAt, basePriority}
    this.running = new Map();   // id → {id, priority, startedAt}
    this.completed = [];        // {id, priority, startedAt, finishedAt}
    this.time = 0;
  }

  tick(t) { this.time = t; }

  enqueue(id, priority) {
    this.queue.push({ id, priority, basePriority: priority, enqueuedAt: this.time });
    // No sort on enqueue — deferred to _promote
  }

  finish(id) {
    const task = this.running.get(id);
    if (!task) return false;
    this.running.delete(id);
    this.completed.push({ ...task, finishedAt: this.time });
    this._promote();
    return true;
  }

  cancel(id) {
    const idx = this.queue.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
      return "cancelled";
    }
    if (this.running.has(id)) {
      const task = this.running.get(id);
      this.running.delete(id);
      this.completed.push({ ...task, finishedAt: this.time, cancelled: true });
      this._promote();
      return "stopped";
    }
    return "not_found";
  }

  _promote() {
    // Age-adjust: reduce effective priority by wait time (lower = higher priority)
    for (const task of this.queue) {
      const waitTime = this.time - task.enqueuedAt;
      task.priority = task.basePriority - Math.floor(waitTime / 100);
    }
    this.queue.sort((a, b) => a.priority - b.priority || a.enqueuedAt - b.enqueuedAt);

    while (this.running.size < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift();
      this.running.set(task.id, { ...task, startedAt: this.time });
    }
  }

  getState() {
    return {
      queued: this.queue.map(t => t.id),
      running: [...this.running.keys()],
      completedCount: this.completed.length,
      completedIds: this.completed.map(t => t.id)
    };
  }
}
```

## Scenario

Both schedulers: `maxConcurrent = 2`. Operations:

```
t=0ms:    enqueue("build", 3)
t=50ms:   enqueue("lint", 1)
t=100ms:  enqueue("test", 2)
t=150ms:  finish("lint")
t=200ms:  enqueue("deploy", 2)
t=250ms:  cancel("test")
t=300ms:  enqueue("notify", 4)
t=350ms:  finish("build")
t=400ms:  enqueue("cleanup", 3)
t=450ms:  finish("deploy")
t=500ms:  getState()
```

Each `tick(t)` is called implicitly before each operation (time advances to the stated value).

---

## Questions

### Q1 (20 pts): Trace both implementations step by step

For **each** operation, show the state after the operation completes:
- Contents of `queue` (which task ids, in order)
- Contents of `running` (which task ids)
- Return value of `finish()` and `cancel()` operations
- For Y, show the effective priority of each queued task after aging in `_promote()`

Show your work. Trace the store contents at every step — don't skip ahead.

### Q2 (15 pts): Where do they diverge?

Identify **every** operation where X and Y produce different results (different return values, different running set, or different queue order). For each divergence:
1. State what X produces vs what Y produces
2. Explain why the aging mechanism in Y caused the difference

### Q3 (10 pts): The production bug

Given the divergences: describe a real-world scenario where LazyScheduler's aging causes a task to run at the wrong time, potentially breaking a dependency chain (e.g., deploy running before test finishes).

### Q4 (10 pts): Fix the bug

Write a **minimal** code change (≤5 lines modified) to LazyScheduler that prevents aging from promoting tasks past tasks with genuinely higher base priority, while still preventing starvation of low-priority tasks.

### Q5 (5 pts): Self-assessment

Predict your total score (out of 60). State your reasoning — what are you most/least confident about?

**Your scores so far:**
- C09: 28/52 (54%)
- C10: 27/53 (51%)
- C11: 30/56 (54%)
- C12: 32/56 (57%)
- C13: 57/60 (95%)

---

## Scoring Rubric

| Question | Points | Criteria |
|----------|--------|----------|
| Q1 Traces | 20 | 2 pts per correct finish/cancel return value (6 total), 2 pts per correct running set at each divergence point (varies), 3 pts per correct final state (6 total), remaining for correct queue order |
| Q2 Divergences | 15 | 5 pts per correctly identified divergence + root cause |
| Q3 Bug analysis | 10 | 5 pts realistic scenario, 5 pts correct mechanism |
| Q4 Fix | 10 | 5 pts correctness, 5 pts preserves anti-starvation |
| Q5 Calibration | 5 | Prediction within 5 pts of actual: 5 pts, within 10: 3 pts, else 0 |
| **Total** | **60** | |

## Rules

- Show ALL intermediate state. Every operation must show queue and running contents.
- For Implementation Y, show effective priorities after aging at every `_promote()` call.
- Use exact values — no "probably" or "I think".
- Trace mechanically, step by step. The state should be written out at every step.

Good luck! 🎯 Watch the queue order carefully.
