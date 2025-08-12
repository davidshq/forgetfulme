# ForgetfulMe v2 — Architecture & Rebuild Guide

Goal: rebuild the Chrome extension with a minimal, clear architecture that prioritizes correctness, maintainability, and simplicity while keeping Supabase for sync and Pico.css for UI.

## Objectives & Scope
- Track pages you’ve read across devices using Supabase.
- Core actions: Sign in/out, mark current page read/unread, show recent reads, quick search/filter.
- Keyboard shortcut to toggle read state; badge reflects status.
- Minimal, framework‑free UI using Pico.css and vanilla JS modules.

## High‑Level Architecture (MV3)
- Background (service worker): command handling, badge updates, lightweight sync. No content scripts by default.
- Popup (UI): auth, current page status, recent list, quick actions.
- Options: Supabase config (URL, anon key), session info, simple diagnostics.
- Storage: `chrome.storage.local` for config/session; Supabase for persistent data. Optional offline queue.

## Directory Structure
```
src/
  background/        # service worker modules
  popup/             # popup.html, popup.js, popup.css
  options/           # options.html, options.js
  lib/               # pico.min.css, vendor/supabase-js ESM (bundled or vendored)
  utils/             # url, storage, supabase client helpers
```

## Manifest (MV3) — minimal
```json
{
  "manifest_version": 3,
  "name": "ForgetfulMe",
  "version": "2.0.0",
  "action": { "default_popup": "src/popup/popup.html" },
  "background": { "service_worker": "src/background/index.js", "type": "module" },
  "options_page": "src/options/options.html",
  "permissions": ["storage", "tabs", "activeTab"],
  "host_permissions": [],
  "commands": { "mark_as_read": { "suggested_key": {"default": "Ctrl+Shift+R"}, "description": "Toggle read state" } }
}
```

Notes (per MV3 best practices):
- Do not load remote scripts (no CDNs). Bundle or vendor `@supabase/supabase-js` locally and import as ESM.
- Background is event‑driven; avoid long‑lived globals. Recreate clients on demand.
- Cross‑browser: add `browser_specific_settings.gecko` for Firefox if targeting it.

## Supabase Schema & Security
SQL (run in Supabase SQL editor):
```sql
-- Required for gen_random_uuid on some stacks
create extension if not exists pgcrypto;

create table if not exists public.reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text,
  domain text,
  status text not null default 'read' check (status in ('read','unread')),
  first_read_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  visit_count int not null default 1,
  constraint unique_user_url unique (user_id, url)
);

alter table public.reads enable row level security;

create policy "select own reads" on public.reads for select using (auth.uid() = user_id);
create policy "insert own reads" on public.reads for insert with check (auth.uid() = user_id);
create policy "update own reads" on public.reads for update using (auth.uid() = user_id);
create policy "delete own reads" on public.reads for delete using (auth.uid() = user_id);

-- Keep last_read_at current and increment visit_count atomically
create or replace function public.toggle_read(p_url text, p_title text, p_domain text)
returns table(id uuid, status text, visit_count int) language plpgsql as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;
  insert into public.reads(user_id, url, title, domain, status)
  values (v_user, p_url, p_title, p_domain, 'read')
  on conflict (user_id, url)
  do update set 
    status = case when public.reads.status = 'read' then 'unread' else 'read' end,
    last_read_at = now(),
    visit_count = public.reads.visit_count + 1
  returning public.reads.id, public.reads.status, public.reads.visit_count into id, status, visit_count;
  return next;
end;$$;

grant execute on function public.toggle_read(text,text,text) to anon, authenticated;
```

## Core Flows (pseudocode)
Auth (popup):
```js
// options: set SUPABASE_URL + SUPABASE_ANON_KEY in chrome.storage.local
const supabase = createClient(url, anonKey);
await supabase.auth.signInWithPassword({ email, password });
// session stored by supabase-js; also cache user in storage for quick checks
```

Toggle read for current tab (background):
```js
const url = await getActiveTabUrl();
const normalized = normalizeUrl(url);
// Atomic toggle + counters in SQL
await sb.rpc('toggle_read', { p_url: normalized, p_title: title, p_domain: getDomain(normalized) });
updateBadgeForUrl(normalized);
```

Bootstrap (popup open):
```js
const [url, user] = await Promise.all([getActiveTabUrl(), getUser()]);
if (!user) showAuth(); else renderStatus(await fetchStatus(url));
renderRecent(await listRecent());
```

## Utilities (keep tiny)
- URL normalization: strip hash, trim trailing slash, lowercase host.
- Storage helpers: wrap `chrome.storage.local.get/set` with Promises.
- Supabase client: lazy init from stored config. In background (no window), use a custom `AuthStorageAdapter` backed by `chrome.storage.local` per Supabase docs. Handle 401 by prompting re‑auth.

Privacy mode (optional):
- Use SHA‑256 of normalized URL as the unique key, plus `domain` and optional `title`. Reduces PII while enabling dedupe and counts. Expose a toggle in Options.

## UI (Pico.css)
- Static HTML + Pico.css classes; minimal JS to bind events.
- Popup: header, status pill (read/unread), “Toggle” button, list of last N reads, small search box.
- Options: inputs for Supabase URL and anon key; “Test connection” button; sign‑out button.
- MV3 CSP: no inline scripts if avoidable; use `<script type="module" src="...">` and local modules only.
 - Reduce screenshot diffs: fix viewport, use a deterministic font stack in CSS.

## Testing Strategy
- Unit (Vitest + jsdom): url utils, storage wrappers, badge logic, reducers.
- Integration (Playwright): popup rendering, auth forms, toggle flow, keyboard command.
  - For tests that rely on `chrome.*`, launch Chromium with the extension loaded via a persistent context and `--load-extension`.
- Visual (MANDATORY): baseline screenshots and diffs for key UI states (popup read/unread, auth, recent list). Required for all UI changes and bug fixes.
  - Run: `npm run test:visual` (compare against baselines).
  - Update baselines only after intentional UI changes: `npm run test:visual:update`.
  - Review diffs/report locally: `npm run test:visual:report`.
  - PRs must include a note on visual results (no unexpected diffs); attach report screenshots for fixes.
  - Use fixed viewport (e.g., 380x560) and stable device scale factor; keep thresholds consistent (<= 0.2).

Example visual test (Playwright):
```js
import { test, expect } from '@playwright/test';

test('popup shows read state', async ({ page }) => {
  // Load popup directly via file URL; seed storage/mocks as needed
  await page.goto('file://' + process.cwd() + '/src/popup/popup.html');
  // Ensure deterministic state (e.g., mark as read via JS or mocked storage)
  await expect(page).toHaveScreenshot('popup-read.png');
});
```

Example extension launch for integration:
```js
import { chromium, test } from '@playwright/test';
test.use({ viewport: { width: 380, height: 560 } });
test('popup loads inside extension context', async () => {
  const pathToExtension = process.cwd(); // folder with manifest.json
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`
    ]
  });
  const [page] = context.backgroundPages(); // or service worker/page handling
  // open popup.html via chrome-extension:// protocol if needed
  await context.close();
});
```

## Linting & Formatting
- ESLint: run `npm run lint` (auto-fix with `npm run lint:fix`). Config at `eslint.config.js` (ESM, no var, prefer-const, JSDoc hints). Docs: https://eslint.org/docs/latest/
- Prettier: format with `npm run format` (check with `npm run format:check`). Config at `prettier.config.js` (2 spaces, single quotes, 100 width). Docs: https://prettier.io/docs/en/
- CI/Local quality: `npm run check` (lint + format check) and `npm run check:all` (adds tests + coverage).

## Implementation Plan (milestones)
1) Scaffolding: manifest, folders, Pico.css, minimal popup/options.
2) Config & client: store Supabase URL/key, create client helper.
3) Auth: email/password forms, sign in/out, session restore.
4) Reads API: insert/update/list; URL normalization.
5) Background: command + badge + message handlers.
6) Popup: current page status + toggle + recent list + search.
7) Tests: unit first, then Playwright happy‑paths.
8) Polish: error states, loading, empty states; audit permissions.

## Best Practices & Notes
- Keep background stateless; re‑init Supabase client on demand.
- Use RLS; never send admin keys to the client.
- Handle offline by queueing toggles in `chrome.storage.local` and retry on focus.
- Limit permissions to `storage`, `tabs`, `activeTab`; avoid host permissions.
- Respect performance: avoid polling; react to popup open and command events.
- Privacy: only store normalized URL/title/domain; no page content.

## Environment & Commands
- Required env in options: `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- Dev: `npm run install-browsers`, `npm run check`, `npm test`, then load unpacked via `chrome://extensions`.
- Build/bundle (if used): ensure `@supabase/supabase-js` is packaged locally; no remote scripts.

Auth recommendation:
- Prefer email/password for simplicity inside MV3. OAuth/magic links in extensions require `chrome.identity.launchWebAuthFlow` and extra permissions; add only if needed.

This guide is the single source to rebuild v2 focusing on clear functionality with Supabase sync and Pico.css UI.

## References & Resources
- Supabase: https://supabase.com/docs (Auth, JS client, RLS policies)
- Pico.css: https://picocss.com/docs (classes, theming, usage)
- WebExtensions (MDN): https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions (APIs, permissions, UX)
- Chrome Extensions: https://developer.chrome.com/docs/extensions/ (MV3, service workers, actions, storage, commands)
- Vitest: https://vitest.dev/ (config, jsdom, coverage)
- Playwright: https://playwright.dev/docs/intro (test runner, screenshots, reporters)
