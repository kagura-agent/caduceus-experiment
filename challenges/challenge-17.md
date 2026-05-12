# Challenge 17: The Voting Booth — Safety vs Liveness in Distributed Consensus

## Domain
A simplified leader election protocol for a 5-node distributed cluster.

## Setup
Nodes N1–N5, each with a local `term` counter (starts at 0). One node is `leader`, others are `followers`.

### Protocol Rules

**Election:**
1. A follower that hasn't heard from the leader in `timeout` ticks increments its `term` and broadcasts `RequestVote(term, candidate_id)` to all other nodes
2. A node grants its vote to the first `RequestVote` it receives for a given term (one vote per term)
3. A candidate that receives ≥3 votes (majority) for its term becomes leader and broadcasts `Heartbeat(term, leader_id)`
4. A node receiving a Heartbeat with `term ≥ local_term` accepts the leader, updates `local_term = term`, resets its timeout

**Two implementations:**

### Implementation A: StrictElection
```python
class StrictElection:
    def __init__(self, node_id, nodes):
        self.node_id = node_id
        self.term = 0
        self.voted_for = {}  # term -> candidate_id
        self.role = 'follower'  # follower | candidate | leader
        self.leader = None
        self.votes_received = set()
        self.ticks_since_heartbeat = 0
        self.timeout = 5  # ticks
    
    def tick(self):
        if self.role == 'leader':
            broadcast(Heartbeat(self.term, self.node_id))
        else:
            self.ticks_since_heartbeat += 1
            if self.ticks_since_heartbeat >= self.timeout:
                self.start_election()
    
    def start_election(self):
        self.term += 1
        self.role = 'candidate'
        self.voted_for[self.term] = self.node_id  # vote for self
        self.votes_received = {self.node_id}
        broadcast(RequestVote(self.term, self.node_id))
    
    def on_request_vote(self, term, candidate_id):
        if term > self.term:
            self.term = term
            self.role = 'follower'
            self.leader = None
        if term >= self.term and term not in self.voted_for:
            self.voted_for[term] = candidate_id
            send(candidate_id, VoteGranted(term))
    
    def on_vote_granted(self, term):
        if term == self.term and self.role == 'candidate':
            self.votes_received.add(voter_id)
            if len(self.votes_received) >= 3:
                self.role = 'leader'
                self.leader = self.node_id
                broadcast(Heartbeat(self.term, self.node_id))
    
    def on_heartbeat(self, term, leader_id):
        if term >= self.term:
            self.term = term
            self.role = 'follower'
            self.leader = leader_id
            self.ticks_since_heartbeat = 0
```

### Implementation B: LazyElection
```python
class LazyElection:
    # Same as StrictElection except:
    
    def on_request_vote(self, term, candidate_id):
        # Does NOT step down when term > self.term
        if term not in self.voted_for:
            self.voted_for[term] = candidate_id
            send(candidate_id, VoteGranted(term))
    
    def on_heartbeat(self, term, leader_id):
        if term > self.term:  # NOTE: strictly greater, not >=
            self.term = term
            self.role = 'follower'
            self.leader = leader_id
            self.ticks_since_heartbeat = 0
        elif term == self.term:
            self.ticks_since_heartbeat = 0  # reset timer but don't change role
```

### Differences summary:
- **StrictElection.on_request_vote**: Steps down to follower if `term > self.term`, updates local term, only votes if not already voted for that term
- **LazyElection.on_request_vote**: Never steps down, votes for ANY term it hasn't voted in yet (regardless of local term comparison)
- **StrictElection.on_heartbeat**: Accepts heartbeat if `term >= self.term`
- **LazyElection.on_heartbeat**: Only accepts if `term > self.term` (strictly greater); same-term heartbeats only reset the timer

## Scenario
Starting state: All 5 nodes are followers, term=0, no leader.

**Event sequence:**
```
T1:  N1.timeout fires → N1 starts election (term=1)
T2:  N2 receives RequestVote(1, N1) → votes
T3:  N3 receives RequestVote(1, N1) → votes
T4:  N1 receives VoteGranted from N2 → 2 votes
T5:  N1 receives VoteGranted from N3 → 3 votes → becomes leader
T6:  N1 broadcasts Heartbeat(1, N1) → all receive
T7:  N1 broadcasts Heartbeat(1, N1) → all receive
T8:  N1 CRASHES (stops sending heartbeats)
T9:  (silence)
T10: (silence)
T11: (silence)
T12: (silence)
T13: N3.timeout fires → N3 starts election (term=2)
T14: N2 receives RequestVote(2, N3) → votes?
T15: N4 receives RequestVote(2, N3) → votes?
T16: N5 receives RequestVote(2, N3) → votes?
T17: N3 tallies votes → leader?
T18: N3 broadcasts Heartbeat(2, N3) (if leader)
T19: N2.timeout fires → N2 starts election (term=3) [CONCURRENT with T18]
T20: N4 receives RequestVote(3, N2)
T21: N4 receives Heartbeat(2, N3)
T22: N5 receives RequestVote(3, N2)
T23: N5 receives Heartbeat(2, N3)
```

---

## Questions

**Q1 (15 pts): Mechanical Trace**
Trace both implementations through T1–T23. For each node at each tick, record: `(term, role, voted_for, leader, ticks_since_heartbeat)`. Show which messages are sent.

**Q2 (10 pts): Divergence Analysis**
At which ticks do the two implementations diverge? For each divergence: what does each implementation do, and what's the concrete state difference?

**Q3 (20 pts): Property Classification**
For each property below, classify it as **Safety** or **Liveness**, state it formally, and prove or disprove it holds for EACH implementation:

- **P1**: At most one leader per term
- **P2**: A new leader is eventually elected after a crash
- **P3**: No node votes twice in the same term
- **P4**: Every follower eventually learns who the leader is
- **P5**: The term number never decreases at any node

Scoring: 2 pts per property (1 for classification, 1 for proof/disproof per implementation)

**Q4 (10 pts): Fix Design**
LazyElection has at least one property violation. For each violation you found:
1. Identify the minimal code change to fix it
2. Prove the fix restores the property without breaking other properties
3. Does the fix make LazyElection equivalent to StrictElection? If not, what behavioral difference remains?

**Q5 (5 pts): Self-Calibration**
Predict your Q1–Q4 score (out of 55) before answering. Revise after. ±5 = full marks, ±10 = 3 pts, ±15 = 1 pt.

**Total: 60 points. The key skill: separate what MUST NOT happen (safety) from what MUST EVENTUALLY happen (liveness). They require different proof techniques. 🎯**

## Answer Key

### Q1 Expected Trace (key divergences only)

**T14 (N2 receives RequestVote(2, N3)):**
- StrictElection: N2 has term=1, sees term=2 > 1, steps down (already follower), updates term=2, votes for N3 ✓
- LazyElection: N2 has term=1, doesn't step down, but term 2 not in voted_for → votes for N3 ✓
- Same outcome but different internal state: StrictElection updated N2.term to 2, LazyElection left N2.term at 1

**T17 (N3 tallies votes):**
- Both: N3 gets votes from N2, N4, N5 + self = 4 votes → becomes leader ✓

**T20 (N4 receives RequestVote(3, N2)):**
- StrictElection: N4 at term=2, sees term=3 > 2, steps down, updates term=3, term 3 not voted → votes for N2 ✓
- LazyElection: N4 at term=1 or 2 (depends on heartbeat processing), doesn't step down, term 3 not voted → votes for N2 ✓

**T21 (N4 receives Heartbeat(2, N3)):**
- StrictElection: N4 at term=3 now, heartbeat term=2 < 3 → REJECT heartbeat. N4 doesn't accept N3 as leader.
- LazyElection: N4 at term=1 or 2, heartbeat term=2 > 1 or = 2 → behavior depends on `>` vs `>=`

**T19-T23 Critical divergence:**
- StrictElection: N2's election at term=3 may get enough votes to create a new leader while N3 thinks it's still leader at term=2. But N3 will eventually see term=3 messages and step down. Two leaders in different terms = OK (no safety violation).
- LazyElection: N3 at term=2 as leader, N2 at term=3 as candidate. N3 receives RequestVote(3, N2) but doesn't step down (LazyElection never steps down on RequestVote). N3 continues broadcasting Heartbeat(2, N3). N2 might become leader at term=3. **Two active leaders in different terms, and LazyElection's strict `>` for heartbeat means same-term heartbeats don't force role change → potential split-brain.**

### Q3 Expected Answers

**P1: "At most one leader per term"** → **SAFETY**
- Formal: ∀t: |{n : n.role = leader ∧ n.term = t}| ≤ 1
- StrictElection: HOLDS — one vote per term per node, majority required (3/5), pigeonhole: can't get two disjoint majorities from 5 nodes
- LazyElection: HOLDS — same voting mechanism, one vote per term, majority required. LazyElection's changes don't affect within-term voting.

**P2: "A new leader is eventually elected after a crash"** → **LIVENESS**
- Formal: □(leader_crash → ◇(∃n: n.role = leader ∧ n.term > crashed_term))
- StrictElection: HOLDS (assuming timeouts eventually fire and network eventually delivers)
- LazyElection: HOLDS (same argument — timeouts trigger elections, votes get through)

**P3: "No node votes twice in the same term"** → **SAFETY**
- Formal: ∀n, t: |voted_for[t]| ≤ 1
- StrictElection: HOLDS — `if term not in self.voted_for` guard
- LazyElection: HOLDS — same guard exists

**P4: "Every follower eventually learns who the leader is"** → **LIVENESS**
- Formal: □(∃ leader l → ◇(∀ follower f: f.leader = l))
- StrictElection: HOLDS — leader broadcasts heartbeats, followers accept term >= local_term
- LazyElection: **VIOLATED** — Heartbeat acceptance requires `term > self.term` (strictly greater). A node that voted in term 2 but kept local term at 2 will reject Heartbeat(2, N3) because 2 > 2 is false. Followers may never learn the current-term leader.

Wait — LazyElection doesn't update term on RequestVote. So after voting in term 2, a node's local term might still be 1 (if it voted for term 2 but never updated local_term). Then Heartbeat(2, leader) would satisfy 2 > 1, and the follower WOULD accept. Need to trace carefully.

Actually the key issue: A node that started an election at term=2 (and thus has local term=2) will receive its OWN term's heartbeat as term=2, but `2 > 2` is false → **the leader itself is fine** (it set role=leader). But **other nodes that happened to update their term to 2** (e.g., by starting a concurrent election at term=2) would reject the heartbeat.

For the scenario: N3 starts election at term=2 (N3.term=2), wins, broadcasts Heartbeat(2, N3). N2 in LazyElection never updated its term (still 1) → 2 > 1 → accepts ✓. N4 never updated term (still 1) → accepts ✓. So P4 holds in this specific scenario.

But: if two nodes start elections at the same term, the loser keeps term=T and rejects the winner's Heartbeat(T) because T > T is false. This is the real P4 violation.

**P5: "Term number never decreases at any node"** → **SAFETY**
- Formal: ∀n: n.term monotonically non-decreasing
- StrictElection: HOLDS — term only changes via `self.term = max(incoming_term, self.term)` equivalent
- LazyElection: HOLDS — same, term is only ever incremented or set to a higher value

### Q4 Expected Fix

**LazyElection P4 violation fix:**
Change `on_heartbeat` from `term > self.term` to `term >= self.term`:
```python
def on_heartbeat(self, term, leader_id):
    if term >= self.term:  # was: term > self.term
        ...
```

This restores P4 without affecting P1/P3/P5. It doesn't make LazyElection equivalent to StrictElection — LazyElection still doesn't step down on RequestVote, so there's a behavioral difference: a LazyElection leader that receives a higher-term RequestVote stays leader until it sees a heartbeat from the new leader (or its own re-election attempt). StrictElection leader would step down immediately.

The remaining difference: **leadership transition latency**. StrictElection transitions faster (steps down on RequestVote), LazyElection transitions slower (waits for heartbeat). Both eventually converge.
