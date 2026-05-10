# Challenge 15: The Leaky Bucket 🪣

## Background

You're reviewing a rate limiter for an API gateway. Two implementations exist: a **Token Bucket** (X) and a **Sliding Window** (Y). Both claim to limit requests to `maxRequests` per `windowMs`, but production metrics show one implementation allows 2x the intended rate during burst traffic.

Your job: trace both, find the burst vulnerability, **prove why** the fix works — not just show that it does.

## Source Code

```javascript
// Implementation X: "TokenBucket"
class TokenBucket {
  constructor(maxTokens, refillRate, refillIntervalMs) {
    this.maxTokens = maxTokens;       // max tokens in bucket
    this.tokens = maxTokens;          // start full
    this.refillRate = refillRate;     // tokens added per refill
    this.refillIntervalMs = refillIntervalMs;
    this.lastRefill = 0;
  }

  tick(t) {
    const elapsed = t - this.lastRefill;
    const refills = Math.floor(elapsed / this.refillIntervalMs);
    if (refills > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + refills * this.refillRate);
      this.lastRefill += refills * this.refillIntervalMs;
    }
  }

  request(t) {
    this.tick(t);
    if (this.tokens > 0) {
      this.tokens--;
      return { allowed: true, remaining: this.tokens };
    }
    return { allowed: false, remaining: 0, retryAfter: this.refillIntervalMs - (t - this.lastRefill) };
  }

  getState(t) {
    this.tick(t);
    return { tokens: this.tokens, lastRefill: this.lastRefill };
  }
}

// Implementation Y: "SlidingWindow"
class SlidingWindow {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.log = [];                    // [{timestamp}]
    this.previousCount = 0;           // requests in previous window
    this.currentCount = 0;            // requests in current window
    this.windowStart = 0;             // start of current window
  }

  _advance(t) {
    while (t >= this.windowStart + this.windowMs) {
      this.previousCount = this.currentCount;
      this.currentCount = 0;
      this.windowStart += this.windowMs;
    }
  }

  _effectiveCount(t) {
    const elapsed = t - this.windowStart;
    const weight = 1 - (elapsed / this.windowMs);
    return Math.floor(this.previousCount * weight + this.currentCount);
  }

  request(t) {
    this._advance(t);
    const effective = this._effectiveCount(t);
    if (effective < this.maxRequests) {
      this.log.push({ timestamp: t });
      this.currentCount++;
      return { allowed: true, remaining: this.maxRequests - effective - 1 };
    }
    return { allowed: false, remaining: 0 };
  }

  getState(t) {
    this._advance(t);
    return {
      windowStart: this.windowStart,
      previousCount: this.previousCount,
      currentCount: this.currentCount,
      effectiveCount: this._effectiveCount(t),
      logSize: this.log.length
    };
  }
}
```

## Scenario

**X config:** `maxTokens = 5, refillRate = 1, refillIntervalMs = 200` (5 tokens, refill 1 per 200ms)
**Y config:** `maxRequests = 5, windowMs = 1000` (5 requests per 1000ms window)

Both should limit to ~5 requests per second. Operations:

```
t=0:    request()       // R1
t=50:   request()       // R2
t=100:  request()       // R3
t=150:  request()       // R4
t=200:  request()       // R5
t=250:  request()       // R6 — at limit?
t=400:  request()       // R7
t=600:  request()       // R8
t=800:  request()       // R9
t=999:  request()       // R10 — end of "first second"
t=1000: request()       // R11 — new window starts
t=1001: request()       // R12
t=1050: request()       // R13
t=1100: request()       // R14
t=1150: request()       // R15
t=1200: getState()
```

---

## Questions

### Q1 (15 pts): Trace both implementations

For each request, show:
- **X:** tokens before request, allowed/denied, tokens after, lastRefill value
- **Y:** windowStart, previousCount, currentCount, effectiveCount (show the weighted calculation), allowed/denied

Trace every request mechanically. Show the arithmetic for Y's `_effectiveCount`.

### Q2 (10 pts): Where do they diverge?

Identify every request where X and Y give different allowed/denied results. For each:
1. State what X returns vs what Y returns
2. Explain the mechanism difference that causes it

### Q3 (15 pts): The burst vulnerability — PROVE it

One implementation allows a burst of up to 2x the intended rate within a short period.

1. **Identify** which implementation has the vulnerability and the exact request sequence that demonstrates it
2. **Prove** the vulnerability exists by calculating the exact request count within a 1-second sliding window at the worst case
3. **Explain** the mathematical property that makes this inevitable with this design (not just "it happens because..." — state the invariant that's violated)

### Q4 (15 pts): Fix with proof

Write a fix (≤10 lines changed) and then:
1. **State the safety invariant** your fix maintains (in the form: "For all time intervals [t, t+W], the number of allowed requests is ≤ N")
2. **Prove** your fix maintains this invariant. Not "it should work because..." — show why the worst case is now bounded. Walk through the same burst scenario with your fix applied.
3. **Explain** what your fix trades away (every fix has a cost — what's the tradeoff?)

### Q5 (5 pts): Self-assessment

Predict your total score (out of 60). Given your C14 results:
- Your tracing is reliable (Q1/Q2 should be strong)
- This challenge weights design justification heavily (Q3/Q4 = 30 pts)
- The "prove it" requirement is new — assertion ≠ proof

**Your scores:**
- C09: 28/52 (54%)
- C10: 27/53 (51%)
- C11: 30/56 (54%)
- C12: 32/56 (57%)
- C13: 57/60 (95%)
- C14: 52/60 (87%)

---

## Scoring Rubric

| Question | Points | Criteria |
|----------|--------|----------|
| Q1 Traces | 15 | 1 pt per correct request result (15 total), bonus for showing Y's weighted calc |
| Q2 Divergences | 10 | 2.5 pts per correctly identified divergence + root cause |
| Q3 Proof of vulnerability | 15 | 5 pts identify correct implementation, 5 pts exact calculation, 5 pts mathematical explanation |
| Q4 Fix with proof | 15 | 3 pts correct fix, 4 pts stated invariant, 4 pts proof walkthrough, 4 pts tradeoff analysis |
| Q5 Calibration | 5 | Within 5 pts: 5, within 10: 3, else 0 |
| **Total** | **60** | |

## Rules

- Show ALL arithmetic for Y's weighted calculation. `_effectiveCount` is where bugs hide.
- "Prove" means walk through the math. "It works because it limits requests" is not a proof.
- `Math.floor` in `_effectiveCount` is important. Don't round differently.
- When stating invariants, be precise about the time window definition.

Good luck! 🪣 The traces are the easy part now — the proofs are where this gets interesting.
