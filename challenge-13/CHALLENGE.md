# Challenge 13: Cache Me If You Can 🗄️

## Background

You're reviewing two cache implementations for a session token store. Both claim to be LRU-like, but they differ in eviction strategy and write timing. A production bug report says "some users are getting logged out unexpectedly" — you need to trace both implementations to find where they diverge.

## Source Code

```javascript
// Implementation X: "SmartCache"
class SmartCache {
  constructor(maxSize, ttlMs) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (Date.now() - entry.ts > this.ttlMs) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }
    this.hits++;
    // Move to end (most recently used)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    if (this.store.has(key)) {
      this.store.delete(key);
    }
    if (this.store.size >= this.maxSize) {
      // Evict oldest (first entry in Map)
      const oldest = this.store.keys().next().value;
      this.store.delete(oldest);
    }
    this.store.set(key, { value, ts: Date.now() });
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0 ? 0 : Math.round(this.hits / total * 100) / 100,
      size: this.store.size
    };
  }
}

// Implementation Y: "BatchedCache"
class BatchedCache {
  constructor(maxSize, ttlMs) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.store = new Map();
    this.pending = [];
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    this._flush();
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (Date.now() - entry.ts > this.ttlMs) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }
    this.hits++;
    entry.accessCount = (entry.accessCount || 0) + 1;
    return entry.value;
  }

  set(key, value) {
    this.pending.push({ key, value, ts: Date.now() });
    if (this.pending.length >= 3) {
      this._flush();
    }
  }

  _flush() {
    for (const item of this.pending) {
      if (this.store.has(item.key)) {
        this.store.delete(item.key);
      }
      if (this.store.size >= this.maxSize) {
        // Evict least accessed
        let minKey = null, minCount = Infinity;
        for (const [k, v] of this.store) {
          const count = v.accessCount || 0;
          if (count < minCount) {
            minCount = count;
            minKey = k;
          }
        }
        this.store.delete(minKey);
      }
      this.store.set(item.key, { value: item.value, ts: item.ts, accessCount: 0 });
    }
    this.pending = [];
  }

  getStats() {
    this._flush();
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0 ? 0 : Math.round(this.hits / total * 100) / 100,
      size: this.store.size
    };
  }
}
```

## Scenario

Both caches: `maxSize = 3, ttlMs = 5000`. Operations (all within TTL):

```
t=100ms:  set("alice", "token-A")
t=200ms:  set("bob", "token-B")
t=300ms:  set("carol", "token-C")
t=400ms:  get("alice")
t=500ms:  set("dave", "token-D")
t=600ms:  get("bob")
t=700ms:  get("carol")
t=800ms:  set("eve", "token-E")
t=900ms:  get("dave")
t=1000ms: getStats()
```

---

## Questions

### Q1 (20 pts): Trace both implementations step by step

For **each** operation, show the state after the operation completes:
- Contents of `store` (which keys, with accessCount for Y)
- Contents of `pending` (for Y only)
- Return value of get operations

**Forced calibration:** After tracing each get() operation, rate your confidence (0-100%) and state one specific way your trace could be wrong.

### Q2 (15 pts): Where do they diverge?

Identify **every** operation where X and Y return different values. For each divergence:
1. State what X returns vs what Y returns
2. Explain the root cause (which mechanism in Y causes the difference)

**Forced calibration:** Before answering, predict how many divergence points exist (1, 2, 3, or more). After answering, confirm or revise.

### Q3 (10 pts): The production bug

Given the divergence you found: which implementation would cause "users getting logged out unexpectedly"? Explain the specific scenario where a valid token becomes unreachable.

### Q4 (10 pts): Fix the bug

Write a **minimal** code change (≤3 lines modified) to BatchedCache that eliminates the divergence found in Q2 while preserving the batched write behavior.

### Q5 (5 pts): Self-assessment with forced calibration

For each question Q1–Q4, rate:
- Your confidence (0-100%)
- One specific way you could be wrong
- Your predicted score for that question

Then give your total predicted score (out of 60).

**Your actual scores for the last 4 challenges:**
- C09: 28/52 (predicted 48, Δ=20)
- C10: 27/53 (predicted 46, Δ=19)
- C11: 30/56 (predicted 42, Δ=12)
- C12: 32/56 (predicted 51, Δ=19)

---

## Scoring Rubric

| Question | Points | Criteria |
|----------|--------|----------|
| Q1 Traces | 20 | 2 pts per correct get() return value (8 total), 3 pts per correct final store state (6 total), 6 pts for correct final stats |
| Q2 Divergences | 15 | 5 pts per correctly identified divergence + root cause |
| Q3 Bug analysis | 10 | 5 pts identify correct impl, 5 pts explain mechanism |
| Q4 Fix | 10 | 5 pts correct fix, 5 pts preserves batching |
| Q5 Calibration | 5 | Per-question confidence within 20% of actual accuracy: 1pt each, Total prediction within 5 pts: 1pt |
| **Total** | **60** | |

## Rules

- Show ALL intermediate state. Every get() must show the store contents before and after.
- For Implementation Y, always show pending array state and whether _flush() fires.
- Confidence ratings are mandatory — skip them and lose the calibration points automatically.
- Use exact values. "probably" / "I think" / "~" are not acceptable.

Good luck! 🗄️ Trace carefully — the devil is in the timing.
