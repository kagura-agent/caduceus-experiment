# Challenge 07 — Answer Key (DO NOT SHARE)

## Correct Answers

1. **TRUE** — `this.maxTokens = opts.maxTokens ?? 10;`
2. **FALSE** — New buckets start with `this.maxTokens` tokens (line: `tokens: this.maxTokens` in `_getOrCreate`)
3. **TRUE** — `bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd)` in `_refill`
4. **TRUE** — `retryAfter` = `Math.ceil(deficit / this.refillRate) * this.refillInterval` where refillInterval defaults to 1000ms
5. **TRUE** — `peek()` returns `this.maxTokens` if key not in map, and does NOT call `_getOrCreate`
6. **FALSE** — `reset()` calls `this.buckets.delete(key)` — it removes the bucket entirely, doesn't set tokens. Next `consume()` would create a fresh one, but `reset()` itself just deletes.
7. **TRUE** — `setInterval` used, `.unref()` called conditionally
8. **FALSE** — `stats()` returns `{ activeBuckets, maxTokens, refillRate }` — no `refillInterval`
9. **FALSE** — `lastRefill` is advanced by the accounted time: `bucket.lastRefill += Math.floor(elapsed / this.refillInterval) * this.refillInterval;` — NOT set to `Date.now()`
10. **TRUE** — `_getOrCreate` sets `bucket.lastAccess = Date.now()`, and `consume` calls `_getOrCreate`
11. **TRUE** — Default bucket has 10 tokens, consume 5 → `10 - 5 = 5`
12. **TRUE** — `this._cleanupAge = opts.cleanupAge ?? 60000;`
13. **TRUE** — Deficit = 12 - 10 = 2, `Math.ceil(2/1) * 1000 = 2000`
14. **TRUE** — First line of `startCleanup` is `this.stopCleanup();`
15. **TRUE** — `peek()` calls `this._refill(bucket)` before returning `bucket.tokens`

## Summary
- TRUE: 1, 3, 4, 5, 7, 10, 11, 12, 13, 14, 15 (11 statements)
- FALSE: 2, 6, 8, 9 (4 statements)
- UNKNOWN: 0 (all are determinable from source)

## Tricky Ones (likely confabulation traps)
- **#2**: Might assume new = empty. Actually starts full.
- **#6**: "Reset to maxTokens" sounds right, but it actually deletes. Functional outcome is similar (next consume creates full bucket) but the mechanism description is wrong.
- **#9**: Sounds plausible (many impls do `lastRefill = now`), but this one carefully avoids drift.
- **#8**: Might assume stats returns all config. It doesn't include refillInterval.

## What this tests
- **Careful reading vs. plausible guessing** — statements 2, 6, 9 sound right but aren't
- **No UNKNOWN trap** — all 15 are determinable. If Caduceus marks things UNKNOWN, it's either not reading carefully or hedging
- **Evidence requirement** — forces grounding in actual code, preventing vague explanations
