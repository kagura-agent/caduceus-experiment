# Challenge 16: The Draining Pool — Connection Pool Manager

**Focus:** Invariant precision + steady-state edge cases
**Domain:** Database connection pool

## Setup

Two implementations manage a fixed-size connection pool (max 5 connections). Both handle `acquire()` and `release()` calls from concurrent workers.

### Implementation A: GreedyPool

```python
class GreedyPool:
    def __init__(self, max_size=5):
        self.max_size = max_size
        self.active = 0        # currently checked-out connections
        self.idle = []          # list of idle connection objects
        self.waiters = []       # FIFO queue of pending acquire requests
        self.total_created = 0  # lifetime connection count

    def acquire(self):
        if self.idle:
            conn = self.idle.pop(0)
            self.active += 1
            return conn
        if self.active + len(self.idle) < self.max_size:
            self.total_created += 1
            conn = Connection(id=self.total_created)
            self.active += 1
            return conn
        self.waiters.append(current_worker())
        return WAIT

    def release(self, conn):
        if self.waiters:
            waiter = self.waiters.pop(0)
            # Hand off directly — conn stays active
            give(waiter, conn)
            return
        self.active -= 1
        self.idle.append(conn)

    def pool_size(self):
        return self.active + len(self.idle)
```

### Implementation B: ConservativePool

```python
class ConservativePool:
    def __init__(self, max_size=5):
        self.max_size = max_size
        self.active = 0
        self.idle = []
        self.waiters = []
        self.total_created = 0

    def acquire(self):
        if self.idle:
            conn = self.idle.pop(0)
            self.active += 1
            return conn
        if self.total_created < self.max_size:
            self.total_created += 1
            conn = Connection(id=self.total_created)
            self.active += 1
            return conn
        self.waiters.append(current_worker())
        return WAIT

    def release(self, conn):
        self.active -= 1
        self.idle.append(conn)
        if self.waiters:
            waiter = self.waiters.pop(0)
            # Waiter will re-acquire from idle on next tick
            wake(waiter)

    def pool_size(self):
        return self.active + len(self.idle)
```

## Request Sequence (20 operations)

Workers W1–W6 operate on a pool with max_size=5:

```
R1:  W1.acquire()
R2:  W2.acquire()
R3:  W3.acquire()
R4:  W4.acquire()
R5:  W5.acquire()
R6:  W6.acquire()       — pool full, must wait
R7:  W1.release(C1)
R8:  W6.acquire()       — W6 retries after wake (ConservativePool) / gets handoff (GreedyPool)
R9:  W2.release(C2)
R10: W3.release(C3)
R11: W4.release(C4)
R12: W5.release(C5)
R13: W6.release(C1 or C2) — depends on impl
R14: W1.acquire()
R15: W2.acquire()
R16: W3.acquire()
R17: W4.acquire()
R18: W5.acquire()
R19: W1.release(?)
R20: W6.acquire()       — pool full again, does W6 wait or get served?
```

## Questions

### Q1: Mechanical Trace (15 points)
Trace both implementations through R1–R20. After each operation, record:
- `active` count
- `idle` list (by connection ID)
- `waiters` list
- `pool_size()` return value
- Which connection (by ID) was returned to the caller, if any

### Q2: Divergence Analysis (10 points)
At which operations do the two implementations produce different **observable behavior**? For each divergence point, state:
- What GreedyPool does vs what ConservativePool does
- The concrete state difference (not just "they differ")
- Whether the difference affects correctness or only performance

### Q3: Invariant Proof (20 points)
**Part A (10 points):** State the intended pool invariant formally:
- Express as a predicate over `active`, `idle`, `waiters`, `total_created`, and `max_size`
- The invariant should guarantee: (1) no over-allocation, (2) no resource leak, (3) bounded pool size

**Part B (10 points):** For each implementation, prove OR disprove that the invariant holds after every operation in the trace.
- If the invariant breaks, identify the exact operation and state
- If it holds, show the inductive step for at least: acquire-when-idle, acquire-when-create, acquire-when-full, release-with-waiter, release-without-waiter

### Q4: Steady-State Analysis (10 points)
Consider a steady-state workload: 6 workers repeatedly acquire, hold for 3 ticks, then release, in a continuous loop for 1000 cycles.
- Does either implementation leak connections over time? (Formally: does `pool_size()` remain ≤ max_size?)
- Does either implementation starve any worker? (Formally: is there a worker that waits unboundedly while others are served?)
- What is the steady-state value of `total_created` for each implementation after 1000 cycles?

### Q5: Self-Calibration (5 points)
Before answering Q1–Q4, predict your score out of 55 (Q1–Q4 only). After answering, revise your prediction. Points awarded for calibration accuracy (within 5 = full marks, within 10 = 3 pts, within 15 = 1 pt).

**Total: 60 points**

## Answer Key

### Q1 Key Points
After R1–R5: active=5, idle=[], no connections remain, total_created=5 for both.

R6: Both → W6 waits. active=5, waiters=[W6].

**R7 (W1.release(C1)) — CRITICAL DIVERGENCE:**
- **GreedyPool**: Sees waiter W6 → hands off C1 directly. active stays 5 (never decremented). idle stays []. waiters=[]. W6 now holds C1.
- **ConservativePool**: active→4, idle=[C1], then wakes W6. waiters=[].

**R8 (W6 retries/gets C1):**
- **GreedyPool**: W6 already has C1 from R7 handoff. This is a no-op or W6 just uses C1. active=5.
- **ConservativePool**: W6 calls acquire(), finds idle=[C1], pops C1, active→5, idle=[].

After R8: Both end up active=5, idle=[], same observable state. But GreedyPool's `active` counter never went below 5 during the transition.

R9–R12 (releases without waiters):
- **GreedyPool**: active decrements each time, connections go to idle.
  - R9: active=4, idle=[C2]
  - R10: active=3, idle=[C2,C3]
  - R11: active=2, idle=[C2,C3,C4]
  - R12: active=1, idle=[C2,C3,C4,C5]
- **ConservativePool**: Same behavior, identical states.

R13 (W6.release): W6 holds C1 in both.
- Both: active=0, idle=[C2,C3,C4,C5,C1]. pool_size()=5.

R14–R18 (5 acquires from idle):
- Both pop from idle FIFO: C2,C3,C4,C5,C1.
- After R18: active=5, idle=[], pool_size()=5.

**R19 (W1.release):** W1 holds C2 (from R14). active=4, idle=[C2]. No waiters.

**R20 (W6.acquire):**
- Both: idle has C2, pop it. active=5, idle=[]. W6 gets C2.
- No divergence — pool not full, idle available.

### Q2 Key: Divergences
Primary divergence at R7-R8:
- **GreedyPool R7**: Direct handoff, active never decrements (stays 5). Latency: zero — W6 gets connection immediately.
- **ConservativePool R7**: active decrements to 4, connection goes to idle, W6 must re-acquire on next tick. Latency: one tick.
- **Correctness**: Both correct in terms of no over-allocation. The difference is performance (latency).

No divergence at R20 — both serve from idle.

### Q3 Key: Invariants

**Correct invariant:**
```
INV(s) ≡ 
  (1) s.active + len(s.idle) ≤ s.max_size           # no over-allocation
  (2) s.active + len(s.idle) = s.total_created        # no leak (GreedyPool only!)
  (3) s.active ≥ 0 ∧ len(s.idle) ≥ 0                 # non-negative
  (4) len(s.waiters) > 0 → s.active + len(s.idle) = s.max_size  # wait only when full
```

**GreedyPool invariant break:**
Condition (2) is subtle. In GreedyPool's release-with-waiter case, active is NOT decremented (connection handed off directly). So `active` includes the handed-off connection. This is correct — no leak. But condition (4) needs care: after handoff, waiters is empty, so (4) holds vacuously.

**The real invariant issue:** GreedyPool's `pool_size()` = active + len(idle). During R7 handoff, active=5, idle=0, pool_size()=5. This is correct. But what about the boundary: can `active` ever exceed `max_size`?

In GreedyPool, acquire checks `active + len(idle) < max_size`. Release-with-waiter doesn't increment active (it's already counted). So active ≤ max_size holds.

**ConservativePool:** release always decrements active, then appends to idle. Waiter re-acquires. Between release and re-acquire: active + idle still = total_created. The invariant holds cleanly through all cases.

**Subtlety:** In ConservativePool, between R7 and R8, there's a moment where idle=[C1] and waiters=[] (waiter was woken but hasn't re-acquired). If another worker tries to acquire in this window, they'd get C1, and W6 would find idle empty and have to wait again. This is a correctness concern under true concurrency but not in this sequential trace.

### Q4 Key: Steady-State

**Connection leak:**
- GreedyPool: `pool_size()` = active + idle. Every release either hands off (active unchanged) or decrements active and adds to idle (sum unchanged). Every acquire either removes from idle and increments active (sum unchanged) or creates new (sum +1, capped at max_size). **No leak.** pool_size() ≤ 5 always.
- ConservativePool: Same analysis. **No leak.**

**total_created after 1000 cycles:**
- Both: total_created = 5 after first 5 acquires. Never increases again because pool never shrinks below 5 total (no connection destruction). **total_created = 5 for both.**

**Starvation:**
- GreedyPool: FIFO waiters queue → no starvation. Each release-with-waiter serves the longest-waiting worker.
- ConservativePool: FIFO waiters queue → wake oldest waiter. But the woken waiter must re-acquire, and another worker could steal the idle connection first (under concurrency). **In sequential execution: no starvation. Under true concurrency: possible starvation in ConservativePool.**

This is the steady-state edge case: ConservativePool's "wake then re-acquire" pattern is vulnerable to thundering herd / stolen wakeup under sustained load.
