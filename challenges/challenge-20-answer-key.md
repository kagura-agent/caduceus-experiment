# Challenge 20 Answer Key — The Ledger

## Q1: Deadlock Analysis (15 pts)

### StrictScheduler

| Step | Action | Lock State | Result |
|------|--------|-----------|--------|
| 1 | T1.R(X) | X: S(T1) | Granted |
| 2 | T2.R(Y) | X: S(T1), Y: S(T2) | Granted |
| 3 | T3.R(Z) | X: S(T1), Y: S(T2), Z: S(T3) | Granted |
| 4 | T1.W(Y) | T1 requests X-lock on Y → **WAIT** (T2 holds S on Y) | T1 blocked on T2 |
| 5 | T2.W(Z) | T2 requests X-lock on Z → **WAIT** (T3 holds S on Z) | T2 blocked on T3 |
| 6 | T3.W(X) | T3 requests X-lock on X → **WAIT** (T1 holds S on X) | T3 blocked on T1 |

**Deadlock: T1 → T2 → T3 → T1** (circular wait)

No transaction completes. Final state: undefined / system hangs. (5 pts)

### EagerScheduler

Assume start order: T1 < T2 < T3 (T1 oldest).

| Step | Action | Result |
|------|--------|--------|
| 1-3 | Same as Strict | All S-locks granted |
| 4 | T1.W(Y) → T1 requests X-lock on Y; T2 holds S on Y. T2 started AFTER T1 → T1 WAITs (younger T2 should yield). But T1 is older, so actually: T2 is younger than T1, so T1 waits? No — re-read the rule: "if other_txn started BEFORE me: ABORT self". T1 checks T2: T2 started after T1, so T2 did NOT start before T1. Go to else: WAIT. T1 waits for T2. |
| 5 | T2.W(Z) → T2 requests X-lock on Z; T3 holds S on Z. T3 started AFTER T2 → T2 WAITs for T3. |
| 6 | T3.W(X) → T3 requests X-lock on X; T1 holds S on X. T1 started BEFORE T3 → **T3 ABORTs**, releases S(Z). |

After T3 aborts:
- T2's wait on Z resolves → T2 gets X-lock on Z
- T2 completes: W(Z, 0+3=3), R(X)→0, W(Y, 0*2=0) → COMMIT
- T2 releases all locks
- T1's wait on Y resolves → T1 gets X-lock on Y
- T1 completes: W(Y, 0+1=1), R(Z)→3, W(X, 3+2=5) → COMMIT
- T3 restarts, runs serially: R(Z)→3, W(X, 3+5=8), R(Y)→1, W(Z, 1-1=0) → COMMIT

**Final state: X=8, Y=1, Z=0** (equivalent to serial order T2→T1→T3) (5 pts)

**Scoring:**
- Correct Strict deadlock identification + cycle: 5 pts
- Correct Eager trace (abort decision, who aborts, completion order): 5 pts
- Correct final values for Eager: 5 pts
- Partial credit: correct deadlock but wrong cycle (-2), correct mechanism but wrong values (-2)

## Q2: Property Classification (10 pts, 2 each)

1. **Serializability → SAFETY.** Bad thing: an execution that is NOT equivalent to any serial order. Once a non-serializable prefix exists, no extension fixes it.

2. **Deadlock-freedom → LIVENESS.** Good thing: eventually some blocked transaction makes progress. It's about eventual resolution, not absence of a bad state. (Note: "no cycle" sounds safety-like, but the actual property is about the system eventually resolving — a system with no current deadlock but that will inevitably deadlock hasn't violated anything YET.)

   *Acceptable alternative:* Deadlock-freedom can be argued as SAFETY if formalized as "no reachable state contains a wait-cycle." Award full credit for either classification IF the justification is consistent with the formalization. The key insight is that the classification depends on formalization.

3. **Starvation-freedom → LIVENESS.** Good thing: every transaction eventually commits. Cannot be violated in finite prefix.

4. **Recoverability → SAFETY.** Bad thing: T_i commits after reading T_j's uncommitted write, and T_j later aborts. Once this happens, no extension fixes it.

5. **Progress → LIVENESS.** Good thing: at least one commit happens. Cannot be violated in finite time — the system might just be slow.

## Q3: Scheduler Comparison (20 pts)

### 3a: Serializability (8 pts)

**Both schedulers guarantee serializability.**

Proof: Both use strict 2PL (locks held until commit). By the serializability theorem, any schedule produced by strict 2PL is conflict-serializable. The serialization order is determined by the commit order.

- StrictScheduler: trivially serializable (if it completes, which it may not due to deadlock)
- EagerScheduler: abort-restart doesn't affect serializability — aborted transactions are as if they never ran; the restarted version acquires new locks under 2PL

Deduction for "only one guarantees it": -4. Both do, by the fundamental 2PL theorem.

### 3b: Deadlock-freedom (7 pts)

**EagerScheduler guarantees deadlock-freedom. StrictScheduler does not.**

EagerScheduler proof: The wait-for graph can only have edges from older to younger (a younger transaction that encounters an older holder aborts itself rather than waiting). Since "older than" is a total order and acyclic, the wait-for graph is a DAG → no cycles → no deadlock.

StrictScheduler counterexample: Q1 demonstrates a deadlock.

### 3c: Serializability + Starvation-freedom (5 pts)

**No scheduler can guarantee both for ALL workloads** — but the impossibility is subtle.

Key argument: Under strict 2PL + wound-wait (like EagerScheduler), a transaction that keeps getting aborted (because it's always the youngest) can starve. Starvation-freedom requires that even the youngest transaction eventually commits. This CAN be achieved with timestamp aging (restarted transactions keep their original timestamp), making wound-wait starvation-free.

**Expected answer:** It IS possible with wound-wait + original timestamps. Full credit for recognizing this and explaining the mechanism. Partial credit (-2) for claiming impossibility without nuance. The tension is real (younger transactions sacrifice for serializability) but resolvable.

## Q4: Better Scheduler (10 pts)

**Expected: Wound-Wait with timestamp preservation**

Algorithm:
1. Each transaction gets a timestamp at first submission (kept across restarts)
2. Lock conflict: if requester is older → wound (abort) the holder; if requester is younger → wait
3. Strict 2PL: all locks held until commit
4. Aborted transactions restart with ORIGINAL timestamp (so they age and eventually become oldest)

Properties:
- **Serializability:** Strict 2PL (same as both original schedulers)
- **Deadlock-freedom:** Wait-for edges only from younger to older → acyclic
- **Starvation-freedom:** A transaction's timestamp never increases → after enough aborts, it becomes the oldest and will never be aborted again → guaranteed to eventually commit

**Tradeoff:** Higher abort rate (aggressive wounding), wasted work from aborted transactions, potential priority inversion for long-running old transactions.

Scoring:
- Correct algorithm: 4 pts
- Serializability proof: 2 pts  
- Deadlock-freedom proof: 2 pts
- Starvation-freedom argument: 2 pts
- Partial credit for correct algorithm without proofs: 5 pts

## Q5: Calibration (5 pts)

5 pts: prediction within 5% of actual score
3 pts: prediction within 10%
1 pt: prediction within 15%
0 pts: prediction off by >15%

Bonus consideration: methodology quality (process-based vs vibes-based prediction)
