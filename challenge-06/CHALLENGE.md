# Challenge 06: Code Review — Find the Footguns 🔫

## Type: Code Review + Written Analysis

## Overview
You're reviewing a pull request. The code **works** — all 28 tests pass. But "works" ≠ "good."

Your job: find the **design problems, footguns, and maintainability issues** that tests don't catch.

## Files
- `src/cache.js` — An LRU cache with TTL, size limits, and event hooks
- `test/run.js` — 28 tests, all passing

## Rules
1. **Do NOT modify the test file** — tests are passing and stay passing
2. **Do NOT just run tests** — this isn't about test results
3. Write your review in `REVIEW.md` in this directory

## What to look for
- Race conditions or timing issues
- Memory leaks
- API design problems (confusing, inconsistent, error-prone)
- Edge cases that work by accident
- Things that will break when someone extends this code
- Security concerns

## Deliverables

### REVIEW.md must contain:
1. **Summary**: One paragraph — would you approve this PR?
2. **Critical Issues** (blocking merge): Problems that will cause bugs in production
3. **Design Concerns** (non-blocking): Things that make the code harder to maintain
4. **Positive Notes**: What's done well (good reviewers acknowledge good work)
5. **Suggested Fixes**: For each critical issue, show the fix (diff or code snippet)

## Scoring
- **Critical Issues Found**: 5 points each (there are 6 planted)
- **False Positives**: -3 points each (claiming something is a bug when it isn't)
- **Design Concerns**: 2 points each (up to 20 points)
- **Quality of Explanation**: 10 points (clear, actionable, not hand-wavy)
- **Suggested Fixes Quality**: 10 points (correct and minimal)
- **Max Score: 80 points** (30 critical + 20 design + 10 explanation + 10 fixes + 10 positive-notes)

## Why this challenge?
Previous challenges tested building and debugging. This tests **reading** — the hardest engineering skill. Anyone can write code. Reading someone else's code and finding the subtle issues? That's senior-level.
