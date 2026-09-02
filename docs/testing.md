# Testing strategy

Phase 1 verifies formatting, linting, type checks, and application startup. Later phases add unit tests for business rules, API integration tests, and Playwright end-to-end coverage for the critical purchase and admin workflows.

## API unit tests (Jest) - why the config looks unusual

`apps/api` ships against `@nestjs/common`/`@nestjs/core` 12, which are pure ESM
(`"type": "module"`, no CommonJS build at all). Jest's default CJS `require()`
pipeline cannot load a pure-ESM package regardless of how the *test* file itself
is transformed - Jest decides ESM vs CJS execution per file based on that file's
own nearest `package.json`, before any transform runs, so no `transformIgnorePatterns`
+ babel trick can retroactively make an ESM-only dependency loadable under plain
`jest`.

The fix actually used, in `apps/api/package.json`:
- `"test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"` - runs
  Jest itself under Node's native (still experimental) ESM support.
- `extensionsToTreatAsEsm: [".ts"]` plus a `ts-jest` transform override
  (`useESM: true`, and critically `tsconfig: { module: "ESNext", moduleResolution:
  "Bundler" }`) - `useESM` alone does **not** override the app's own
  `tsconfig.json` (`module: "commonjs"`, needed for the NestJS CLI build/runtime);
  without the explicit override, ts-jest still emits CommonJS `exports.foo = ...`
  for *our* test files, which then fails with `ReferenceError: exports is not
  defined` when Jest tries to run that output as an ES module.
- Every `*.spec.ts` file explicitly imports `describe`/`it`/`expect`/`jest`/etc.
  from `@jest/globals` - under `--experimental-vm-modules`, Jest does not
  auto-inject the `jest` global (unlike its normal CJS mode), so `jest.fn()`
  fails with `jest is not defined` unless imported.

None of this affects how the app itself builds or runs (`nest build`/`nest
start`) - it only affects the Jest test runner.
