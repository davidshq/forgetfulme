# ForgetfulMe v2 — Working Notes

This doc tracks decisions, constraints, and day-to-day guidance while we rebuild from scratch.

## Principles
- Simplicity first: minimal MV3 permissions, no content scripts unless required.
- Local-first UX: cache session/config in `chrome.storage.local`, tolerate offline.
- Deterministic UI: stable viewport, fonts, and assets for visual tests.

## Tech & Dependencies
- Supabase (Auth + Postgres): `@supabase/supabase-js` bundled locally (no CDN).
- Styling: Pico.css (local copy in `src/lib/`). Optional small utilities only.
- Tests: Vitest (unit) + Playwright (integration + mandatory visual).
 - Bundling: run `npm run bundle:supabase` to (re)generate `src/lib/supabase.bundle.js`.

## Required Policies
- Visual tests are mandatory for UI changes. Keep baselines updated intentionally and review reports in PRs.
- Atomic server logic via `rpc('toggle_read')` to avoid client races.
- Privacy mode option: hash normalized URLs (SHA-256) to reduce PII.

## File/Folder Plan
- `src/background/index.js` — commands, badge, messaging.
- `src/popup/` — `popup.html`, `popup.js`, `popup.css` (Pico).
- `src/options/` — `options.html`, `options.js` (config, diagnostics).
- `src/utils/` — url, storage, supabase client + AuthStorageAdapter.
- `src/lib/` — `pico.min.css`, vendored/bundled supabase ESM if needed.

## Testing Conventions
- Unit files: `tests/unit/**.test.js` (jsdom). Coverage via `npm run test:unit:coverage`.
- Integration: load extension with `--load-extension` when `chrome.*` is needed.
- Visual: viewport 380x560, low threshold (<=0.2), deterministic font.
- Seeding (optional): `SEED_USER_ID=<uuid> SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:supabase` to insert sample reads.
 - Optional RPCs: `list_recent(q text, page int, page_size int)` can return `{ items jsonb[], has_more bool }`; client will auto-detect and use it when present, else fallback to `.range()` paging.

## Open Questions
- Do we need search across titles/domains or full text? (Default: title/domain only.)
- Should we support OAuth flows? (Default: email/password; evaluate later.)
- Do we need Firefox support now or later? (If yes, add `browser_specific_settings.gecko`.)

## Useful Links
- Supabase docs: https://supabase.com/docs
- Pico.css docs: https://picocss.com/docs
- MDN WebExtensions: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions
- Chrome Extensions: https://developer.chrome.com/docs/extensions/
- ESLint: https://eslint.org/docs/latest/
- Prettier: https://prettier.io/docs/en/
- Vitest: https://vitest.dev/
- Playwright: https://playwright.dev/docs/intro
 - esbuild: https://esbuild.github.io/
