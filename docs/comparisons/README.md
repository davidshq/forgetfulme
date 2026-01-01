# Branch Comparison Reports

This directory contains comparison reports between different development branches in the ForgetfulMe project.

## Purpose

This directory stores:
- Historical comparison reports between branches
- Baseline measurements of branch states
- Analysis of different development approaches
- Documentation of decisions based on comparisons

## Current Files

- **initial-baseline.md** - Baseline report created when comparison infrastructure was added

## Naming Convention

Comparison reports follow this naming pattern:
- `initial-baseline.md` - The first baseline report
- `branch-comparison-TIMESTAMP.md` - Automated comparison reports
- `comparison-YYYY-MM-DD-description.md` - Manual comparison reports with descriptive names

## Generating Reports

### Automated Reports

```bash
# Generate and display comparison
npm run compare-branches

# Generate detailed comparison
npm run compare-branches:detailed

# Save report to this directory
npm run compare-branches:save
# Then move: mv branch-comparison-*.md docs/comparisons/
```

### Manual Reports

You can also create manual comparison reports using the template in [Branch Comparison Guide](../BRANCH_COMPARISON.md).

## Report Contents

Each comparison report typically includes:

1. **Summary Table** - Overview of all branches (LOC, files, commits)
2. **Last Commit Messages** - Recent activity in each branch
3. **Detailed Comparisons** - File differences and change statistics
4. **Recommendations** - Suggested actions based on the comparison
5. **Analysis** - Notes on significant differences or patterns

## Using Reports for Decision Making

Comparison reports help with:

- **Feature Decisions**: Compare how different branches implement features
- **Code Quality**: Identify which approach has better test coverage or structure
- **Merge Planning**: Understand the scope of changes before merging
- **Learning**: Study different implementation approaches
- **Documentation**: Record why certain decisions were made

## Report Frequency

We recommend generating comparison reports:

- **Weekly**: For active development periods
- **After Major Features**: When significant work is completed
- **Before Merges**: To understand the impact of merging branches
- **Quarterly**: For long-term trend analysis

## Historical Tracking

Keep reports in this directory to track:
- How branches diverge over time
- Which development approach is most productive
- Patterns in code growth and file changes
- Evolution of the codebase

## Integration with Development Workflow

1. **Before Starting Work**: Review latest comparison to understand branch state
2. **During Development**: Generate comparisons to track progress
3. **Before Code Review**: Use reports to prepare for review discussions
4. **After Merging**: Document outcomes and lessons learned

## Best Practices

1. **Add Context**: Include notes about what was happening during the comparison
2. **Highlight Decisions**: Document why one approach was chosen over another
3. **Track Metrics**: Note trends in LOC, test coverage, and commit frequency
4. **Share Findings**: Reference reports in pull requests and discussions
5. **Clean Up**: Archive old reports if they're no longer relevant

## Example Workflow

```bash
# 1. Generate comparison
npm run compare-branches:save

# 2. Move to comparisons directory
mv branch-comparison-*.md docs/comparisons/comparison-$(date +%Y-%m-%d)-feature-x.md

# 3. Add context to the report
# Edit the file to add notes about current work

# 4. Reference in PR
# Include link to report in pull request description
```

## Related Documentation

- [Branch Comparison Guide](../BRANCH_COMPARISON.md) - Comprehensive methodology
- [Scripts README](../../scripts/README.md) - Automated comparison tools
- [Development Guidelines](../../README.md#development) - General development info

## Questions?

For questions about branch comparison or these reports, please:
1. Review the [Branch Comparison Guide](../BRANCH_COMPARISON.md)
2. Check existing reports for examples
3. Open an issue in the repository

## Contributing

When adding comparison reports:

1. Use the automated tool when possible
2. Add descriptive filenames for manual reports
3. Include context and analysis, not just raw data
4. Update this README if you add new types of reports
5. Reference reports in related pull requests

---

Last Updated: 2026-01-01
