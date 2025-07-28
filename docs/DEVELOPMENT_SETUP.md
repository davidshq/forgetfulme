# Development Setup Guide

Quick setup guide for developers who want to contribute to ForgetfulMe extension.

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Chrome Browser** - For testing the extension
- **Git** - For version control
- **Supabase Account** - [Sign up free](https://supabase.com)

## Quick Start (5 minutes)

### 1. Clone and Install

```bash
git clone <repository-url>
cd forgetfulme
npm install
```

### 2. Set Up Backend

1. **Create Supabase project** at [supabase.com](https://supabase.com)
2. **Get credentials** from Settings → API:
   - Project URL: `https://your-project.supabase.co`
   - Anon key: `eyJ...` (the anon key)
3. **Run database setup** (copy from `assets/database/supabase-schema.sql`)

### 3. Configure Extension

**Option A: Use Extension Settings** (Recommended)
1. Load extension in Chrome (step 4 below)
2. Click extension icon → Settings → Supabase Configuration
3. Enter your Project URL and anon key
4. Click "Save Configuration"

**Option B: Local Config File**
```bash
cp supabase-config.template.js supabase-config.local.js
# Edit supabase-config.local.js with your credentials
```

### 4. Load Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked" → select project folder
4. Pin extension to toolbar

### 5. Verify Setup

```bash
npm test        # Run unit tests
npm run check   # Check code quality
```

## Development Commands

```bash
# Testing
npm test                    # Unit tests
npm run test:playwright     # Integration tests
npm run test:all           # All tests

# Code Quality
npm run lint               # Check linting
npm run lint:fix          # Fix linting issues
npm run format            # Format code
npm run check             # Lint + format check

# Useful for development
npm run test:unit:ui      # Unit tests with UI
npm run test:playwright:ui # Integration tests with UI

# Visual regression testing
npm run test:visual       # Run visual regression tests
npm run test:visual:update # Update visual baselines
```

## File Structure (Key Areas)

```
forgetfulme/
├── popup.html, popup.js           # Main extension popup
├── options.html, options/          # Settings page
├── background.js                   # Service worker
├── bookmark-management.html        # Bookmark manager
├── manifest.json                   # Extension configuration
├── supabase-service.js            # Backend service
├── utils/                         # Utility modules
├── tests/                         # Test files
├── docs/                          # Documentation
└── assets/database/               # Database schema
```

## Common Development Tasks

### Making Changes
1. **Edit code** in your preferred editor
2. **Reload extension** in Chrome (refresh button in chrome://extensions/)
3. **Test changes** manually and with tests
4. **Run code quality checks**: `npm run check`

### Adding Features
1. **Write tests first** (in `tests/unit/` or `tests/integration/`)
2. **Implement feature**
3. **Update documentation** if needed
4. **Run full test suite**: `npm run test:all`

### Debugging
- **Console logs**: Check browser DevTools → Console
- **Extension pages**: Right-click extension popup/options → Inspect
- **Background script**: Chrome → Extensions → Service Worker link
- **Test debugging**: `npm run test:playwright:debug`

## Testing Strategy

- **Unit tests** (`tests/unit/`) - Test individual modules
- **Integration tests** (`tests/integration/`) - Test component interactions
- **E2E tests** - Test complete user workflows

## Getting Help

1. **Check existing docs** in `docs/` folder
2. **Review test files** for usage examples
3. **Check `CLAUDE.md`** for architecture overview
4. **Look at existing code** for patterns and conventions

## Security Notes

- **Never commit** `supabase-config.local.js`
- **Use anon key only** (never service role key)
- **Test with your own Supabase project**
- **Don't share credentials** in issues/PRs

---

That's it! You should now have a working development environment. The extension uses a modular architecture with comprehensive testing, so check existing code for patterns when adding new features.