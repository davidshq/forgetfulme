# Branch Comparison Quick Start Guide

This guide provides a quick reference for comparing branches in the ForgetfulMe project.

## Quick Commands

### Compare default branches (main, openai, claude)
```bash
npm run compare-branches
```

### Compare specific branches
```bash
node scripts/compare-branches.js branch1 branch2
```

### Generate detailed comparison with file differences
```bash
npm run compare-branches:detailed
```

### Save comparison report to file
```bash
npm run compare-branches:save
```

## Example Output

```
Branch Comparison Tool
======================

Current branch: main

Comparing branches: main, openai, claude

# Branch Comparison Report

Generated: 2026-01-01T18:00:00.000Z

## Summary

| Branch | Exists | LOC | Files | Commits | Last Commit Date |
|--------|--------|-----|-------|---------|------------------|
| main   | ✅ | 18305 | 44 | 150 | 2026-01-01 |
| openai | ✅ | 18420 | 46 | 132 | 2025-12-30 |
| claude | ✅ | 18280 | 45 | 145 | 2025-12-31 |
```

## Common Use Cases

### 1. Before merging branches
```bash
# Compare your feature branch against main
node scripts/compare-branches.js main feature-branch

# Generate detailed report
npm run compare-branches:detailed -- main feature-branch
```

### 2. Weekly progress tracking
```bash
# Compare all development branches
npm run compare-branches:save

# Move report to documentation
mv branch-comparison-*.md docs/comparisons/weekly-$(date +%Y-%m-%d).md
```

### 3. Understanding AI development differences
```bash
# Compare OpenAI vs Claude implementations
node scripts/compare-branches.js --detailed openai claude
```

### 4. Quick branch status check
```bash
# Check if branches exist and their basic stats
npm run compare-branches
```

## Understanding the Output

### Summary Table
- **Branch**: Name of the branch
- **Exists**: ✅ if branch exists, ❌ if not
- **LOC**: Lines of code (JavaScript files only)
- **Files**: Number of JavaScript files
- **Commits**: Total commit count
- **Last Commit Date**: Date of most recent commit

### Detailed Comparison (with --detailed flag)
- **Common files**: Files present in both branches
- **Only in X**: Files unique to branch X
- **Diff Statistics**: Lines added/removed between branches

### Recommendations Section
Provides actionable insights based on the comparison:
- Which branch has the most code
- Which branch has the most commits
- Suggested next steps

## Advanced Options

### Custom branch comparison
```bash
node scripts/compare-branches.js branch1 branch2 branch3 branch4
```

### JSON output for automation
```bash
node scripts/compare-branches.js --json main openai > comparison.json
```

### Save with timestamp
```bash
npm run compare-branches:save
# Creates: branch-comparison-TIMESTAMP.md
```

## Integration with Git Workflow

### Before starting work
```bash
# Check current state of branches
npm run compare-branches
```

### After feature completion
```bash
# Compare your branch with main
node scripts/compare-branches.js --detailed main your-branch

# Save for documentation
npm run compare-branches:save -- main your-branch
mv branch-comparison-*.md docs/comparisons/feature-$(date +%Y-%m-%d).md
```

### Before code review
```bash
# Generate detailed report for reviewers
npm run compare-branches:detailed -- main pr-branch > pr-comparison.md
```

## Troubleshooting

### Branch doesn't exist
If you see ❌ next to a branch name:
```bash
# Create the branch from current state
git checkout -b branch-name

# Or fetch it from remote
git fetch origin branch-name
git checkout branch-name
```

### Empty statistics
If LOC/Files show 0 for an existing branch:
- The branch might have no JavaScript files
- Or the branch might not have commits yet

### Script errors
If the script fails to run:
```bash
# Check if git is available
git --version

# Make sure you're in the repository root
cd /path/to/forgetfulme

# Install dependencies
npm install
```

## File Locations

- **Script**: `scripts/compare-branches.js`
- **Documentation**: `docs/BRANCH_COMPARISON.md`
- **Reports**: `docs/comparisons/`
- **Script README**: `scripts/README.md`

## npm Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run compare-branches` | Compare default branches (main, openai, claude) |
| `npm run compare-branches:detailed` | Generate detailed comparison with file diffs |
| `npm run compare-branches:save` | Save detailed comparison report to file |

## Tips

1. **Regular Comparisons**: Run comparisons weekly to track progress
2. **Document Decisions**: Add notes to saved reports about why approaches differ
3. **Share Reports**: Reference comparison reports in pull requests
4. **Track Trends**: Keep historical reports to see how branches evolve
5. **Focus on Metrics**: Use LOC and commit counts to understand development velocity

## Related Documentation

- [Complete Branch Comparison Guide](../docs/BRANCH_COMPARISON.md)
- [Scripts Documentation](README.md)
- [Main Project README](../README.md)

## Quick Reference Card

```
# Most Common Commands

npm run compare-branches              # Quick comparison
npm run compare-branches:detailed     # Detailed comparison
npm run compare-branches:save         # Save to file

node scripts/compare-branches.js [branch1] [branch2] ...   # Custom branches
node scripts/compare-branches.js --json [branches...]      # JSON output
node scripts/compare-branches.js --detailed [branches...]  # Detailed
```

---

For more details, see the [complete documentation](../docs/BRANCH_COMPARISON.md).
