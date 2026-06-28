# ForgetfulMe Chrome Extension

A cross-browser extension that helps you mark websites as "read" for research purposes. Perfect for researchers, students, and anyone who needs to track which pages they've visited and categorize them.

## Features

### Core Functionality

- **Mark pages as read** with customizable status types
- **Add tags** to organize your entries
- **Keyboard shortcuts** for quick marking (Ctrl+Shift+R)
- **Cross-browser sync** using Supabase backend
- **Real-time synchronization** across all devices
- **Unlimited storage** for hundreds of thousands of entries

### Customizable Status Types

- Default types: "Read", "Good Reference", "Low Value", "Revisit Later"
- **Fully customizable** - add your own status types
- User-defined tags for better organization

### User Interface

- **Clean popup interface** for quick marking
- **Settings page** for customization and data management
- **Recent entries view** to see your latest marks
- **Statistics** to track your usage
- **Authentication system** for secure data access

### Data Management

- **Export/Import** functionality for data backup
- **Cross-device sync** through Supabase
- **Data statistics** and usage insights
- **Secure user accounts** with email/password

### Error Handling & Reliability

- **Centralized error handling** system for consistent user experience
- **User-friendly error messages** instead of technical jargon
- **Service worker compatibility** for background script reliability
- **Comprehensive error categorization** (network, auth, validation, etc.)
- **Smart retry logic** for transient failures
- **Graceful degradation** when services are unavailable

## Installation

### Prerequisites

Before using the extension, you need to set up a Supabase backend:

1. **Create a Supabase account** at [supabase.com](https://supabase.com)
2. **Follow the setup guide** in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
3. **Configure your extension** with your Supabase credentials

### For Development

1. **Clone or download** this repository
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up Supabase** following the setup guide
4. **Build bundled assets** (required after clone or when changing background/Supabase client):
   ```bash
   npm run build
   ```
   This produces `dist/background.js` and `supabase-js.min.js`. To rebuild only the Supabase client after upgrading `@supabase/supabase-js`, run `npm run bundle:supabase`.
5. **Configure your extension** with your credentials (see Configuration section below)
6. **Open Chrome** and navigate to `chrome://extensions/`
7. **Enable Developer mode** (toggle in top right)
8. **Click "Load unpacked"** and select the extension directory
9. **Pin the extension** to your toolbar for easy access

### For Users (Future Chrome Web Store Release)

1. Install from Chrome Web Store (coming soon)
2. Create an account or sign in
3. Start marking pages as read!

## Configuration

### Secure Configuration Management

The extension uses a secure configuration system that prevents sensitive credentials from being committed to version control:

#### Option 1: Extension Settings (Recommended for Users)

1. **Load the extension** in Chrome
2. **Open the options page** (click the extension icon → Settings)
3. **Go to Supabase Configuration** section
4. **Enter your Project URL and anon public key**
5. **Save the configuration**

#### Option 2: Environment Variables (Vitest / Node only)

For unit tests, `supabase-config.js` can fall back to `SUPABASE_URL` and
`SUPABASE_ANON_KEY` when Chrome storage is empty. This does not apply to the
loaded extension — use Option 1 there.

### Technical Notes

- **Local Supabase Client**: `@supabase/supabase-js` is bundled to `supabase-js.min.js` (`npm run bundle:supabase`) and imported as ESM by `supabase-config.js`
- **No CDN Dependencies**: Supabase runs from a local bundled module; network calls use the browser fetch API
- **CSP Compliant**: No external CDN scripts are loaded, ensuring compatibility with Chrome extension security policies

### Security Notes

- ✅ **Credentials are stored securely** in Chrome's sync storage
- ✅ **No sensitive data is committed** to version control
- ✅ **Configuration is validated** before saving
- ✅ **Connection is tested** after configuration
- ✅ **CSP compliant** - no external scripts loaded
- ⚠️ **Never commit** `.env` files or real credentials

## Development

### Project Structure

```
forgetfulme/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.js              # Popup functionality
├── options.html          # Settings page
├── options.js            # Settings functionality
├── supabase-js.min.js    # Bundled Supabase client (ESM, imported by supabase-config.js)
├── supabase-config.js    # Supabase configuration (secure)
├── supabase-service.js   # Supabase service layer
├── auth-ui.js            # Authentication UI
├── config-ui.js          # Configuration UI
├── supabase-schema.sql   # Database schema
├── background/           # Service worker source (bundled to dist/)
├── dist/                 # Bundled MV3 artifacts (background.js)
├── scripts/              # Build scripts (bundle-supabase, build-background)
├── utils/                # Utility modules
│   ├── auth-state-manager.js
│   ├── bookmark-transformer.js
│   ├── config-manager.js
│   ├── error-handler.js
│   ├── ui-components.js
│   └── ui-messages.js
├── tests/                # Comprehensive test suite
│   ├── unit/            # Unit tests (Vitest)
│   ├── helpers/         # Test utilities
│   ├── popup.test.js    # Integration tests (Playwright)
│   └── options.test.js  # Integration tests (Playwright)
├── docs/                 # Documentation
│   ├── architecture/    # Architecture guides
│   └── cursor-reports/  # Development reports
├── icons/               # Extension icons
├── package.json         # Dependencies and scripts
├── vitest.config.js     # Unit test configuration
├── playwright.config.js # Integration test configuration
├── eslint.config.js     # Code linting configuration
├── .gitignore          # Git ignore rules
├── SUPABASE_SETUP.md   # Setup guide
└── README.md           # This file
```

### Key Technologies

- **Manifest V3** - Latest Chrome extension standard
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Service Workers** - Background processing
- **Modern JavaScript** - ES6+ features
- **Row Level Security** - Database-level security
- **CSP Compliant** - Self-contained, no external dependencies
- **Vitest** - Fast unit testing framework
- **Playwright** - End-to-end testing
- **ESLint & Prettier** - Code quality and formatting

### Development Commands

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Run unit tests with UI
npm run test:unit:ui

# Run unit tests with coverage
npm run test:unit:coverage

# Run integration tests
npm run test:playwright

# Run integration tests with UI
npm run test:playwright:ui

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check code quality
npm run check
```

### Setting Up Development Environment

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up Supabase project** following the setup guide
4. **Configure credentials** using one of the methods above
5. **Run database schema** from `supabase-schema.sql`
6. **Load extension** in Chrome for testing
7. **Run tests** to ensure everything works: `npm test`

### Testing Strategy

The project uses a comprehensive testing approach:

#### Unit Tests (Vitest)

- **Location**: `tests/unit/`
- **Focus**: Individual utility modules and business logic
- **Coverage**: 90%+ target for utility modules
- **Framework**: Vitest with JSDOM environment

#### Integration Tests (Playwright)

- **Location**: `tests/` (popup.test.js, options.test.js)
- **Focus**: End-to-end user workflows
- **Browser**: Chromium-based browsers
- **Framework**: Playwright

#### Test Utilities

- **Test Factories**: Specialized test instance creation
- **Mock Utilities**: Chrome API and dependency mocking
- **Helper Functions**: Common test setup and teardown

### Code Quality

The project maintains high code quality through:

- **ESLint**: Code linting with custom rules
- **Prettier**: Code formatting
- **TypeScript-like JSDoc**: Type safety through documentation
- **Comprehensive Testing**: Unit and integration tests
- **Error Handling**: Robust error management
- **Security**: CSP compliance and secure practices

### Building for Distribution

1. **Add proper icons** to the `icons/` directory
2. **Update version** in `manifest.json`
3. **Run all tests**: `npm test && npm run test:playwright`
4. **Check code quality**: `npm run check`
5. **Test thoroughly** across different browsers
6. **Package for Chrome Web Store**

## Contributing

1. **Fork the repository**
2. **Set up your own Supabase project** for development
3. **Configure credentials** securely (see Configuration section)
4. **Create a feature branch**
5. **Make your changes**
6. **Run tests**: `npm test && npm run test:playwright`
7. **Check code quality**: `npm run check`
8. **Submit a pull request**

### Development Guidelines

- **Never commit sensitive credentials** to version control
- **Use the configuration UI** for testing
- **Follow the security best practices** outlined in the setup guide
- **Test authentication flows** thoroughly
- **Maintain CSP compliance** - no external scripts
- **Write tests** for new functionality
- **Follow code style** guidelines (ESLint + Prettier)
- **Update documentation** for new features

## Roadmap

### Phase 1 (Current)

- ✅ Basic marking functionality
- ✅ Custom status types
- ✅ Keyboard shortcuts
- ✅ Settings page
- ✅ Data export/import
- ✅ Supabase integration
- ✅ User authentication
- ✅ Secure configuration management
- ✅ CSP compliant implementation
- ✅ Comprehensive testing suite
- ✅ Code quality tools
- ✅ Enhanced documentation
- ✅ **Centralized error handling system**
- ✅ **User-friendly error messages**
- ✅ **Service worker compatibility**

### Phase 2 (Planned)

- 🔄 Advanced search and filtering
- 🔄 Bulk operations
- 🔄 Data analytics dashboard
- 🔄 Real-time collaboration features
- 🔄 Enhanced accessibility features

### Phase 3 (Future)

- 🔄 Firefox support
- 🔄 Safari support
- 🔄 Mobile companion app
- 🔄 Advanced analytics
- 🔄 API for third-party integrations

## Privacy & Security

- **Secure authentication** - Email/password with JWT tokens
- **Data isolation** - Row Level Security ensures user data separation
- **No tracking** - extension doesn't collect any analytics
- **User control** - full export/import capabilities
- **Open source** - transparent codebase
- **Encrypted transmission** - all data transmitted over HTTPS
- **Secure credential storage** - credentials stored in Chrome sync storage
- **CSP compliant** - no external scripts, self-contained functionality

## Cost Considerations

The extension uses Supabase's free tier which includes:

- 500MB database
- 50,000 monthly active users
- 2GB bandwidth
- 1GB file storage

This should be sufficient for most users. Monitor your usage in the Supabase dashboard.

## License

MIT License - see LICENSE file for details.

NOTE: supabase.min.js is Supabase's client library, it is not included in this license.

## Support

For issues, feature requests, or questions:

1. Check the existing issues
2. Create a new issue with detailed information
3. Include browser version and extension version
4. For Supabase-related issues, check the [setup guide](./SUPABASE_SETUP.md)
5. For configuration issues, see the Configuration section above
6. For testing issues, check the [testing documentation](./tests/README.md)

---

**ForgetfulMe** - Never forget what you've read! 📚
