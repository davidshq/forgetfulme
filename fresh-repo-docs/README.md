# ForgetfulMe Chrome Extension

A Chrome extension that helps you mark websites as "read" for research purposes. Built with Manifest V3, simplified architecture, and comprehensive visual regression testing.

## Features

- **Mark pages as read** with customizable status types
- **Add tags** to organize your entries  
- **Keyboard shortcuts** for quick marking (Ctrl+Shift+R)
- **Cross-device sync** using Supabase backend
- **Real-time synchronization** across all devices
- **Visual regression testing** to prevent UI issues

## Quick Start

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Chrome Browser** - For testing the extension
- **Supabase Account** - [Sign up free](https://supabase.com)

### Setup (5 minutes)

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd forgetfulme
   npm install
   ```

2. **Set up backend**: Follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

3. **Load extension**:
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked" → select project folder
   - Pin extension to toolbar

4. **Configure**: Click extension icon → Settings → Enter your Supabase URL and anon key (no build step required)

5. **Verify**: Run `npm test` to ensure everything works

## Development

### Tech Stack
- **JavaScript**: Vanilla ES6+ with JSDoc type annotations
- **Chrome Extension**: Manifest V3 with service workers
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **CSS**: Pico.css v2 (semantic HTML-first approach)
- **Testing**: Vitest (unit) + Playwright (integration + visual regression)
- **Code Quality**: ESLint + Prettier

### Architecture
- **6 focused services** instead of 50+ modules
- **Dependency injection** for testability
- **Progressive enhancement** (static HTML + JavaScript)
- **Visual regression testing** with before/after screenshots

### Key Commands
```bash
# Development
npm test                    # Unit tests
npm run test:playwright     # Integration tests  
npm run test:visual         # Visual regression tests
npm run test:visual:update  # Update visual baselines

# Code Quality
npm run lint               # Check linting
npm run format            # Format code
npm run check             # Lint + format check
```

## Documentation

- **[FUNCTIONAL_REQUIREMENTS.md](./FUNCTIONAL_REQUIREMENTS.md)** - What the extension does
- **[TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)** - How it's built
- **[API_INTERFACES.md](./API_INTERFACES.md)** - Service contracts and types
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database design
- **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)** - Testing approach with visual regression
- **[DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)** - Detailed setup guide
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines

## Key Benefits

### For Users
- Simple, fast interface for marking websites
- Customizable status types and tags
- Cross-device synchronization
- Keyboard shortcuts for efficiency

### For Developers
- **Simplified architecture** - 6 services vs 50+ modules
- **Visual regression testing** - See UI changes immediately
- **No build step** - Direct JavaScript development
- **Comprehensive testing** - Unit, integration, and visual tests
- **Clear documentation** - Everything needed to contribute

## Contributing

1. Read [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md) for setup
2. Check [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines
3. Fork the repository and create a feature branch
4. Make changes and run tests: `npm run test:all`
5. Submit a pull request

## Security & Privacy

- **Secure authentication** with JWT tokens
- **Row Level Security** ensures user data isolation
- **No tracking** - extension doesn't collect analytics
- **Open source** - transparent codebase
- **CSP compliant** - no external scripts

## License

MIT License - see LICENSE file for details.

---

**ForgetfulMe** - Never forget what you've read! 📚

Built with ❤️ using modern JavaScript, comprehensive testing, and visual regression to ensure a great user experience.