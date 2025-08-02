# Tooling

## Version Control
- Git
- GitHub
- Husky

## CI/CD
- GitHub Actions

## Linting/Formatting
- ESLint
- Prettier

## Testing
- Coverage (vitest/coverage)
- Playwright
    - Integration Tests
    - Visual Regression Testing
- Vitest
    - Unit Tests

# Dependencies
## Backend
- Supabase
    - Used for bookmark data
- Chrome Storage Sync
    - Used for preferences, settings

# Architecture
- We store the credentials for Supabase in the supabase-credentials.js file, this file should be .gitignored.
    - We provide a template supabase-credentials.template.js
    - We also need to provide user credentials in this file so they can be used for testing.

# Odds and Ends Rules

## Testing
- We avoid mocking whenever possible. Mocking should be used for external dependencies.
- Ensure that Playwright and Vitest have separate setup/config files and that they don't attempt to run each others tests.

## Linting / Formatting
- Make sure that the Prettier and ESLint rules do not conflict (eslint-prettier-config).
- Exclude bundled libs from linting and formatting (src/lib/supabase-js.min.js and src/lib/pico.min.css)

## Code
- Place code in src subfolder
- Place tests in test subfolder
    - unit go into tests/unit
    - integration/visual go into tests/integration

# UI

## Popup View

### Register/Login View
- Has tabbed buttons, defaults to sign in.
- Has a forgot password button.

### Forgot Password View
- Has a button to return to Register/Login View

### Main UI View
- If logged in, then we display a mark as read page so folks can add/edit/delete bookmarks.
- At the top of the page
    - Shows the logged in user (email address, left)
    - Has a button that allows one to logout (right).
- Below this is two buttons:    
    - Has a button that allows one to view/manage bookmarks.
    - Has a button that allows one to view/manage settings.
- Below this is the area for marking a page as read
    - It has a drop down allowing one to select from the available statuses)
    - It has an input that allows one to type in comma separated tags
    - It has a button that says Save that actually saves the bookmark with tags
- Below this is the recent entries area
    - It has Recent Entries at the top
    - Below this is the title of the site, when it was read. The title should be a hyperlink to the site.

## Regular Pages
- Some pages are not in the popup.

### Settings (options)
- At the top of the page it has a button linking to Manage Bookamrks.
- Has a container that has the heading Status Types.
- By default it contains Done, Viewed, Revisit, Good
- One can edit/delete the original statuses as well as add/remove/update additional custom statuses.
- Below this is another container, this one has the heading Data Management. It says, "Export your bookmarks to JSON format, import data from a backup, or clear all stored data."
    - Export creates a JSON of the bookmarks
    - Import ingests a JSON of bookmarks
    - Clear All Data deletes the bookmarks locally and from Supabase
        - Make sure to have a confirmation dialog before actually clearing all data.

### Bookmark Management
- Has a search bar at the top with a search button.
- There is a filters button which shows a hidden panel for filtering items.
    - by date
    - by tag
    - by status (e.g. Done, Viewed...)
- Sort By
    - Created
    - Updated
    - Title
    - URL
- Bulk Options
    - Select All
    - Delete Selected
- Pagination is 25 by default, but can be customized to 50, 100.
- The data grid displaying the bookmarks should include the following columns
    - Checkmark column for selecting/deselecting a bookmark
    - 

### Email Confirmation Page
- Where one is redirected after clicking on Supabase email link.

# Architecture

## Error Handling

## Data Validation

## Logging

## Comments
- JSDoc style comments including type definitions.