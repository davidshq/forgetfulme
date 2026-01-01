# Branch Comparison Guide

## Overview

This document provides a comprehensive guide for comparing different development branches in the ForgetfulMe Chrome Extension project. It's particularly useful for comparing implementations from different development approaches (e.g., code written by different AI assistants or development methodologies).

## Purpose

The main, openai, and claude branches are intended to track:
- **main**: The primary development branch with stable features
- **openai**: Development work primarily done with OpenAI's GPT models
- **claude**: Development work primarily done with Anthropic's Claude models

## Branch Comparison Methodology

### 1. Code Quality Metrics

Compare branches based on:
- Lines of code (LOC)
- Test coverage percentage
- Number of files
- Code complexity
- ESLint/Prettier compliance

### 2. Feature Completeness

Track which features are implemented in each branch:
- Core functionality (marking pages, status types, tags)
- User authentication
- Supabase integration
- Real-time sync
- Error handling
- Test coverage
- Documentation quality

### 3. Architecture Differences

Document architectural decisions in each branch:
- File structure and organization
- Module dependencies
- Service layer design
- Error handling approach
- State management
- Testing strategy

### 4. Performance Metrics

Compare performance characteristics:
- Extension load time
- Memory usage
- Database query efficiency
- Real-time sync latency
- UI responsiveness

## Using the Comparison Script

The repository includes a comparison script (`scripts/compare-branches.js`) that automates branch analysis:

```bash
# Compare all branches
npm run compare-branches

# Compare specific branches
npm run compare-branches -- main openai

# Generate detailed report
npm run compare-branches -- --detailed main openai claude
```

## Manual Comparison Steps

### Step 1: Checkout Each Branch

```bash
# Save current work
git stash

# Compare main branch
git checkout main
npm test
npm run lint

# Compare openai branch
git checkout openai
npm test
npm run lint

# Compare claude branch
git checkout claude
npm test
npm run lint
```

### Step 2: Generate Statistics

For each branch, collect:

```bash
# Lines of code
find . -name "*.js" -not -path "*/node_modules/*" -not -path "*/tests/*" | xargs wc -l

# Test coverage
npm run test:unit:coverage

# File count
find . -name "*.js" -not -path "*/node_modules/*" | wc -l

# ESLint issues
npm run lint -- --format json > lint-report.json
```

### Step 3: Feature Comparison Matrix

Create a comparison matrix:

| Feature | main | openai | claude | Notes |
|---------|------|--------|--------|-------|
| Basic marking | ✅ | ✅ | ✅ | All implementations complete |
| Custom status | ✅ | ✅ | ✅ | Similar approach |
| Authentication | ✅ | ✅ | ✅ | Different UI flows |
| Real-time sync | ✅ | ✅ | ⚠️ | Claude: partial implementation |
| Error handling | ✅ | ⚠️ | ✅ | OpenAI: needs improvement |
| Test coverage | 85% | 78% | 92% | Claude: highest coverage |
| Documentation | ✅ | ⚠️ | ✅ | OpenAI: needs more docs |

### Step 4: Code Review

Review specific implementations:

```bash
# Compare specific files
git diff main..openai -- popup.js
git diff main..claude -- popup.js
git diff openai..claude -- popup.js

# Compare entire directories
git diff main..openai -- utils/
git diff main..claude -- utils/
```

## Comparison Report Template

Use this template to document findings:

```markdown
# Branch Comparison Report
Date: YYYY-MM-DD

## Summary
Brief overview of comparison findings.

## Code Quality Metrics

### main branch
- LOC: X
- Files: Y
- Test Coverage: Z%
- ESLint Issues: N

### openai branch
- LOC: X
- Files: Y
- Test Coverage: Z%
- ESLint Issues: N

### claude branch
- LOC: X
- Files: Y
- Test Coverage: Z%
- ESLint Issues: N

## Feature Comparison

### Completed Features
- Feature 1: main ✅, openai ✅, claude ✅
- Feature 2: main ✅, openai ⚠️, claude ✅

### Architecture Differences
- main: [description]
- openai: [description]
- claude: [description]

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

## Action Items

- [ ] Merge best practices from [branch]
- [ ] Address issues in [branch]
- [ ] Update documentation in [branch]
```

## Best Practices for Branch Comparison

1. **Regular Comparison**: Compare branches weekly or after major features
2. **Automated Testing**: Always run full test suite before comparison
3. **Document Differences**: Keep detailed notes on why approaches differ
4. **Merge Best Practices**: Identify and merge the best implementations
5. **Performance Testing**: Test real-world performance, not just code quality
6. **User Experience**: Consider UX differences between implementations
7. **Maintainability**: Evaluate which approach is easier to maintain

## Tools and Resources

### Comparison Tools
- `git diff` - Command-line file comparison
- `git log` - Commit history analysis
- `npm run compare-branches` - Automated comparison script
- GitHub's compare view - Visual diff in browser

### Quality Tools
- ESLint - Code quality analysis
- Prettier - Code formatting consistency
- Vitest - Test coverage reports
- Playwright - Integration testing

### Metrics Collection
- Lines of code: `cloc` or `wc -l`
- Code complexity: `eslint-plugin-complexity`
- Test coverage: Vitest coverage reports
- Performance: Chrome DevTools profiling

## Frequently Asked Questions

### Q: Which branch should be used for production?
A: The `main` branch is the primary production branch. Other branches are for experimental development and comparison.

### Q: How do I merge changes from one branch to another?
A: Use Git's merge or cherry-pick commands:
```bash
git checkout main
git merge openai    # Merge all changes
# OR
git cherry-pick <commit-hash>  # Pick specific commits
```

### Q: What if branches have diverged significantly?
A: Consider:
1. Identifying the best approach for each feature
2. Creating a new integration branch
3. Manually porting the best implementations
4. Documenting reasons for choosing each approach

### Q: How do I handle merge conflicts?
A: 
1. Review both implementations carefully
2. Test both approaches if possible
3. Choose based on code quality, test coverage, and maintainability
4. Document the decision in commit messages

## Related Documentation

- [DESIGN.md](architecture/DESIGN.md) - Project architecture
- [CODE_REVIEW.md](../CODE_REVIEW.md) - Code review guidelines
- [Testing README](../tests/README.md) - Testing documentation
- [SUPABASE_SETUP.md](../SUPABASE_SETUP.md) - Backend setup

## Contributing

When working with multiple branches:

1. **Create feature branches** from the appropriate base branch
2. **Document your approach** in commit messages
3. **Run all tests** before pushing
4. **Update comparison reports** after major changes
5. **Tag releases** appropriately for each branch

## Conclusion

Regular branch comparison helps:
- Identify best practices across different development approaches
- Maintain code quality and consistency
- Learn from different implementation strategies
- Make informed decisions about merging approaches
- Track the evolution of the codebase

For questions or suggestions, please open an issue in the repository.
