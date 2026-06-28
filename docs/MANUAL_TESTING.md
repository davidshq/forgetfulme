# ForgetfulMe Manual Testing Guide

Step-by-step manual test plan for the ForgetfulMe browser extension. Follow
sections in order for a full first-time walkthrough, or jump to a section to
retest a specific feature.

## Before You Start

### What you need

| Item | Notes |
|---|---|
| Chrome or Chromium-based browser | Manifest V3 extension |
| Supabase project | See [SUPABASE_SETUP.md](../SUPABASE_SETUP.md) |
| Built extension assets | Run `npm install && npm run build` from the repo root |
| Test account email | Use a disposable address for sign-up tests |
| Two normal web pages | e.g. a news article and a documentation page |

### Recommended test data

Use distinct URLs so duplicate-detection and search tests are easy to verify:

- Page A: any article or blog post
- Page B: a different article or docs page
- Tags to reuse: `research`, `tutorial`, `important`

### Resetting between test runs

To start fresh:

1. Open `chrome://extensions/` → ForgetfulMe → **Remove** (or clear extension
   storage).
2. Reload the unpacked extension.
3. Optionally clear bookmarks in Supabase (Settings → **Clear All Data**) or
   delete the test user in the Supabase dashboard.

---

## Part 1 — Install and Load the Extension

### 1.1 Build the extension

1. Open a terminal in the repository root.
2. Run:

   ```bash
   npm install
   npm run build
   ```

3. Confirm these files exist:
   - `dist/background.js`
   - `supabase-js.min.js`

**Expected:** Build completes without errors.

### 1.2 Load unpacked in Chrome

1. Open `chrome://extensions/`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the repository root folder (`forgetfulme/`).
5. Pin ForgetfulMe to the toolbar (puzzle icon → pin).

**Expected:**

- Extension appears in the list as **ForgetfulMe** v1.0.0.
- Toolbar icon is visible.
- No service-worker errors on the extension card.

### 1.3 Verify default keyboard shortcut

1. On the extension card, click **Details** (or open
   `chrome://extensions/shortcuts`).
2. Find **Mark current page as read**.

**Expected:** Default shortcut is **Ctrl+Shift+R** (Mac: **Command+Shift+R**).

---

## Part 2 — First Run (Not Configured)

These steps verify behavior before Supabase credentials are saved.

### 2.1 Popup shows setup screen

1. Click the ForgetfulMe toolbar icon.

**Expected:**

- Title: **Welcome to ForgetfulMe!**
- **Setup Required** section with numbered Supabase setup steps.
- **Open Settings** button.
- **How it works** section listing popup usage.

### 2.2 Open Settings from popup

1. Click **Open Settings**.

**Expected:** ForgetfulMe Settings tab opens (`options.html`).

### 2.3 Options page shows configuration form

With no credentials saved yet:

**Expected:**

- Heading: **Supabase Configuration**
- Fields: **Project URL**, **Anon Public Key**
- **Save Configuration** button
- Help section: *How to get your credentials*

### 2.4 Bookmark management before configuration

1. If you can reach bookmark management (via a bookmarked
   `chrome-extension://…/bookmark-management.html` URL), open it.
2. Or skip until Part 6.

**Expected (if opened):** Setup screen with **Open Settings**, same as popup.

---

## Part 3 — Supabase Configuration

Complete [SUPABASE_SETUP.md](../SUPABASE_SETUP.md) first (project, schema, RLS,
email confirmation off for extensions).

### 3.1 Save valid credentials

1. On the options page, enter:
   - **Project URL:** `https://<your-project>.supabase.co`
   - **Anon Public Key:** your `anon` key (starts with `eyJ`)
2. Click **Save Configuration**.

**Expected:**

- Loading message: *Saving configuration…*
- Success: *Configuration saved and verified! You can now use the extension.*

### 3.2 Validation — empty fields

1. Click **Edit Configuration**.
2. Clear both fields.
3. Click **Save Configuration**.

**Expected:** Error: *Please fill in all fields*.

### 3.3 Validation — invalid credentials

1. Enter a fake URL and fake anon key.
2. Click **Save Configuration**.

**Expected:** Error indicating save or connection test failed.

### 3.4 Configuration status (authenticated flow)

After saving valid credentials and signing in (Part 4):

1. Return to the options page main view.
2. Find the **Supabase Configuration** card.

**Expected:**

- **Supabase URL** shows your project URL.
- **Anon Key** shows a truncated value (`eyJ…`).
- **Connection** shows **Connected** (green) or **Failed** (red).
- **Test Connection** and **Edit Configuration** buttons are present.

### 3.5 Test Connection button

1. Click **Test Connection**.

**Expected:** **Connection** updates to **Connected** when credentials are valid.

---

## Part 4 — Authentication

Configuration must be saved before auth works.

### 4.1 Sign up — new account

1. Open the popup (or options page if it shows the login form).
2. Click **Sign up**.
3. Enter email, password (≥ 6 characters), and matching confirm password.
4. Click **Create Account**.

**Expected (email confirmation disabled in Supabase):**

- Loading: *Creating account…*
- Success: *Account created and signed in successfully!*
- Popup transitions to the main **Mark Current Page** interface.
- System notification: *Successfully signed in!* (after background auth sync)

**Expected (email confirmation enabled):**

- Message to check email, then redirect to sign-in form after ~3 seconds.

### 4.2 Sign up — validation errors

Test each case on the sign-up form:

| Step | Action | Expected message |
|---|---|---|
| Empty fields | Submit with blanks | *Please fill in all fields* |
| Password mismatch | Different password / confirm | *Passwords do not match* |
| Short password | Password under 6 chars | *Password must be at least 6 characters* |

### 4.3 Sign in — existing account

1. Sign out (see **Known limitations** below) or use a fresh profile.
2. Open popup → **Sign in**.
3. Enter valid email and password.
4. Click **Sign In**.

**Expected:**

- Loading: *Signing in…*
- Success: *Successfully signed in!*
- Main popup interface appears.

### 4.4 Sign in — wrong credentials

1. Enter valid email with wrong password.
2. Click **Sign In**.

**Expected:** User-friendly error (not a raw API message).

### 4.5 Toggle between login and sign-up

1. On login form, click **Sign up** link.
2. On sign-up form, click **Sign in** link.

**Expected:** Forms swap without page reload; fields are fresh.

---

## Part 5 — Popup: Mark Pages as Read

You must be signed in. Navigate to a normal HTTPS page (not `chrome://`).

### 5.1 Main popup layout

1. Open any normal web page.
2. Click the ForgetfulMe icon.

**Expected:**

- Header: **ForgetfulMe** with **⚙️ Settings** and **📚 Manage URLs**
- **Mark Current Page** card:
  - **Mark as:** dropdown (default status types)
  - **Tags (comma separated):** text field
  - **Mark as Read** submit button
- **Recent Entries** card (empty or showing prior entries)

### 5.2 Default status types

Open the **Mark as:** dropdown.

**Expected options:**

| Value | Display label |
|---|---|
| `read` | Read |
| `good-reference` | Good Reference |
| `low-value` | Low Value |
| `revisit-later` | Revisit Later |

### 5.3 Mark a new page

1. Navigate to **Page A**.
2. Open the popup.
3. Select **Good Reference**.
4. Enter tags: `research, tutorial`.
5. Click **Mark as Read**.

**Expected:**

- Success: *Page marked as read!*
- Tags field clears.
- Popup closes after ~1.5 seconds.
- **Recent Entries** (on next open) includes Page A with status and tags.
- Toolbar badge on this tab shows **✓** (green).

### 5.4 Mark without tags

1. Navigate to **Page B**.
2. Open popup, leave tags empty, click **Mark as Read**.

**Expected:** Bookmark saved with no tags; success message and popup close.

### 5.5 Duplicate URL — edit flow

1. Return to **Page A** (already saved).
2. Open the popup.
3. Change status to **Low Value**, add tag `updated`.
4. Click **Mark as Read**.

**Expected:**

- Edit interface opens (not a duplicate error).
- Shows bookmark title, URL, current status, tags, created date.
- **Update Status** dropdown and **Update Tags** field.
- **← Back** and **Update Bookmark** buttons.

### 5.6 Update existing bookmark from popup

1. From the duplicate edit view (5.5):
2. Set status to **Revisit Later**, tags to `research, important`.
3. Click **Update Bookmark**.

**Expected:**

- Success: *Bookmark updated successfully!*
- Returns to main popup after ~1.5 seconds.
- Recent entries reflect the update.

### 5.7 Cancel edit from popup

1. Trigger the edit view again (mark an already-saved page).
2. Click **← Back**.

**Expected:** Main popup interface restores without saving changes.

### 5.8 Restricted pages

1. Open `chrome://extensions/` or the extension popup page itself.
2. Open the ForgetfulMe popup.
3. Click **Mark as Read**.

**Expected:** Error: *Cannot mark browser pages as read*; no bookmark created.

### 5.9 Recent entries display

1. Save at least two pages.
2. Open the popup.

**Expected:**

- Up to **5** most recent entries shown.
- Each entry shows title, formatted status, relative time, and tags.
- Empty state (no entries yet): *No entries yet* with 📚 icon.

### 5.10 Open Settings from popup

1. Click **⚙️ Settings**.

**Expected:** Options page opens in a new tab.

### 5.11 Open bookmark management from popup

1. Click **📚 Manage URLs**.

**Expected:** Bookmark Management page opens in a new tab.

---

## Part 6 — Toolbar Badge and Background Behavior

Requires signed-in session.

### 6.1 Unsaved page badge

1. Navigate to a page you have **not** marked.
2. Wait a moment (tab load completes).

**Expected:** Toolbar badge shows **+** (blue) on the active tab.

### 6.2 Saved page badge

1. Navigate to a page you **have** marked.
2. Open the popup once (popup reports URL status to background).
3. Close popup; stay on the same tab.

**Expected:** Badge shows **✓** (green).

### 6.3 Badge after saving

1. Mark a new page from the popup.
2. Re-open the popup on that tab (or switch away and back).

**Expected:** Badge updates to **✓** without reloading the extension.

### 6.4 Badge on restricted pages

1. Switch to `chrome://extensions/`.

**Expected:** No badge (cleared).

### 6.5 Badge when signed out

1. Clear auth (see Known limitations) or use an unauthenticated profile.
2. Visit any page.

**Expected:** No badge.

---

## Part 7 — Keyboard Shortcut

Default: **Ctrl+Shift+R** / **Cmd+Shift+R**.

### 7.1 Shortcut when signed in

1. Sign in.
2. Navigate to an unsaved normal web page.
3. Press **Ctrl+Shift+R** (or **Cmd+Shift+R** on Mac).

**Expected:**

- Popup opens automatically (if the browser allows `openPopup`).
- Pending mark is queued for the active tab URL.
- Popup runs mark-as-read with current form defaults.
- If the page saves successfully, popup closes with success message.

**Fallback (when popup cannot auto-open):**

- Notification: *Click the extension icon to mark this page as read*
- Opening the popup manually within 30 seconds completes the queued mark.

### 7.2 Shortcut when signed out

1. Ensure you are not signed in.
2. Press the shortcut on any page.

**Expected:** Notification: *Please sign in to use keyboard shortcuts*.

### 7.3 Shortcut on restricted page

1. Focus a `chrome://` tab.
2. Press the shortcut.

**Expected:** Nothing happens (no popup, no notification).

---

## Part 8 — Settings Page (Authenticated)

Open via popup **Settings**, extension **Details → Extension options**, or
right-click icon → **Options**.

### 8.1 Page sections

**Expected cards:**

1. **Supabase Configuration** — status panel (Part 3.4)
2. **Statistics**
3. **Custom Status Types**
4. **Data Management**
5. **Bookmark Management**

### 8.2 Statistics

After saving several bookmarks with different statuses:

**Expected:**

| Stat | Source |
|---|---|
| Total Entries | Count of loaded bookmarks (up to 1000) |
| Status Types | Count of custom status types |
| Most Used Status | Status with highest bookmark count, or *None* |

Refresh by navigating away and back, or after import/clear operations.

### 8.3 Add custom status type

1. In **Custom Status Types**, enter `important` in **Status Name**.
2. Click **Add Status**.

**Expected:**

- Success: *Status type added successfully*
- List shows **Important** with a **Remove** button.
- Statistics **Status Types** count increases.
- Popup **Mark as:** dropdown includes **Important** on next open.

**Note:** Names are normalized to lowercase hyphenated form (`important`,
`my-status`).

### 8.4 Add duplicate status type

1. Try adding `important` again.

**Expected:** Error message (duplicate not allowed).

### 8.5 Add empty status type

1. Leave **Status Name** blank.
2. Click **Add Status**.

**Expected:** *Please enter a status type*.

### 8.6 Remove custom status type

1. Click **Remove** on a custom status (not a default you rely on for tests).

**Expected:**

- Success: *Status type removed successfully*
- Item disappears from list.
- Popup dropdown no longer includes that status.

### 8.7 Export all data

1. Click **Export All Data**.

**Expected:**

- JSON file downloads: `forgetfulme-export-YYYY-MM-DD.json`
- Success: *Data exported successfully*
- File contains exported bookmarks and metadata.

### 8.8 Import data

1. Click **Import Data**.
2. Select a valid export JSON from step 8.7 (or a known-good backup).

**Expected:**

- Success: *Data imported successfully*
- Statistics and status lists refresh.

### 8.9 Import invalid file

1. Click **Import Data**.
2. Select a non-JSON or malformed file.

**Expected:** User-friendly error message.

### 8.10 Clear all data

1. Click **Clear All Data**.
2. In the confirmation dialog, confirm.

**Expected:**

- Confirmation prompt: *Are you sure you want to clear all data?…*
- Success: *All data cleared successfully*
- Statistics show zero entries.
- Popup recent entries empty.

3. Click **Clear All Data** again and **Cancel**.

**Expected:** No data deleted.

### 8.11 Open bookmark management from settings

1. Click **📚 Manage Bookmarks**.

**Expected:** Bookmark Management tab opens.

---

## Part 9 — Bookmark Management Page

Open from popup **📚 Manage URLs** or settings **📚 Manage Bookmarks**.

### 9.1 Requires authentication

1. Sign out or use an unauthenticated session.
2. Open bookmark management.

**Expected:**

- **Authentication Required**
- Message: *Please authenticate in the extension popup…*
- **Close** button closes the tab.

### 9.2 Page layout (signed in)

**Expected:**

- Breadcrumb: ForgetfulMe → Bookmark Management
- Header: **Bookmark Management** with **← Back to Extension**
- Sidebar:
  - **Search & Filter** (query + status filter + Search button)
  - **Bulk Actions** (Select All, Delete Selected, Export Selected)
- Main area: **Bookmarks** list

### 9.3 Load all bookmarks

On first open with saved bookmarks:

**Expected:** All bookmarks listed (up to 100 per load), newest first.

Each row includes:

- Checkbox for bulk selection
- Title, status badge, relative time, tags
- **✏️ Edit**, **🗑️ Delete**, **🔗 Open** buttons

### 9.4 Search by text

1. Enter part of a bookmark title or tag in **Search Bookmarks**.
2. Click **Search**.

**Expected:** Only matching bookmarks shown.

### 9.5 Filter by status

1. Set **Filter by Status** to **Good Reference** (or another saved status).
2. Click **Search**.

**Expected:** Only bookmarks with that status shown.

### 9.6 Combined search and filter

1. Enter a search term and a status filter.
2. Click **Search**.

**Expected:** Results match both criteria.

### 9.7 Empty search results

1. Search for a string that matches nothing.

**Expected:**

- *No bookmarks found*
- Suggestion to adjust search or add bookmarks from popup.

### 9.8 Open bookmark

1. Click **🔗 Open** on a row.

**Expected:** Bookmark URL opens in a new tab.

### 9.9 Edit bookmark

1. Click **✏️ Edit** on a row.
2. Change status and tags.
3. Click **Update Bookmark**.

**Expected:**

- Success: *Bookmark updated successfully!*
- Returns to list view.
- Previous search/filter state preserved if you had filters active.

4. Click **✏️ Edit**, then **← Back to List**.

**Expected:** List restores with filters intact; no changes saved.

### 9.10 Delete single bookmark

1. Click **🗑️ Delete** on a row.
2. Confirm in the dialog.

**Expected:**

- Confirmation includes bookmark title.
- Success: *Bookmark deleted successfully!*
- Row removed without full page reload.

3. Click **🗑️ Delete**, then cancel.

**Expected:** Bookmark remains.

### 9.11 Bulk select

1. Check two or more bookmark checkboxes.

**Expected:**

- **Delete Selected** and **Export Selected** become enabled.

### 9.12 Select All / Deselect All

1. Click **Select All**.

**Expected:** All visible rows checked; button label becomes **Deselect All**.

2. Click **Deselect All**.

**Expected:** All unchecked; bulk buttons disabled.

### 9.13 Bulk delete

1. Select multiple bookmarks.
2. Click **Delete Selected**.
3. Confirm.

**Expected:**

- Confirmation shows count: *delete N bookmark(s)?*
- Success message with count.
- Selected rows removed.

### 9.14 Bulk export

1. Select multiple bookmarks.
2. Click **Export Selected**.

**Expected:**

- JSON download: `forgetfulme-bookmarks-YYYY-MM-DD.json`
- Success message with export count.
- File contains only selected bookmarks.

### 9.15 Close bookmark management

1. Click **← Back to Extension**.

**Expected:** Tab closes.

---

## Part 10 — Cross-Session and Sync Checks

Requires the same Supabase project configured on a second browser profile or
device (optional but recommended).

### 10.1 Persist configuration

1. Configure Supabase and sign in.
2. Close all ForgetfulMe tabs.
3. Restart the browser.
4. Open the popup.

**Expected:** Still signed in; main interface loads without re-entering
credentials.

### 10.2 Cross-device bookmark sync

1. Mark a page on Device/Profile A.
2. Open popup on Device/Profile B (same account, same Supabase project).

**Expected:** Bookmark appears in recent entries and bookmark management on B
within a normal refresh (immediate or after reopening popup).

### 10.3 Custom status types sync

1. Add a custom status on Profile A.
2. Open popup on Profile B.

**Expected:** Custom status appears in the **Mark as:** dropdown after config
syncs (Chrome sync storage).

---

## Part 11 — Error and Edge Cases

### 11.1 Offline / network failure

1. Disable network (airplane mode or DevTools → Offline).
2. Try to mark a page or load bookmark management.

**Expected:** User-friendly connection error; no uncaught exception in the
service worker console.

### 11.2 Expired session

1. Invalidate the session (delete `auth_session` in extension storage via
   DevTools, or wait for token expiry in a long-running test).
2. Try to save a bookmark.

**Expected:** Auth-related error prompting sign-in again.

### 11.3 Popup on extension pages

1. Open `chrome-extension://<id>/popup.html` in a tab (via extension URL).
2. Try to mark.

**Expected:** Restricted URL error.

### 11.4 Very long tag strings

1. Enter a long comma-separated tag list (200+ characters).
2. Save.

**Expected:** Saves or shows validation error gracefully (no UI freeze).

---

## Part 12 — Quick Regression Checklist

Use this checklist before a release:

| # | Test | Pass |
|---|---|:---:|
| 1 | Load unpacked extension | ☐ |
| 2 | First-run setup screen in popup | ☐ |
| 3 | Save Supabase configuration | ☐ |
| 4 | Sign up / sign in | ☐ |
| 5 | Mark new page with status + tags | ☐ |
| 6 | Duplicate URL opens edit view | ☐ |
| 7 | Update bookmark from popup | ☐ |
| 8 | Restricted URL blocked | ☐ |
| 9 | Recent entries (max 5) | ☐ |
| 10 | Toolbar badge + / ✓ | ☐ |
| 11 | Keyboard shortcut (signed in) | ☐ |
| 12 | Keyboard shortcut (signed out notification) | ☐ |
| 13 | Add / remove custom status type | ☐ |
| 14 | Statistics update | ☐ |
| 15 | Export all data | ☐ |
| 16 | Import data | ☐ |
| 17 | Clear all data (with cancel test) | ☐ |
| 18 | Bookmark management search + filter | ☐ |
| 19 | Edit / delete / open single bookmark | ☐ |
| 20 | Bulk select, delete, export | ☐ |
| 21 | Auth required gate on bookmark management | ☐ |
| 22 | Session persists after browser restart | ☐ |

---

## Known Limitations (as of v1.0.0)

Document these so testers do not file false bugs:

| Limitation | Detail |
|---|---|
| Sign out UI | `AuthUI.showUserProfile()` / **Sign Out** exist in code but are not wired into the main popup or options UI. To sign out during testing, remove the extension, clear site data, or delete `auth_session` from Chrome extension storage via DevTools. |
| Popup auto-open via shortcut | `chrome.action.openPopup()` may fail in some Chrome builds; a notification prompts manual click. |
| Bookmark list page size | Management page loads up to **100** bookmarks per query (`BOOKMARK_LIST_LIMIT`). |
| Clear all data | Deletes bookmarks one-by-one (up to 10,000 fetched); large libraries may take time. |
| Email verification | Works best with Supabase email confirmation **disabled** for extensions. |

---

## Reporting Issues

When filing a bug from manual testing, include:

1. Browser name and version
2. Extension version (`manifest.json`)
3. Steps to reproduce (section number from this doc)
4. Expected vs actual result
5. Console errors (`chrome://extensions/` → ForgetfulMe → **Inspect views**)
6. Whether Supabase email confirmation is on or off

---

## Related Documentation

- [SUPABASE_SETUP.md](../SUPABASE_SETUP.md) — Backend setup
- [README.md](../README.md) — Feature overview and development commands
- [tests/README.md](../tests/README.md) — Automated test suite
