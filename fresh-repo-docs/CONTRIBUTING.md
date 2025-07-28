# Contributing to ForgetfulMe

Thank you for your interest in contributing! This guide covers the essential information for contributing effectively.

## Quick Start

1. **Read** [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md) for setup instructions
2. **Fork** the repository
3. **Create a branch** for your changes
4. **Make your changes** following the guidelines below
5. **Test thoroughly** and **submit a pull request**

## Code Guidelines

### JavaScript & JSDoc
- Use **ES6+ modules** with proper imports/exports
- Use **JSDoc comments** for type safety and documentation
- Follow **existing patterns** in the codebase
- Prefer **vanilla JavaScript** over frameworks

```javascript
/**
 * Example function with proper JSDoc
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
function isValidUrl(url) {
  // Implementation
}
```

### Architecture
- Follow the **modular service architecture**
- Use **dependency injection** for testability
- Keep **services focused** on single responsibilities
- Use the **centralized error handling** system

### Testing
- **Write tests** for new functionality
- Follow **behavior-focused testing** approach
- Use **test factories** for consistent test data
- Test both **unit** and **integration** scenarios

```bash
# Run tests before submitting
npm run test:all    # All tests
npm run check       # Code quality
```

## Submission Process

### Before Submitting
1. **Run all tests**: `npm run test:all`
2. **Check code quality**: `npm run check`
3. **Test manually** in Chrome
4. **Update documentation** if needed

### Pull Request Guidelines
- **Clear title** describing the change
- **Link to issue** if applicable
- **Describe what changed** and why
- **Include test results** if relevant
- **Small, focused changes** are preferred

### Review Process
- Maintainers will review your PR
- Address feedback promptly
- Keep PR up to date with main branch
- Be patient and respectful

## Security Requirements

### Never Commit Sensitive Data
- No Supabase credentials in code
- No API keys or secrets
- Use `supabase-config.local.js` for local development
- Check `.gitignore` is working properly

### Chrome Extension Security
- Maintain **CSP compliance**
- Use only **necessary permissions**
- Follow **security best practices**
- Test with different security settings

## Types of Contributions

### Bug Fixes
- **Include steps to reproduce** the bug
- **Add regression tests** when possible
- **Test the fix** thoroughly
- **Keep changes minimal** and focused

### New Features
- **Discuss in an issue first** for larger features
- **Follow existing architecture patterns**
- **Include comprehensive tests**
- **Update documentation**
- **Consider accessibility** implications

### Documentation
- **Fix typos** and **clarify instructions**
- **Add examples** where helpful
- **Keep documentation current** with code changes
- **Focus on clarity** over completeness

### Performance Improvements
- **Measure performance impact**
- **Include benchmarks** if relevant
- **Don't break existing functionality**
- **Consider edge cases**

## Development Standards

### Code Quality
- **ESLint** and **Prettier** are enforced
- **JSDoc comments** for public APIs
- **Meaningful variable names**
- **No unused imports** or variables

### Error Handling
- Use the **centralized ErrorHandler**
- Provide **user-friendly error messages**
- **Handle edge cases** gracefully
- **Test error scenarios**

### Accessibility
- Follow **ARIA guidelines**
- Ensure **keyboard navigation** works
- Test with **screen readers** when possible
- Maintain **focus management**

## Getting Help

### Before Asking
1. **Check existing documentation**
2. **Search existing issues**
3. **Review similar code** in the codebase
4. **Try debugging** with available tools

### Where to Ask
- **GitHub Issues** for bugs and feature requests
- **GitHub Discussions** for questions and ideas
- **Code comments** for clarification during review

### What to Include
- **Clear description** of the problem
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Browser and extension version**
- **Relevant code snippets**

## Recognition

Contributors will be:
- **Listed in release notes** for significant contributions
- **Credited in documentation** where appropriate
- **Thanked publicly** for their help

---

## Code of Conduct

- **Be respectful** and professional
- **Help others learn** and improve
- **Focus on the code**, not the person
- **Assume good intentions**
- **Ask questions** when unclear

Thank you for contributing to ForgetfulMe! 🙏