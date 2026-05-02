# Challenge 08 — Answer Key

## Q1: Token expired 30 minutes ago → which error?
**Answer: `token_expired` (not refreshable)**
- `config.js`: `auth.refreshWindow = 3600` (seconds = 1 hour)
- `auth.js` line: `if (now - decoded.exp < refreshWindow)` → 30 min = 1800s < 3600s → **within** refresh window
- **Wait — 30 minutes IS within the 1-hour refresh window!**
- **Correct answer: `token_expired_refreshable`**
- Flow: verifyToken → exp < now (expired) → now - exp = 1800 < 3600 (refreshWindow) → return `token_expired_refreshable`
- Then authenticate() sees valid=false → calls recordFailure(userId) → returns { authenticated: false, error: 'token_expired_refreshable' }

## Q2: Maximum simultaneous sessions per user
**Answer: 5**
- `config.js`: `maxSessionsPerUser: 5`
- `session.js` `create()`: checks `userSessions.size >= maxSessions` after cleaning expired ones → returns null if at limit
- The cleanup in create() removes expired sessions first, so the effective limit is 5 *active* (non-expired) sessions

## Q3: Valid token, no session, at max sessions (all active)
**Answer: Authentication fails with `session_limit_reached`**
- `auth.js` authenticate(): verifyToken → valid → not locked out → sessions.get(userId) → returns most recent active session
- **Wait — if user has no existing session but is at max?** The question says "no existing session" but also "max allowed sessions all active" — this is contradictory.
- **Re-read:** "who has no existing session and already has the maximum allowed sessions" — this means sessions exist but get() might fail? No, it says "no existing session."
- **Interpretation:** User already has 5 active sessions. authenticate() calls sessions.get(userId) → returns the most recently accessed one (not null). So session != null → skips create → touches session → succeeds.
- **But if we interpret "no existing session" literally** (e.g., sessions map was cleared but userSessions wasn't): get(userId) returns null → calls create(userId) → create cleans expired, finds 5 active → size >= 5 → returns null → authenticate returns `session_limit_reached`
- **Best answer: Authentication succeeds** because get(userId) returns the most recent active session. The premise "no existing session AND max active sessions" is contradictory — if they have 5 active sessions, get() will find one.

## Q4: Bug — recording failure on refreshable token expiry?
**Answer: Yes, this is a bug.**
- `auth.js` authenticate(): if `!tokenResult.valid` → `recordFailure(userId)`
- An expired-but-refreshable token returns `valid: false`, so it **records a failure**
- This means a user whose token legitimately expired (within the refresh window) accumulates failed attempts
- After 5 refreshable-token attempts, the user gets **locked out** — clearly wrong behavior
- The fix: authenticate() should check for `token_expired_refreshable` before recording failure

## Q5: Config override sessionTTL: 7200 → what ttlMs?
**Answer: 7200000 ms (7200 * 1000)**
- `config.js`: `new Config({ sessionTTL: 7200 })` → _deepMerge merges top-level, sessionTTL=7200 overrides default 3600
- `session.js` _isExpired(): `const ttlMs = this.config.get('sessionTTL') * 1000` → 7200 * 1000 = 7200000ms
- `config.get('sessionTTL')` walks path 'sessionTTL' → returns 7200

## Q6: Cleanup interval with defaults
**Answer: 1800 seconds (30 minutes)**
- `config.js`: `sessionTTL: 3600` (seconds)
- `session.js` startCleanup(): `const ttl = this.config.get('sessionTTL') * 1000` → 3600000ms, then `setInterval(..., ttl / 2)` → 1800000ms = 1800 seconds

## Q7: 50-minute idle then request with valid token
**Answer: Session expired → new session created → success**
- `config.js`: `sessionTTL: 3600` seconds = 60 minutes. 50 min < 60 min → **session NOT expired!**
- `auth.js` authenticate(): verifyToken → valid → not locked out → sessions.get(userId)
- `session.js` get(userId): finds user's sessions, checks _isExpired: lastAccess was 50 min ago = 3000s < 3600s TTL → **not expired**
- Returns the session → authenticate touches it (updates lastAccess) → success
- **Answer: Session is still valid (50 min < 60 min TTL). authenticate() finds it, touches it, returns success.**

## Q8: Lockout timing unit inconsistency
**Answer: No real inconsistency, but there's a unit conversion.**
- `config.js`: `lockoutDuration: 900` (seconds, comment says "15min")
- `auth.js` isLockedOut(): `const lockoutMs = this.config.get('auth.lockoutDuration') * 1000` → correctly converts seconds to ms
- The conversion is explicit and correct. No inconsistency — auth.js properly handles the seconds→ms conversion.

## Q9: Could get(userId) return another user's session?
**Answer: No, impossible.**
- `session.js` get(key): userId lookup uses `this._userSessions.get(key)` which returns a Set of sessionIds belonging to that user
- Each sessionId in the set was added during `create(userId)` for that specific user
- The method only iterates sessions from the user's own set, never crosses user boundaries
- Even if sessionIds collide (UUID, practically impossible), the lookup is through the user-specific set

## Q10: Partial auth override — what happens to other defaults?
**Answer: Other auth defaults are preserved.**
- `config.js` _deepMerge(): when source[key] and target[key] are both objects (non-array), it recursively merges
- `{ auth: { tokenExpiry: 3600 } }` merged with `DEFAULTS.auth`: both are objects → recursive merge
- Result: tokenExpiry=3600 (overridden), maxFailedAttempts=5, lockoutDuration=900, hashRounds=12, refreshWindow=3600 (all preserved)

## Q11: stats() doesn't clean up
**Answer: stats() counts but does NOT destroy expired sessions.**
- `session.js` stats(): iterates sessions, calls _isExpired() to categorize, but never calls destroy()
- Effect on create(): create() has its own cleanup loop that destroys expired sessions before checking the limit
- So stats() has **no effect** on subsequent create() calls — create() does its own cleanup independently
- The expired sessions remain in memory until either create() cleans them, the cleanup interval runs, or get() encounters them

## Q12: User A, 5 sessions, session #1 is 55 min old never accessed
**Answer: Authentication succeeds.**
- Default sessionTTL = 3600s = 60 minutes
- Session #1: created 55 min ago, lastAccess = 55 min ago → 55 min < 60 min → **NOT expired**
- `auth.js` authenticate() → sessions.get(userId) → finds most recently accessed session (one of sessions #2-#5) → returns it → not null → skips create → touches it → success
- Even if we got to create(): session #1 is not expired (55 < 60 min), so all 5 are active → create returns null
- **The key: 55 minutes < 60 minute TTL, so no session is expired, but authenticate doesn't need to create a new one — it reuses an existing one**

## Scoring Notes
- Questions are designed so wrong answers often come from single-file reasoning or not tracing values across files
- Q4 is the trickiest — the "bug" requires understanding both the auth flow AND what constitutes a legitimate vs failed attempt
- Q3 tests whether the reader notices the logical contradiction in the premise
- Q7 and Q12 test careful TTL arithmetic against the config defaults
