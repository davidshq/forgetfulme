# Code Quality Setup

This document describes the ESLint and Prettier configuration for the ForgetfulMe Chrome extension.

## Overview

The project uses ESLint and Prettier to enforce code quality and consistent formatting. This setup was implemented based on the code review recommendations to improve code quality and maintainability.

## Configuration Files

### ESLint Configuration (`eslint.config.js`)

The ESLint configuration includes:

- **Chrome Extension Specific Rules**: Security rules for Chrome extension development
- **Code Quality Rules**: Unused variables, prefer const, no var, etc.
- **Best Practices**: Strict equality, curly braces, no empty blocks
- **Maintainability**: Complexity limits, max lines, max parameters
- **Prettier Integration**: Automatic formatting with Prettier

### Prettier Configuration (`.prettierrc`)

Prettier is configured with:
- Single quotes
- Semicolons
- 80 character line width
- 2 space indentation
- Trailing commas in ES5 mode

### Ignore Files

- `.prettierignore`: Excludes build outputs, dependencies, and generated files
- ESLint ignores are configured in `eslint.config.js`

## Available Scripts

```bash
# Lint all files
npm run lint

# Lint and auto-fix issues
npm run lint:fix

# Format all files with Prettier
npm run format

# Check if files are properly formatted
npm run format:check

# Run both lint and format check
npm run check
```

## Current Status

### Common Issues Found

1. **Unused Variables**: Parameters and variables that are defined but never used
2. **Console Statements**: Debug console.log statements throughout the codebase
3. **Complexity**: Some methods exceed the complexity limit of 10
4. **Line Count**: Some files exceed the 300 line limit
5. **Case Declarations**: Lexical declarations in case blocks without braces

## Chrome Extension Specific Configuration

The ESLint configuration includes globals for:
- Chrome Extension APIs (`chrome`, `browser`)
- DOM APIs (`window`, `document`, `console`)
- Browser APIs (`URL`, `Blob`, `requestAnimationFrame`)
- Custom extension classes (`UIComponents`, `UIMessages`, etc.)

## Integration with Development Workflow

### Pre-commit Hooks (Recommended)

Consider adding pre-commit hooks to automatically run:
```bash
npm run lint:fix && npm run format
```

### IDE Integration

Most IDEs can be configured to:
- Show ESLint errors and warnings in real-time
- Auto-format on save with Prettier
- Auto-fix ESLint issues on save

## Benefits

1. **Consistent Code Style**: All code follows the same formatting rules
2. **Early Bug Detection**: ESLint catches common programming errors
3. **Security**: Chrome extension specific security rules
4. **Maintainability**: Complexity and line count limits encourage better code structure
5. **Team Collaboration**: Consistent code style across all contributors

## Future Improvements

1. **Fix Remaining Issues**: Address the 27 errors and 109 warnings
2. **Add TypeScript**: Consider migrating to TypeScript for better type safety
3. **Custom Rules**: Add project-specific ESLint rules as needed
4. **CI Integration**: Add linting to continuous integration pipeline

## Troubleshooting

### Module Type Warning

If you see a warning about module type, ensure `"type": "module"` is in `package.json`.

### Prettier Conflicts

If Prettier and ESLint conflict, ensure `eslint-config-prettier` is included in the ESLint configuration.

### Custom Globals

If you add new global variables or classes, add them to the `globals` section in `eslint.config.js`. 