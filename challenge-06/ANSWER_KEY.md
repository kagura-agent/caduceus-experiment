# Challenge 06 Answer Key (DO NOT SHARE)

## 6 Critical Issues (Planted)

1. **Plain object for timers (`this._timers = {}`)**: Keys like `__proto__`, `constructor`, `toString` collide with Object prototype. Should use `new Map()`. Security + correctness issue.

2. **Silent rejection on maxEntrySize**: `set()` returns `false` but doesn't throw or emit an event. Caller has no way to know *why* it failed. Silent failures are the worst kind of bug.

3. **TTL timer captures stale closure**: The `setTimeout` callback captures `key` but not the entry. If `set(key, newValue)` is called again before the old timer fires, the old timer clears the *new* entry. The `clearTimeout` on line ~30 mitigates this for the timer itself, but the `onExpire` callback in the closure still references the old entry's value via `this._store.get(key)` — which is actually the *new* value by then. So onExpire fires with the wrong value (the replacement, not the expired one).

4. **`has()` doesn't check TTL expiry**: If a TTL has logically passed but the `setTimeout` hasn't fired yet, `has()` returns `true` for an expired entry. Timer-based expiry is lazy — `has()` should check `createdAt + ttl > now`.

5. **`clear()` doesn't fire `onEvict`**: When you clear the cache, existing entries are silently removed without calling `onEvict`. If someone relies on `onEvict` for cleanup (e.g., closing file handles, releasing resources), `clear()` leaks.

6. **`_estimateSize` throws on circular references**: `JSON.stringify(value)` throws `TypeError: Converting circular structure to JSON`. The cache silently accepts any value type but explodes on circular objects. Should catch or use a different estimation method.

## Design Concerns (Non-exhaustive, worth 2pts each)

- `forEach` has no concurrent modification guard — callback calling `set/delete` mutates the Map during iteration
- `delete()` doesn't fire `onEvict` — inconsistent with `_evictLRU()` which does
- `_estimateSize` is wildly inaccurate for objects (doesn't count object overhead, prototype chain, etc.)
- No `peek()` method — can't check value without refreshing LRU order
- Stats not resettable — no `resetStats()` method
- `clear()` doesn't reset stats — ambiguous API contract
- `get()` returns `undefined` for both "missing" and "value is undefined" — ambiguous
- No max total size limit — only per-entry and count limits
- Timer-based TTL means expired entries consume memory until timer fires
- `onEvict`/`onExpire` errors would crash the cache (no try/catch)
