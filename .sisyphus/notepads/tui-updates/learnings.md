## [2026-02-09] Task 0: Test Infrastructure Setup
- Bun test runner configured successfully.
- Smoke tests created for `quran.getSurah()` and `calculateStreaks()`.
- Test pattern: import from `bun:test`, use `test()` or `describe()`/`it()`.
- Tests are automatically discovered in `__tests__` directories or files ending in `.test.ts`.
- `calculateStreaks` was tested with a mocked `today` parameter to ensure deterministic results.
- `getSurah(1)` was verified to return "Al-Fatihah".
- Added `"test": "bun test"` to `package.json` for easy execution.
