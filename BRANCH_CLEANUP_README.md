# Branch Cleanup Quick Reference

This directory contains analysis and scripts for cleaning up repository branches.

## Files

- **`BRANCH_ANALYSIS.md`** - Comprehensive analysis of all 16 branches with recommendations
- **`branch-cleanup-scripts.sh`** - Interactive script to execute cleanup phases
- **`BRANCH_CLEANUP_README.md`** - This file

## Quick Start

### 1. Review the Analysis
```bash
cat BRANCH_ANALYSIS.md
```

Read through the full analysis to understand:
- Which branches exist and their status
- Why certain branches are recommended for deletion
- Security implications of pending PRs

### 2. Run the Interactive Script
```bash
./branch-cleanup-scripts.sh
```

The script provides a menu-driven interface to:
- Merge security updates (Priority 1)
- Delete safe-to-remove branches (Priority 2)
- Guide manual evaluation of rewrite branches (Priority 3)

### 3. Or Execute Commands Manually

#### Immediate Actions (Security - Do First!)
```bash
# Merge critical security updates
gh pr merge 6 --squash  # js-yaml vulnerability fix
gh pr merge 8 --squash  # glob security update
gh pr merge 5 --squash  # vite security update
```

#### Safe Deletions
```bash
# Delete merged branches
git push origin --delete pico

# Delete archive branches
git push origin --delete main-old-23-07-2025
git push origin --delete old-main-2025-01-08

# Delete abandoned branches
git push origin --delete more-oversight-rewrite
git push origin --delete refactor
```

#### Requires Evaluation (Owner Decision)
```bash
# Review each rewrite branch before deleting:
git log --oneline origin/claude-rewrite-from-scratch
git diff main...origin/claude-rewrite-from-scratch

# If no valuable changes, close PR and delete:
gh pr close 2
git push origin --delete claude-rewrite-from-scratch

# Repeat for:
# - claude-rewrite-refactor
# - claude-rewrite-refactor-simplify
# - openai-rewrite
```

## Summary of Recommendations

| Category | Branches | Action | Priority |
|----------|----------|--------|----------|
| **Security Updates** | 5 | Merge PRs | 🔥 P1 |
| **Merged Branches** | 1 | Delete | ✅ P2 |
| **Archive Branches** | 2 | Delete | ✅ P2 |
| **Abandoned Branches** | 2 | Delete | ✅ P2 |
| **Rewrite Branches** | 4 | Evaluate | ⚠️ P3 |
| **Active Branches** | 2 | Keep | ✅ - |

## Expected Outcome

After cleanup:
- **Before:** 16 branches (cluttered, outdated)
- **After:** 2-3 branches (clean, focused)
- **Security:** All vulnerabilities patched
- **Clarity:** Only active work visible

## Safety Notes

- The `main` branch is protected and cannot be accidentally deleted
- All recommended deletions are for:
  - Branches already merged to main
  - Old backup/archive branches
  - Abandoned experimental work
- Dependabot branches are automatically deleted after PR merge
- Rewrite branches require manual review before deletion

## Prerequisites

The cleanup script requires:
- Git installed and repository cloned
- GitHub CLI (`gh`) installed and authenticated
- Write permissions to the repository

## Questions?

Refer to `BRANCH_ANALYSIS.md` for:
- Detailed reasoning for each recommendation
- Commit history for each branch
- Associated PR information
- Risk assessment

## Timeline

Suggested execution over 2-3 weeks:
- **Week 1:** Merge security updates (Phase 1)
- **Week 1-2:** Execute safe deletions (Phases 3-5)
- **Week 2-3:** Review and cleanup rewrite branches (Phase 6)
