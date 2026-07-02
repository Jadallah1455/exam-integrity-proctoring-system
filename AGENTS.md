## Build & Verify Commands

- `npx tsc --noEmit` — TypeScript type-check (must pass with zero errors)
- `npm run build` — Full production build (must succeed)
- `npm run lint` — ESLint check (warnings OK, zero errors)
- `npm run lint:fix` — Auto-fix ESLint issues
- `npm test` / `npm run test:watch` — Vitest unit tests
- `npx vitest run --reporter=verbose` — Run tests with full names
