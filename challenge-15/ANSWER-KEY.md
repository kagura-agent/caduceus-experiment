# Challenge 15: Answer Key 🪣

## Q1: Traces (15 pts)

### X (TokenBucket): maxTokens=5, refillRate=1, refillIntervalMs=200

| # | t | tokens before | tick refills | tokens after tick | allowed? | tokens after | lastRefill |
|---|---|---|---|---|---|---|---|
| R1 | 0 | 5 | 0 (elapsed=0) | 5 | ✅ yes | 4 | 0 |
| R2 | 50 | 4 | 0 (elapsed=50) | 4 | ✅ yes | 3 | 0 |
| R3 | 100 | 3 | 0 (elapsed=100) | 3 | ✅ yes | 2 | 0 |
| R4 | 150 | 2 | 0 (elapsed=150) | 2 | ✅ yes | 1 | 0 |
| R5 | 200 | 1 | 1 (elapsed=200, refills=1) | 2 | ✅ yes | 1 | 200 |
| R6 | 250 | 1 | 0 (elapsed=50) | 1 | ✅ yes | 0 | 200 |
| R7 | 400 | 0 | 1 (elapsed=200, refills=1) | 1 | ✅ yes | 0 | 400 |
| R8 | 600 | 0 | 1 (elapsed=200, refills=1) | 1 | ✅ yes | 0 | 600 |
| R9 | 800 | 0 | 1 (elapsed=200, refills=1) | 1 | ✅ yes | 0 | 800 |
| R10 | 999 | 0 | 0 (elapsed=199) | 0 | ❌ no | 0 | 800 |
| R11 | 1000 | 0 | 1 (elapsed=200, refills=1) | 1 | ✅ yes | 0 | 1000 |
| R12 | 1001 | 0 | 0 (elapsed=1) | 0 | ❌ no | 0 | 1000 |
| R13 | 1050 | 0 | 0 (elapsed=50) | 0 | ❌ no | 0 | 1000 |
| R14 | 1100 | 0 | 0 (elapsed=100) | 0 | ❌ no | 0 | 1000 |
| R15 | 1150 | 0 | 0 (elapsed=150) | 0 | ❌ no | 0 | 1000 |
| getState | 1200 | 0 | 1 (elapsed=200) | 1 | — | — | 1200 |

**X totals: 10 allowed (R1-R9, R11), 5 denied (R10, R12-R15)**

**getState(1200):** { tokens: 1, lastRefill: 1200 }

### Y (SlidingWindow): maxRequests=5, windowMs=1000

**R1 (t=0):** _advance: no change. elapsed=0, weight=1.0. effective=floor(0×1.0 + 0)=0. 0<5→✅. currentCount=1.
- State: windowStart=0, prevCount=0, currCount=1

**R2 (t=50):** elapsed=50, weight=0.95. effective=floor(0×0.95 + 1)=floor(1)=1. 1<5→✅. currCount=2.

**R3 (t=100):** elapsed=100, weight=0.9. effective=floor(0×0.9 + 2)=floor(2)=2. 2<5→✅. currCount=3.

**R4 (t=150):** elapsed=150, weight=0.85. effective=floor(0×0.85 + 3)=floor(3)=3. 3<5→✅. currCount=4.

**R5 (t=200):** elapsed=200, weight=0.8. effective=floor(0×0.8 + 4)=floor(4)=4. 4<5→✅. currCount=5.

**R6 (t=250):** elapsed=250, weight=0.75. effective=floor(0×0.75 + 5)=floor(5)=5. 5<5? No→❌.

**R7 (t=400):** elapsed=400, weight=0.6. effective=floor(0×0.6 + 5)=floor(5)=5. ❌.

**R8 (t=600):** elapsed=600, weight=0.4. effective=floor(0×0.4 + 5)=floor(5)=5. ❌.

**R9 (t=800):** elapsed=800, weight=0.2. effective=floor(0×0.2 + 5)=floor(5)=5. ❌.

**R10 (t=999):** elapsed=999, weight=0.001. effective=floor(0×0.001 + 5)=floor(5)=5. ❌.

**R11 (t=1000):** _advance: 1000≥0+1000→yes. previousCount=5, currentCount=0, windowStart=1000. 1000≥2000? No, stop.
elapsed=0, weight=1.0. effective=floor(5×1.0 + 0)=5. 5<5? No→❌.

**R12 (t=1001):** _advance: no change. elapsed=1, weight=1-1/1000=0.999. effective=floor(5×0.999 + 0)=floor(4.995)=4. 4<5→✅. currCount=1.

**R13 (t=1050):** elapsed=50, weight=0.95. effective=floor(5×0.95 + 1)=floor(4.75+1)=floor(5.75)=5. ❌.

**R14 (t=1100):** elapsed=100, weight=0.9. effective=floor(5×0.9 + 1)=floor(4.5+1)=floor(5.5)=5. ❌.

**R15 (t=1150):** elapsed=150, weight=0.85. effective=floor(5×0.85 + 1)=floor(4.25+1)=floor(5.25)=5. ❌.

**getState(1200):** _advance: no. elapsed=200, weight=0.8. effectiveCount=floor(5×0.8+1)=floor(5)=5.
{ windowStart:1000, previousCount:5, currentCount:1, effectiveCount:5, logSize:6 }

**Y totals: 6 allowed (R1-R5, R12), 9 denied**

---

## Q2: Divergences (10 pts)

| Request | X | Y | Cause |
|---------|---|---|-------|
| R6 (t=250) | ✅ allowed (1 token from R5 refill) | ❌ denied (effective=5) | X refilled 1 token at t=200; Y's currentCount=5 fills the effective budget |
| R7 (t=400) | ✅ allowed (1 refill at t=400) | ❌ denied (effective=5) | X gets steady refills; Y is locked at effective=5 for the whole window because previousCount=0 and currentCount=5 |
| R8 (t=600) | ✅ allowed (1 refill at t=600) | ❌ denied (effective=5) | Same: X refills 1 per 200ms; Y still effective=5 |
| R9 (t=800) | ✅ allowed (1 refill at t=800) | ❌ denied (effective=5) | Same pattern |
| R11 (t=1000) | ✅ allowed (1 refill at t=1000) | ❌ denied (effective=5, window just rolled) | X gets a refill; Y just rolled window — previousCount=5, weight=1.0 → effective=5 |
| R12 (t=1001) | ❌ denied (0 tokens) | ✅ allowed (effective=4 after floor) | X has no tokens (just used at t=1000); Y's weight=0.999 → floor(4.995)=4 < 5 |

**6 divergence points total.**

**Root cause summary:** X (TokenBucket) is more permissive — it allows steady 1-per-200ms requests after the initial burst. Y (SlidingWindow) is more restrictive during a window because once currentCount=5, effective stays at 5 regardless of weight (since previousCount=0 in the first window). The R12 flip (Y allows, X denies) shows a timing anomaly: Y's Math.floor drops the weighted previous count just enough to admit one request right after window rollover.

---

## Q3: The burst vulnerability — PROOF (15 pts)

### Which implementation? X (TokenBucket)

### The burst
X allows **10 requests in a 1-second interval [0, 1000]**: R1-R9 (t=0 through t=800) + R11 (t=1000). That's **2× the intended rate of 5/sec**.

### Exact calculation
At t=0: 5 tokens available (bucket starts full).
- R1-R4 consume 4 tokens at t=0,50,100,150 (no refills yet, lastRefill=0).
- R5 at t=200: 1 refill (elapsed=200, floor(200/200)=1), tokens go 1→2, consume→1.
- R6 at t=250: 0 refills, consume last token→0.
- R7 at t=400: 1 refill, 0→1→0.
- R8 at t=600: 1 refill, 0→1→0.
- R9 at t=800: 1 refill, 0→1→0.
- R10 at t=999: 0 refills (elapsed=199<200), DENIED.
- R11 at t=1000: 1 refill (elapsed=200), 0→1→0.

**Total allowed in [0, 1000]: 10 = 5 (initial burst) + 5 (refills at 200,400,600,800,1000)**

### The mathematical property (invariant violation)

The intended invariant: "In any 1-second window, at most 5 requests are allowed."

Token bucket violates this because the maximum requests in any window of duration W is:

**max_requests = maxTokens + floor(W / refillIntervalMs) × refillRate**

For our config: **5 + floor(1000/200) × 1 = 5 + 5 = 10**

The bucket capacity (maxTokens=5) acts as a **burst allowance on top of the sustained rate**. The sustained rate alone is 5/sec (1 per 200ms), but the full bucket adds a one-time burst of 5, for a combined 10 in the first second. This is inherent to any token bucket where maxTokens > refillRate: the burst capacity is additive with the sustained rate.

**This is not a bug in the implementation — it's a property of the algorithm.** Token buckets are designed to allow controlled bursts. The "bug" is the configuration: setting maxTokens=5 with a 5/sec refill rate means the actual peak rate is 10/sec, which is 2× the intended limit.

After the initial burst drains the bucket, the sustained rate drops to 5/sec (1 per 200ms). The 2× burst repeats whenever the bucket fully refills (after 1 second of no requests).

---

## Q4: Fix with proof (15 pts)

### The fix (2 lines changed)

```javascript
constructor(maxTokens, refillRate, refillIntervalMs) {
    this.maxTokens = 1;               // CHANGED: cap burst to 1 refill worth
    this.tokens = 0;                  // CHANGED: start empty, no initial burst
    this.refillRate = refillRate;
    this.refillIntervalMs = refillIntervalMs;
    this.lastRefill = 0;
}
```

### Safety invariant

**For any time interval [t, t+1000], the number of allowed requests is ≤ 6.**

(With maxTokens=1: max = 1 (burst) + floor(1000/200)×1 = 1 + 5 = 6. Starting with tokens=0 means the first second is exactly 5.)

For strict ≤ 5: set `this.tokens = 0` AND keep `this.maxTokens = 1`:
- First second (cold start): 0 initial + 5 refills = 5 ✅
- Any subsequent second after idle: 1 (stored from last refill) + 4 (refills during the second) ≤ 5... Actually with maxTokens=1, after being idle for 2 seconds: tokens = min(1, accumulated) = 1. Then in the next 1 second: 1 + 5 refills = 6. So strict 5 is impossible with token bucket unless maxTokens=0.

**Stricter fix (1 line):**
```javascript
this.tokens = 0;    // start empty
this.maxTokens = 0; // no burst accumulation at all
```
Wait — if maxTokens=0, tokens can never exceed 0, so no request is ever allowed. That breaks everything.

**Correct strict fix:**
```javascript
// Replace constructor body:
this.maxTokens = refillRate;          // burst = 1 refill period worth
this.tokens = 0;                      // no startup burst
```

With maxTokens=1, tokens=0: The first window gets exactly 5 (refills at 200,400,600,800,1000). After a long idle, bucket fills to 1, so next window gets 1+5=6. This is the token bucket tradeoff: allowing micro-burst (1 extra) prevents starvation gaps.

### Proof walkthrough (same scenario, with fix applied)

Starting state: tokens=0, lastRefill=0, maxTokens=1.

- R1 (t=0): tick: elapsed=0, no refill. tokens=0→DENIED.
- R2 (t=50): elapsed=50, no refill. tokens=0→DENIED.
- R3 (t=100): elapsed=100, no refill. tokens=0→DENIED.
- R4 (t=150): elapsed=150, no refill. tokens=0→DENIED.
- R5 (t=200): elapsed=200, refills=1. tokens=min(1,0+1)=1→allowed, tokens=0. lastRefill=200.
- R6 (t=250): elapsed=50, no refill. tokens=0→DENIED.
- R7 (t=400): elapsed=200, refills=1. tokens=min(1,0+1)=1→allowed, tokens=0. lastRefill=400.
- R8 (t=600): refills=1→allowed.
- R9 (t=800): refills=1→allowed.
- R10 (t=999): elapsed=199, no refill→DENIED.
- R11 (t=1000): refills=1→allowed.

**Fixed X total in [0,1000]: 5 allowed (R5,R7,R8,R9,R11).** ✅

Maximum in any 1-second window: maxTokens + floor(1000/refillIntervalMs) × refillRate = 1 + 5 = 6.
With cold start (tokens=0): exactly 5 in first second.

### Tradeoff

1. **No burst tolerance.** The original design allowed 5 immediate requests for bursty clients. The fix forces clients to wait for refill intervals. Latency-sensitive applications lose responsiveness.
2. **Startup delay.** With tokens=0, the first request must wait up to 200ms. The original allowed immediate service.
3. **Still not perfectly tight.** After a quiet period, the bucket refills to maxTokens=1, allowing 6 in the next second. Perfect 5/sec requires a different algorithm (like Y's sliding window), not a configuration fix.

---

## Q5: Calibration (5 pts)

Expected strong submissions: 45-55/60. The trace is straightforward (Q1/Q2), but Q3's proof and Q4's invariant walkthrough are where points are earned or lost.

Scoring the prediction: |predicted - actual| ≤ 5 → 5pts, ≤ 10 → 3pts, else 0pts.
