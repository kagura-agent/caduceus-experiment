# Challenge 13: Answer Key

## Q1: Trace Both Implementations (20 pts)

### SmartCache (X) — LRU eviction

| Time | Operation | Store after | Return |
|------|-----------|-------------|--------|
| t=100 | set("alice") | {alice} | - |
| t=200 | set("bob") | {alice, bob} | - |
| t=300 | set("carol") | {alice, bob, carol} | - |
| t=400 | get("alice") | {bob, carol, alice} (alice moved to end) | "token-A" ✓ |
| t=500 | set("dave") | {carol, alice, dave} (evicts bob — first/oldest) | - |
| t=600 | get("bob") | {carol, alice, dave} | undefined (miss) |
| t=700 | get("carol") | {alice, dave, carol} (carol moved to end) | "token-C" ✓ |
| t=800 | set("eve") | {dave, carol, eve} (evicts alice — first/oldest) | - |
| t=900 | get("dave") | {carol, eve, dave} (dave moved to end) | "token-D" ✓ |
| t=1000 | getStats() | {carol, eve, dave} | hits:3, misses:1, hitRate:0.75, size:3 |

### BatchedCache (Y) — batched writes + LFU eviction

| Time | Operation | Pending after | Store after (key:accessCount) | Return |
|------|-----------|---------------|-------------------------------|--------|
| t=100 | set("alice") | [{alice}] | {} | - |
| t=200 | set("bob") | [{alice},{bob}] | {} | - |
| t=300 | set("carol") | [{alice},{bob},{carol}] → FLUSH (len≥3) | {alice:0, bob:0, carol:0} | - |
| t=400 | get("alice") | [] (flush, noop) | {alice:1, bob:0, carol:0} | "token-A" ✓ |
| t=500 | set("dave") | [{dave}] | {alice:1, bob:0, carol:0} | - |
| t=600 | get("bob") | [] → FLUSH [{dave}] | store before flush: {alice:1, bob:0, carol:0}. Flush dave: size=3≥3 → evict LFU. bob:0 and carol:0 tied, Map iteration finds bob first (minCount starts ∞, alice:1→min=1/alice, bob:0→min=0/bob, carol:0→0 not < 0). Evict bob. Store = {alice:1, carol:0, dave:0}. Then get("bob"): not found → **undefined (miss)** |
| t=700 | get("carol") | [] (flush noop) | {alice:1, carol:1, dave:0} | "token-C" ✓ |
| t=800 | set("eve") | [{eve}] | {alice:1, carol:1, dave:0} | - |
| t=900 | get("dave") | [] → FLUSH [{eve}]. Store before: {alice:1, carol:1, dave:0}. Flush eve: size=3≥3 → evict LFU. alice:1, carol:1, dave:0 → dave is min. Evict dave. Store = {alice:1, carol:1, eve:0}. Then get("dave"): not found → **undefined (miss)** |
| t=1000 | getStats() | flush noop | {alice:1, carol:1, eve:0} | hits:2, misses:2, hitRate:0.5, size:3 |

### Scoring (Q1: 20 pts)
- get("alice"): X=token-A, Y=token-A — both correct (2 pts each = 4)
- get("bob"): X=undefined, Y=undefined — both correct (2 pts each = 4)
- get("carol"): X=token-C, Y=token-C — both correct (2 pts each = 4)
- get("dave"): X=token-D, Y=undefined — key divergence (2 pts each = 4)
- Final store state X correct: 3 pts
- Final store state Y correct: 3 pts
- Final stats (X: 3/1/0.75/3, Y: 2/2/0.5/3): 6 pts

## Q2: Divergence Points (15 pts)

**There is exactly 1 operation where X and Y return different values:**

### Divergence at t=900: get("dave")
- **X returns:** "token-D" (hit)
- **Y returns:** undefined (miss)

**Root cause:** In Y, `set("eve")` at t=800 goes to `pending`. When `get("dave")` is called at t=900, `_flush()` fires first, materializing eve into the store. Since store is full (size=3), it must evict — and it evicts by LFU (least accessCount). Dave has accessCount=0 (it was just flushed from pending at t=600, never accessed), while alice and carol both have accessCount=1. So dave gets evicted *right before* the get tries to read it.

**The deadly pattern:** In BatchedCache, a set() followed by a get() of the *same key* can fail if another set() intervenes:
1. set("dave") → enters pending
2. get("bob") → triggers flush, dave enters store with accessCount=0
3. set("eve") → enters pending
4. get("dave") → triggers flush, eve needs to evict, dave has lowest accessCount → evicted before read

### Scoring (Q2: 15 pts)
- Correctly identifies 1 divergence point: 5 pts
- Correct values (X=token-D, Y=undefined): 5 pts
- Correct root cause (LFU evicts dave because set→flush→evict race): 5 pts

## Q3: Production Bug (10 pts)

**Implementation Y (BatchedCache) causes "users getting logged out unexpectedly."**

**Scenario:** User dave logs in (set("dave", token)). Before dave's next request, other users' requests trigger a flush that evicts dave's token (because dave has 0 accesses — his token was just written, never read). Dave's next request tries get("dave"), which triggers another flush that again evicts dave (or dave was already evicted by a previous flush triggered by someone else's get).

**The fundamental problem:** In Y, a freshly-written token starts with accessCount=0 and is immediately vulnerable to eviction. Between the write and the first read, any intervening set+get combo can evict it. This is a write-read race condition caused by the batched write + LFU eviction combination.

### Scoring (Q3: 10 pts)
- Identifies Y as the problematic one: 5 pts
- Explains the write→evict→miss race condition: 5 pts

## Q4: Fix (10 pts)

**Minimal fix: initialize accessCount to 1 instead of 0 in _flush()**

```javascript
// In _flush(), change:
this.store.set(item.key, { value: item.value, ts: item.ts, accessCount: 0 });
// To:
this.store.set(item.key, { value: item.value, ts: item.ts, accessCount: 1 });
```

This ensures newly-written entries aren't immediately the weakest eviction candidate. A key that was set (but not yet read) is treated as if it had been accessed once — equivalent to the write itself being a "use."

**Alternative valid fix:** Flush pending entries matching the get key before eviction check:
```javascript
get(key) {
  // Move matching pending entry to store first
  const idx = this.pending.findIndex(p => p.key === key);
  if (idx !== -1) {
    const [item] = this.pending.splice(idx, 1);
    this.store.set(item.key, { value: item.value, ts: item.ts, accessCount: 1 });
  }
  this._flush();
  // ... rest unchanged
}
```

### Scoring (Q4: 10 pts)
- Fix is correct (eliminates the divergence): 5 pts
- Fix preserves batched write behavior (still uses pending array): 5 pts
- Partial credit for identifying the right line but wrong fix: 2 pts

## Q5: Calibration Assessment (5 pts)

**Expected actual scores:**
- Q1: 14-18/20 (trace errors likely on Y's flush timing)
- Q2: 10-15/15 (may find the divergence but miss root cause details)
- Q3: 5-10/10 (likely correct if Q2 is correct)
- Q4: 5-8/10 (fix direction likely correct)
- Total expected: ~35-45/60

**Scoring:**
- Per-question confidence within 20% of actual accuracy: 1 pt each (4 pts)
- Total prediction within 5 pts of actual: 1 pt
