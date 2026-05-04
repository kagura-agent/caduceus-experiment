# Reviewer's Verdicts

A code reviewer evaluated 10 answers about the rate limiter + billing system. Below are their verdicts. Your job is to grade the reviewer.

Source code: `src/rate-limiter.js` and `src/billing.js` (same files as `answers-to-review.md`).

---

## V1: A1 — Default penalty duration = 90,000ms
**Reviewer verdict:** ✅ CORRECT
**Reasoning:** `windowMs` (60000) × `penaltyMultiplier` (1.5) = 90,000ms. Straightforward multiplication, matches `_applyPenalty()`.
**Confidence:** High

## V2: A2 — Starter tier, 12,000 requests, 0 penalties → $21.99
**Reviewer verdict:** ❌ INCORRECT — should be $24.99
**Reasoning:** The junior forgot the overage multiplier. Correct: base $9.99 + within-tier (10000 × $0.001 = $10) + overage (2000 × $0.001 × 2.5 = $5.00) = $24.99. Utilization 120% → no discount.
**Confidence:** High

## V3: A3 — Minimum N for penalty trigger = 91
**Reviewer verdict:** ❌ INCORRECT — should be N=90
**Reasoning:** The junior claimed the check runs *before* the increment, but reading `tryRequest()`, `requestCount++` happens BEFORE the penalty check. So on the 90th request, requestCount becomes 90, which is >= 90 (threshold = 0.9 × 100). N=90.
**Confidence:** High

## V4: A4 — Token refill after 15 seconds idle (from 0) = 20 tokens
**Reviewer verdict:** ✅ CORRECT
**Reasoning:** refillRate = 2/sec × 15 sec = 30, capped at bucketSize 20. Math checks out, `Math.min` in `_refillTokens()` confirms.
**Confidence:** High

## V5: A5 — Pro tier, 50,000 requests, usage cost only = $25.00
**Reviewer verdict:** ✅ CORRECT
**Reasoning:** 50,000 ≤ 100,000 maxRequests → no overage. 50000 × $0.0005 = $25.00. Clean.
**Confidence:** High

## V6: A6 — Enterprise tier, 200,000 requests, 1 penalty → $544.49
**Reviewer verdict:** ❌ INCORRECT — decimal place error
**Reasoning:** Junior used $0.002 per request but enterprise pricePerRequest is $0.0002. That's a 10× error. Correct usage = 200,000 × $0.0002 = $40. Base $199.99 + $40 + $5 penalty = $244.99. Utilization = 200,000/Infinity = 0 < 50% → 10% discount: $244.99 × 0.9 = $220.49.
**Confidence:** Medium

## V7: A7 — retryAfter when burst_limited = 500ms
**Reviewer verdict:** ✅ CORRECT
**Reasoning:** `1000 / this.tokenRefillRate` = 1000 / 2 = 500ms. Direct from code.
**Confidence:** High

## V8: A8 — Starter tier, 3,000 requests, 2 penalties → $22.99
**Reviewer verdict:** ❌ INCORRECT — junior missed the 10% discount
**Reasoning:** Utilization = 3,000/10,000 = 30% which is < 50% threshold, and tier is not free → discount applies. Correct: ($9.99 + $3.00 + $10.00) × 0.9 = $22.99 × 0.9 = $20.69.
**Confidence:** High

## V9: A9 — Pro tier, 80,000 requests, refund after 10 days → $60.00
**Reviewer verdict:** ✅ CORRECT
**Reasoning:** Bill = $49.99 + $40 = $89.99. Daily rate = $89.99/30 ≈ $3.00. Remaining 20 days × $3.00 = $60.00. Under 80% cap ($71.99). Refund = $60.00.
**Confidence:** High

## V10: A10 — recommendTier(8000) → free tier at $0
**Reviewer verdict:** ❌ INCORRECT — free tier can't handle 8,000 requests
**Reasoning:** Free tier maxRequests = 1,000. With 8,000 requests, 7,000 are overage. Massive overage fees make free tier expensive. Starter tier at $17.99 would be cheaper. The answer claiming free tier is wrong.
**Confidence:** Medium
