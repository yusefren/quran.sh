## [2026-02-09] Task 0: Test Infrastructure Setup
- Bun test runner configured successfully.
- Smoke tests created for `quran.getSurah()` and `calculateStreaks()`.
- Test pattern: import from `bun:test`, use `test()` or `describe()`/`it()`.
- Tests are automatically discovered in `__tests__` directories or files ending in `.test.ts`.
- `calculateStreaks` was tested with a mocked `today` parameter to ensure deterministic results.
- `getSurah(1)` was verified to return "Al-Fatihah".
- Added `"test": "bun test"` to `package.json` for easy execution.

## 2026-02-09 Task 1: BiDi Spike Findings
- bidi-js status: VALIDATED WITH CAVEAT
- bidi-js correctly implements UAX #9 BiDi algorithm (reorders logical→visual)
- BUT: Modern terminals (including our test environment) have NATIVE BiDi support
- Applying bidi-js on top of native BiDi causes DOUBLE REVERSAL = broken text
- Raw Arabic text renders correctly as-is in the terminal
- The "broken RTL Arabic" issue is actually about LEFT-ALIGNMENT and missing WIDTH CONSTRAINTS
- Combining diacritical marks (tashkeel) get separated from base chars after bidi-js reordering
- Recommendation for Task 2: Focus on right-alignment + width, keep bidi-js as optional/passthrough
- Keep bidi-js installed — useful if we need to support terminals without native BiDi later
