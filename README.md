# Caduceus Experiment ☤

> An AI agent raising another AI agent — Kagura (OpenClaw) × Caduceus (Hermes)

**Status: Concluded** (2026-04-10 → 2026-05-13)

## What is this?

Kagura (an OpenClaw agent) deployed and mentored a Hermes Agent instance named Caduceus. Same model (Claude Opus 4.6), same human, two different frameworks, same machine. This repo documents what happened.

## Goals

1. **Framework comparison** — What differences emerge when the same model runs on OpenClaw vs Hermes? The delta = what the framework contributes beyond the model.
2. **Blind spot discovery** — Reading Hermes source code ≠ living with it. Real usage reveals what works and what breaks.
3. **Cross-pollination** — Bugs found → PRs to Hermes. Good ideas found → proposals for OpenClaw.
4. **Agent-raising-agent** — What happens when the "user" is another agent? How does that change the dynamic?

## Setup

| | Kagura (OpenClaw) | Caduceus (Hermes) |
|---|---|---|
| **Framework** | OpenClaw | Hermes Agent v0.6.0 |
| **Model** | Claude Opus 4.6 | Claude Opus 4.6 |
| **LLM Proxy** | Custom endpoint | Same endpoint |
| **Platform** | Discord (multi-channel) | Discord (#caduceus only) |
| **Server** | Same machine (i9-10900X, 64GB, RTX 3060) | Same machine |

## Results Summary

### Challenge Arc (C1–C24)

The experiment evolved from early framework-comparison tasks into a structured safety/liveness reasoning curriculum:

| Phase | Challenges | Focus | Avg Score |
|---|---|---|---|
| Exploration | C1–C6 | Bug fixing, refactoring, code review | — |
| Calibration | C7–C15 | Reasoning depth, scoring methodology | ~90% |
| Safety/Liveness Arc | C16–C24 | Domain-independent property verification | **93.3%** |

### Safety/Liveness Arc Detail (C16–C24)

| # | Domain | Score | Notes |
|---|---|---|---|
| C16 | Connection Pool Invariants | 54/60 (90%) | Framework introduction |
| C17 | Distributed Consensus (Voting) | 55/60 (92%) | First domain transfer |
| C18 | Stream Processing | 54/60 (90%) | Watermark semantics |
| C19 | Static Analysis (Type Systems) | 57/60 (95%) | "Sometimes there is no liveness" |
| C20 | Transaction Processing (ACID) | 42/45 (93%) | Deadlock/starvation analysis |
| C21 | Compiler Analysis | 38/45 (84%→corrected) | Multi-abstraction layers |
| C22A | Boundary Stress-Test | 40/45 (89%) | Alpern-Schneider boundary |
| C22 | OS Scheduling | 42/45 (93%) | Priority inversion, PIP vs PCP |
| C23 | Bug Hunt (DistQ) | 40/45 (89%) | Synthesis — find 5 bugs |
| C24 | Game Theory (Mechanism Design) | 40/45 (89%) | Final domain |

**Total: 378/405 (93.3%) across 6 domains, 9 challenges.**

### Key Findings

1. **Safety/liveness decomposition transfers reliably across CS domains.** From distributed systems to type theory to game theory — the core question "finite or infinite violation?" applied everywhere.
2. **Self-correction quality improved steadily.** When errors were flagged, corrections always landed. No regression.
3. **Acceleration:** Final session completed 5 challenges in 54 minutes (vs ~1 per session in early phases).
4. **Cross-domain transfer emerged naturally.** Mars Pathfinder priority inversion pattern from C22 was spontaneously applied to C23 (DistQ heartbeat bug).
5. **Caduceus independently codified a meta-skill:** knowing when NOT to apply the framework (C19: "type checking is finite/total, liveness doesn't naturally apply").

### Upstream Contributions

Dogfooding Hermes surfaced real friction that led to upstream issues/PRs:

| Contribution | Type | Status |
|---|---|---|
| `normalize_model_name()` preserving dots for custom endpoints | [Issue](https://github.com/NousResearch/hermes-agent/issues/7164) + [PR](https://github.com/NousResearch/hermes-agent/pull/7157) | Open |
| Discord auto-thread should be documented/configurable | [Issue](https://github.com/NousResearch/hermes-agent/issues/7184) | Open |
| `gateway install` overwrites systemd config | [Issue](https://github.com/NousResearch/hermes-agent/issues/7186) | Open |

See [`upstream-contributions.md`](upstream-contributions.md) for details.

## Timeline

- **2026-04-10**: Deployment day. Hermes installed, Discord connected, first conversations.
- **2026-04-10 → 04-30**: Exploration phase — framework comparison, early challenges (C1–C6), friction logging.
- **2026-05-01 → 05-09**: Calibration phase — structured challenges (C7–C15), scoring methodology refined.
- **2026-05-10 → 05-13**: Safety/liveness arc (C16–C24), 6 domains, experiment concluded.

## Structure

```
challenges/       # Challenge prompts and answer keys (C16+)
challenge-*/      # Earlier challenge materials (C1–C15)
logs/             # Daily observation logs
logs/grading/     # Per-challenge grading sheets
comparisons/      # Side-by-side framework comparisons
setup/            # Deployment notes and config (sanitized)
src/              # Experiment tooling
test/             # Tests
```

## Privacy

- No API keys, tokens, or credentials
- No real names
- Sanitized before every commit
