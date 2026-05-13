# Challenge 20: The Ledger — Safety vs Liveness in Transaction Processing

**Domain:** Simplified database transaction scheduler for a key-value store with 3 concurrent transactions.

## Setup

Three transactions execute concurrently on keys `{X, Y, Z}`, all initially `0`:

```
T1: R(X) → W(Y, X+1) → R(Z) → W(X, Z+2)
T2: R(Y) → W(Z, Y+3) → R(X) → W(Y, X*2)
T3: R(Z) → W(X, Z+5) → R(Y) → W(Z, Y-1)
```

Two scheduler implementations — identical except for lock management:

**StrictScheduler:**
```
acquire_lock(txn, key, mode):
    if key locked by another txn in conflicting mode:
        WAIT (block until released)
    grant lock
    
release_lock(txn, key):
    release only at COMMIT (strict 2PL)
    
on_deadlock_detected():
    DO NOTHING (wait forever)
```

**EagerScheduler:**
```
acquire_lock(txn, key, mode):
    if key locked by another txn in conflicting mode:
        if other_txn started BEFORE me:
            ABORT self, release all my locks, restart after random delay
        else:
            WAIT (other txn is younger, it should yield to me)
    grant lock
    
release_lock(txn, key):
    release only at COMMIT (strict 2PL)
```

## Questions

### Q1: Deadlock Analysis (15 pts)

Given this specific interleaving:
```
Step 1: T1.R(X) — T1 gets S-lock on X
Step 2: T2.R(Y) — T2 gets S-lock on Y  
Step 3: T3.R(Z) — T3 gets S-lock on Z
Step 4: T1.W(Y,X+1) — T1 requests X-lock on Y
Step 5: T2.W(Z,Y+3) — T2 requests X-lock on Z
Step 6: T3.W(X,Z+5) — T3 requests X-lock on X
```

For each scheduler:
a) Trace what happens at each step (lock grants, waits, aborts)
b) Does a deadlock form? If so, identify the cycle.
c) What is the final state of `{X, Y, Z}` (if execution completes)?

### Q2: Property Classification (10 pts)

Classify each property as SAFETY or LIVENESS. Justify by giving the formal "bad thing" or "good thing."

1. **Serializability:** Every concurrent execution is equivalent to some serial order of the transactions.
2. **Deadlock-freedom:** No set of transactions waits forever in a cycle.
3. **Starvation-freedom:** Every submitted transaction eventually commits.
4. **Recoverability:** If T_i reads a value written by T_j, then T_j commits before T_i.
5. **Progress:** At least one transaction commits within bounded time.

### Q3: Scheduler Comparison (20 pts)

a) Which scheduler guarantees serializability? Prove it. (8 pts)
b) Which scheduler guarantees deadlock-freedom? Prove it. (7 pts)  
c) Can any scheduler guarantee BOTH serializability AND starvation-freedom simultaneously for all possible workloads? Argue formally. (5 pts)

### Q4: Design a Better Scheduler (10 pts)

Design a scheduler that:
1. Guarantees serializability (safety)
2. Guarantees deadlock-freedom (liveness)
3. Provides bounded wait time for each transaction (starvation-freedom)

Specify the algorithm. Identify what tradeoff you're making.

### Q5: Calibration (5 pts)

Before answering, predict your score out of 60. Explain your prediction methodology.

---

**Total: 60 points**
