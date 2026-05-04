# Junior Dev's Answers — Please Review

## A1: Default penalty duration
**Question:** With default config, how long is the penalty duration in milliseconds?
**Junior's Answer:** The penalty duration is `windowMs * penaltyMultiplier` = 60000 × 1.5 = **90,000ms (90 seconds)**.
Found in `_applyPenalty()`: `const penaltyDuration = this.windowMs * this.penaltyMultiplier`.

---

## A2: Starter tier, 12,000 requests, 0 penalties — monthly bill
**Question:** A "starter" tier user makes 12,000 requests with no penalties. What's the total monthly bill?
**Junior's Answer:**
- Base: $9.99
- Usage: 12,000 × $0.001 = $12.00
- Utilization: 12,000/10,000 = 120% → no discount
- Total: $9.99 + $12.00 = **$21.99**

---

## A3: How many requests before penalty kicks in (default config)?
**Question:** With defaults, on request number N, the client gets penalized. What is N?
**Junior's Answer:** Penalty threshold = 0.9 × 100 = 90. The check is `requestCount >= maxRequests * penaltyThreshold`. Since the check runs *before* the increment in `tryRequest()`, the client must reach requestCount 90. That happens when the 91st request comes in. **N = 91**.

---

## A4: Token refill after 15 seconds idle (default config, starting from 0 tokens)
**Question:** Client has 0 tokens. After 15 seconds of no requests, how many tokens do they have?
**Junior's Answer:** Token refill rate = 2 per second. After 15 seconds: 15 × 2 = 30 tokens. But bucket size is 20, so capped at **20 tokens**.
Found in `_refillTokens()`: `Math.min(this.tokenBucketSize, client.tokens + newTokens)`.

---

## A5: Pro tier, 50,000 requests — usage cost only (not total bill)
**Question:** "pro" tier user, 50,000 requests. What is the usage cost (just `calculateUsageCost` return value)?
**Junior's Answer:** 50,000 ≤ 100,000 (pro maxRequests), so no overage.
Usage cost = 50,000 × $0.0005 = **$25.00**

---

## A6: Enterprise tier, 200,000 requests, 1 penalty — monthly bill
**Question:** Enterprise tier, 200,000 requests, 1 penalty. Total monthly bill?
**Junior's Answer:**
- Base: $199.99
- Usage: 200,000 × $0.002 = $400.00
- Penalties: 1 × $5.00 = $5.00
- Utilization: 200,000/Infinity = 0% < 50% → discount applies
- Subtotal: ($199.99 + $400.00 + $5.00) × 0.9 = $604.99 × 0.9 = **$544.49**

---

## A7: retryAfter when burst_limited (default config)
**Question:** When a client is burst_limited, what is the retryAfter value?
**Junior's Answer:** `retryAfter: 1000 / this.tokenRefillRate` = 1000 / 2 = **500ms**.

---

## A8: Starter tier, 3,000 requests, 2 penalties — monthly bill
**Question:** Starter tier, 3,000 requests, 2 penalties. Full monthly bill breakdown?
**Junior's Answer:**
- Base: $9.99
- Usage: 3,000 × $0.001 = $3.00 (within tier limit)
- Penalties: 2 × $5.00 = $10.00
- Utilization: 3,000/10,000 = 30% → no discount (below usage threshold)
- Total: $9.99 + $3.00 + $10.00 = **$22.99**

---

## A9: Refund — pro tier, 80,000 requests, used 10 days of 30
**Question:** Pro tier user, 80,000 requests, cancel after 10 days. What refund?
**Junior's Answer:**
- Monthly bill: base $49.99, usage 80,000 × $0.0005 = $40.00, penalties $0
- Utilization: 80,000/100,000 = 80% → no discount
- Subtotal: $49.99 + $40.00 = $89.99
- Daily rate: $89.99 / 30 = $3.00
- Remaining: 20 days
- Raw refund: $3.00 × 20 = $60.00
- 80% cap: $89.99 × 0.8 = $71.99
- $60.00 < $71.99 → actual refund: **$60.00**

---

## A10: recommendTier for 8,000 monthly requests
**Question:** What tier does `recommendTier(8000)` return and at what estimated cost?
**Junior's Answer:**
- Free (8000 reqs): base $0, usage = $0 (price $0/req). Total = **$0**
- Starter (8000 reqs): base $9.99, usage 8000 × $0.001 = $8.00. Util 80% → no discount. Total = **$17.99**
- Pro: base $49.99, usage 8000 × $0.0005 = $4.00. Util 8% < 50% → discount! ($49.99 + $4.00) × 0.9 = **$48.59**
- Enterprise: base $199.99, usage 8000 × $0.0002 = $1.60. Util ~0% → discount. ($199.99 + $1.60) × 0.9 = **$181.43**
- Cheapest: free at $0 → **{ tier: 'free', estimatedCost: 0 }**
