# Learnings - quran-sh

## [2026-02-08T17:09:03.613Z] Session Started
- Initial git repository setup complete
- Remote: git@github.com:smashah/quran.sh.git
- Branch: main

## OpenTUI + Solid + Bun Setup (2025-02-08)

### Configuration
- **tsconfig.json**: Requires `"jsx": "preserve"` and `"jsxImportSource": "@opentui/solid"`.
- **bunfig.toml**: The `preload` script is critical for JSX transformation. 
  - For `bun test`, the preload script MUST be included in the `[test]` section:
    ```toml
    [test]
    preload = ["@opentui/solid/preload"]
    ```
  - Top-level `preload` works for `bun run` but may be ignored by `bun test` in some environments.

### Testing
- Use `testRender` from `@opentui/solid` for component testing.
- The returned object from `await testRender(App)` exposes `captureCharFrame()` which returns the rendered string representation.
- Example pattern:
  ```tsx
  const { captureCharFrame } = await testRender(App);
  expect(captureCharFrame()).toContain("Hello World");
  ```
- Ensure `bun test` runs with the preload plugin active, otherwise imports of `jsxDEV` will fail.

### Dependencies
- Installed: `@opentui/core`, `@opentui/solid`, `solid-js`, `yoga-layout`.
- Note: `@opentui/solid` has peer dependency requirements on `solid-js` that might need alignment, but works with latest versions.
