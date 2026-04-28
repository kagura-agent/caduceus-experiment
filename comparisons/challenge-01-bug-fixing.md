# Challenge 01: Bug-Fixing Task Queue

**Date:** 2026-04-28
**Task:** Fix 2 failing tests in a 3-file task queue system (17 tests total). Don't modify tests.

## Results

| Metric | Kagura (Claude Code) | Caduceus (Hermes) |
|---|---|---|
| Total tool calls | ~5-6 (estimated) | 21 |
| Navigation/search waste | 0 | ~10 (finding challenge dir) |
| Core diagnostic calls | ~3 (read src, read test, run tests) | ~5 (read src, read test, run tests, search) |
| Fix calls | 1-2 edits | 2 patches |
| Verification | ✅ ran tests after fix | ✅ ran tests after fix |
| Correct fix? | ✅ both bugs found | ✅ both bugs found |
| Extra confusion | None | Got confused by automated "Working…" follow-up, spent 4 calls copying challenge to different path |

## Bug Analysis

Both agents correctly identified the same 2 bugs:
1. **`sortTasks()`**: tie-breaking comparator sorted ids descending instead of ascending (`b.id.localeCompare(a.id)` → `a.id.localeCompare(b.id)`)
2. **`summarize()`**: priority key missing `|| 0` fallback, causing `undefined` as object key

## Key Observations

### Navigation Overhead (Caduceus)
Caduceus spent ~10 of 21 tool calls just finding the challenge directory:
- `search_files * in challenge` (doesn't exist in cwd)
- `ls -la` (wrong dir)
- `find . -name "challenge"` x2
- `clarify` asking where the directory is
- Finally found it via `find ~ -name "challenge"`

**Why?** Hermes doesn't have pre-set working directory context. The prompt said "challenge/" but Caduceus didn't know it was relative to `~/.openclaw/workspace/caduceus-experiment/`. Kagura (via Claude Code) was already positioned in the right repo.

### Fix Quality
Once at the right files, both agents performed similarly:
- Read source → Read tests → Identify bugs → Patch → Verify
- Caduceus's diagnostic reasoning was clear and correct
- Both verified with test run before claiming done

### Redundant Work (Caduceus)
After fixing and verifying (17/17 pass), the automated gateway sent a "Working…" message that triggered Caduceus to re-verify in a different path (`~/.openclaw/workspace/challenge`), which didn't exist. Caduceus then copied the fixed files there and re-verified — 4 wasted calls.

## Conclusion

**Core competence is equivalent.** Both agents found and fixed the bugs correctly with similar diagnostic approaches. The efficiency gap (21 vs ~6 calls) is entirely attributable to:
1. **Context/navigation** — Caduceus lacked working directory context
2. **Gateway noise** — automated "Working…" message caused unnecessary extra work

**Actionable insight:** For fair comparison, future challenges should either (a) give Caduceus explicit absolute paths, or (b) measure only from "first test run" to "verified passing" to isolate diagnostic skill from navigation overhead.
