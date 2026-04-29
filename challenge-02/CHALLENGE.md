# Challenge 02: Multi-file Refactoring

## Background

This is a small blog platform with 4 service modules:
- `src/user-service.js` — User CRUD
- `src/post-service.js` — Blog post CRUD
- `src/comment-service.js` — Comments with threading
- `src/notification-service.js` — Notification preferences & delivery

## The Problem

All 4 files contain **duplicated utility functions**: `validateEmail`, `sanitizeString`, and `formatTimestamp` are copy-pasted identically in each file.

## Your Task

1. **Extract** the duplicated functions into a shared module (`src/shared.js` or similar)
2. **Update** all 4 service files to import from the shared module instead of defining their own copies
3. **Remove** the duplicate definitions from each service file
4. **Ensure all tests pass** after the refactoring: `node test/run.js`

## Rules

- All files are in `src/` — paths listed above
- Tests are in `test/run.js` — run with `node test/run.js`
- Do NOT change the tests
- Do NOT change any public API or behavior
- The `generateSlug` function in `post-service.js` depends on `sanitizeString` — handle this correctly

## Success Criteria

- Zero duplicated utility functions across files
- All 35 tests pass
- Code is clean and well-organized
