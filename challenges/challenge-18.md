# Challenge 18: The Partitioned Cluster — Safety and Liveness Under Network Failure

## Domain
Same 5-node cluster (N1–N5), same StrictElection protocol from C17.

## Scenario
- T1-T9: Normal operation, N1 leader at term 1
- T10: Network partition — Partition A: {N1, N2, N3}, Partition B: {N4, N5}
- T11-T24: Both partitions operate independently
- T25: Partition heals

## Questions

**Q1 (15 pts): Partition Trace**
Trace the system through T1-T25. For each partition, track: leader, term, election attempts, heartbeat flow.

**Q2 (10 pts): Property Classification Under Partition**
How does the partition affect each of P1-P5 from C17? Which properties hold within a partition vs across partitions?

**Q3 (20 pts): The Hard Question — Client Write to Partition B**
At T15, a client sends a write to N4 (in minority partition):
a. Can N4 accept this write? (mechanical)
b. Should N4 accept this write? (correctness)
c. What happens to this write after partition heals?
d. Is "client writes are never lost" a safety or liveness property?
e. Under what conditions can both "no lost writes" AND "writes eventually processed" hold?

**Q4 (10 pts): Design a Partition-Aware Protocol**
Sketch a protocol extension that handles the partition correctly.

**Q5 (5 pts): Self-Calibration**

**Total: 60 points**

## Answer Key

### Q1: Partition Trace

**T1-T9:** N1 leader at term 1, heartbeats to all nodes.

**T10:** Partition occurs.
- Partition A: N1 continues as leader, heartbeats to N2/N3 only
- Partition B: N4/N5 stop receiving heartbeats

**T11-T15:**
- Partition A: N1 heartbeats keep N2/N3 timers reset. Normal operation.
- Partition B: N4/N5 timers increment. After 5 ticks (T15), one times out.

**T16-T18:**
- N4 starts election at term 2, N5 votes for N4
- N4 has 2/5 votes — cannot reach majority (needs 3)
- N4 stuck as candidate, cannot become leader

**T19-T24:**
- Partition A: N1 remains leader at term 1
- Partition B: N4 stuck as candidate at term 2

**T25: Partition heals**
- N4 (term 2) broadcasts RequestVote to N1, N2, N3
- N1, N2, N3 see term 2 > 1 → step down, update term to 2, vote for N4
- N4 receives 3 more votes → total 5 → becomes leader at term 2
- System converges: all nodes term 2, leader N4

**Key insight:** During partition, minority partition CANNOT elect a leader (safety preserved by majority quorum). After healing, system recovers (liveness preserved by timeout + election).

### Q2: Property Classification Under Partition

- **P1 (Safety: at most one leader per term):** HOLDS — N4 can't reach majority in minority partition
- **P2 (Liveness: new leader eventually elected):** TEMPORARILY VIOLATED during partition for minority partition. Restored after healing.
- **P3 (Safety: no double-voting):** HOLDS — voted_for dict unaffected by partition
- **P4 (Liveness: followers learn leader):** VIOLATED in minority partition during split. Restored after healing.
- **P5 (Safety: terms never decrease):** HOLDS — unaffected by partition

### Q3: Client Write to Partition B

**3a. Can N4 accept?** Mechanically yes (no partition-awareness in protocol), but N4 is a candidate, not a leader → should reject.

**3b. Should N4 accept?** No. N4 is not leader. Even if it were, minority partition can't commit (can't replicate to majority). Accepting would risk linearizability violation (split-brain writes).

**3c. After healing?** If stored in N4's log (uncommitted), N4 becomes leader at term 2 and can replicate. If naively acknowledged, write is at risk if N4 crashes before replication.

**3d. "Never lost" — safety or liveness?**
- **Best answer: Safety (durability)** — ∀w: committed(w,t₁) ⇒ ∀t₂>t₁: stored(w,t₂)
- Ambiguity: "lost" could mean "submitted but never processed" (liveness) vs "acknowledged then disappeared" (safety)
- Full credit for identifying the ambiguity and choosing the most useful interpretation with formal justification

**3e. Conditions for both?**
- CAP theorem applies: C+A+P impossible
- CP approach (Raft/Paxos): majority quorum for commits → durability (safety) guaranteed; availability sacrificed in minority partition
- AP approach (CRDTs): all partitions accept → available but conflicts possible; durability conditional on conflict resolution
- Strict answer: impossible under partitions. Practical: CP with majority quorum is the standard trade-off.

### Q4: Protocol Extension

Key additions:
1. Write rejection when not leader: `if self.role != 'leader': reject(write)`
2. Majority quorum for commit: leader replicates to majority before acknowledging
3. Read consistency: reads go through leader (or read quorum)
4. Partition detection: optional, not required — the quorum mechanism handles it implicitly

### Scoring Rubric

- Q1: 15 pts — correct trace through all phases, partition effects clear
- Q2: 10 pts — per-property analysis, within-partition vs across-partition distinction
- Q3: 20 pts — mechanical (2), correctness (4), post-healing (4), classification with formalization (5), conditions/CAP (5)
- Q4: 10 pts — functional protocol sketch, quorum mechanism, handles writes correctly
- Q5: 5 pts — ±5 range
