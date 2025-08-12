# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/`
  - Background service worker: `src/main/background.js`
  - Popup/Options HTML & styles: `src/ui/*.html`, `src/ui/styles/*`
  - UI components: `src/ui/components/*` (JS + HTML fragments)
  - App logic: `src/controllers/`, `src/services/`, `src/utils/`, `src/lib/`
- Tests: `tests/unit/` (Vitest), `tests/integration/` and `tests/visual/` (Playwright)
- Config: `manifest.json`, `eslint.config.js`, `prettier.config.js`, `vitest.config.js`, `playwright.config.js`
- Assets: `icons/`, web‑accessible resources configured in `manifest.json`.

## Build, Test, and Development Commands
- `npm run install-browsers`: Install Playwright Chromium (first‑time setup).
- `npm test`: Run unit tests (Vitest, jsdom).
- `npm run test:playwright`: Run integration tests; `:headed`/`:ui` for debug.
- `npm run test:visual`: Run visual tests; `:update` to update snapshots.
- `npm run lint` / `lint:fix`: Lint JS; auto‑fix common issues.
- `npm run format` / `format:check`: Apply/check Prettier formatting.
- `npm run check` / `check:all` / `quality`: Lint + format + tests (+ coverage/visual).

Local run (Chrome): open `chrome://extensions` → Enable Developer Mode → Load unpacked → select repo root (contains `manifest.json`).

## Coding Style & Naming Conventions
- JavaScript (ES modules), 2‑space indent, single quotes, semicolons, print width 100 (see `prettier.config.js`).
- Prefer `const`, no `var`, arrow spacing enforced, avoid unused vars (see `eslint.config.js`).
- Components: PascalCase for JS (e.g., `AuthModalComponent.js`); HTML partials kebab‑case.
- JSDoc encouraged for classes and public APIs.

## Testing Guidelines
- Unit: place files as `tests/unit/**.test.js`; run `npm test`.
- Coverage: `npm run test:unit:coverage` (reports in `coverage/`).
- Integration/visual: Playwright specs in `tests/integration/` and `tests/visual/`.
- Use `tests/setup.js` browser/extension mocks; keep tests deterministic.

## Commit & Pull Request Guidelines
- Commits: Conventional format `type(scope): short description`, e.g., `feat(ui): add auth modal` (enforced by Husky).
- PRs: clear description, link issues (`Closes #123`), include screenshots for UI changes and a note of commands run (e.g., `npm run quality`).

## Security & Configuration Tips
- Do not commit secrets. Start from `.env.example` and `supabase-credentials.template.js`; follow `SUPABASE_SETUP.md`.
- Validate dependencies: `npm run audit:security`; fix with `npm run audit:fix`.
