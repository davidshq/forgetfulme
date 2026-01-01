# Branch Comparison Scripts

This directory contains tools and scripts for comparing development branches in the ForgetfulMe project.

## Files

- **compare-branches.js** - Automated branch comparison script

## compare-branches.js

Compares code metrics, test coverage, and file structure across branches.

### Usage

```bash
# Compare default branches (main, openai, claude)
npm run compare-branches

# Compare specific branches
node scripts/compare-branches.js branch1 branch2 branch3

# Generate detailed comparison report
npm run compare-branches:detailed

# Save report to file
npm run compare-branches:save

# Custom options
node scripts/compare-branches.js --detailed --json --save main openai claude
```

### Options

- `--detailed` - Generate detailed comparison with file differences
- `--json` - Output results in JSON format instead of Markdown
- `--save` - Save report to a timestamped file

### Output

The script generates a report showing:

1. **Summary Table**
   - Branch existence status
   - Lines of code (LOC)
   - Number of files
   - Commit count
   - Last commit date

2. **Last Commit Messages**
   - Shows the most recent commit message for each branch

3. **Detailed Comparisons** (with `--detailed` flag)
   - Files unique to each branch
   - Common files between branches
   - Diff statistics (insertions/deletions)

4. **Recommendations**
   - Identifies branch with most code
   - Identifies branch with most commits
   - Suggests next steps

### Example Output

```
# Branch Comparison Report

Generated: 2026-01-01T17:56:43.623Z

## Summary

| Branch | Exists | LOC | Files | Commits | Last Commit Date |
|--------|--------|-----|-------|---------|------------------|
| main | ✅ | 18305 | 44 | 150 | 2026-01-01 |
| openai | ✅ | 18420 | 46 | 132 | 2025-12-30 |
| claude | ✅ | 18280 | 45 | 145 | 2025-12-31 |

## Last Commit Messages

### main
\`\`\`
Update error handling system
\`\`\`

### openai
\`\`\`
Implement real-time sync
\`\`\`

### claude
\`\`\`
Add comprehensive testing
\`\`\`

## Recommendations

- **openai** has the most lines of code (18420 LOC)
- **main** has the most commits (150 commits)
- Review the detailed comparison above to understand differences
- Consider running tests on each branch to compare quality
```

## Integration with npm

The comparison script is integrated into the npm scripts:

```json
{
  "scripts": {
    "compare-branches": "node scripts/compare-branches.js",
    "compare-branches:detailed": "node scripts/compare-branches.js --detailed",
    "compare-branches:save": "node scripts/compare-branches.js --detailed --save"
  }
}
```

## Use Cases

1. **Comparing AI Assistant Implementations**
   - Compare code written by different AI assistants (OpenAI GPT vs Anthropic Claude)
   - Identify differences in approach, style, and quality

2. **Feature Branch Comparison**
   - Compare feature branches against main
   - Identify scope of changes

3. **Code Review Preparation**
   - Generate statistics for code review discussions
   - Understand the impact of changes

4. **Development Progress Tracking**
   - Track how branches diverge over time
   - Monitor code growth and file changes

## Technical Details

### Metrics Collected

- **Lines of Code**: Counts all JavaScript files excluding node_modules and minified files
- **File Count**: Number of JavaScript files in the branch
- **Commit Count**: Total number of commits in the branch
- **Last Commit Date**: Date of the most recent commit
- **Last Commit Message**: Message from the most recent commit
- **File Lists**: Complete list of JavaScript files for comparison

### File Comparison

When comparing branches, the script identifies:
- Common files present in both branches
- Files unique to each branch
- Diff statistics between branches

### Performance

The script uses git commands to collect metrics without checking out branches, making it fast and non-disruptive to your current work.

## Future Enhancements

Potential improvements for the comparison tool:

1. **Test Coverage Comparison**
   - Collect and compare test coverage metrics
   - Identify branches with best test coverage

2. **Code Quality Metrics**
   - Integrate ESLint results
   - Compare code complexity

3. **Performance Metrics**
   - Extension load time
   - Memory usage
   - Build time

4. **Visual Diff**
   - Generate visual diffs for key files
   - Highlight significant changes

5. **Historical Tracking**
   - Save comparison results over time
   - Generate trend reports

## Related Documentation

- [Branch Comparison Guide](../docs/BRANCH_COMPARISON.md) - Comprehensive guide to branch comparison
- [Development README](../README.md) - Main project documentation
- [Testing Documentation](../tests/README.md) - Testing strategy and tools

## Contributing

To enhance the comparison script:

1. Fork the repository
2. Make your changes to `scripts/compare-branches.js`
3. Test with various branch configurations
4. Update this README with new features
5. Submit a pull request

## License

Same as the main ForgetfulMe project (MIT License).
