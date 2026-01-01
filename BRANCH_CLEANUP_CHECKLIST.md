# Branch Cleanup Progress Tracker

**Repository:** davidshq/forgetfulme  
**Started:** January 1, 2026  
**Status:** In Progress

Use this checklist to track your cleanup progress. Check off items as you complete them.

---

## Phase 1: Security Updates 🔥

**Goal:** Merge all pending security update PRs  
**Risk Level:** Low (security improvements)  
**Time Estimate:** 15 minutes

- [ ] Review PR #6 (js-yaml CVE fix)
  - [ ] Check CI status
  - [ ] Merge with: `gh pr merge 6 --squash`
  - [ ] Verify branch auto-deleted
  - [ ] Test extension after merge

- [ ] Review PR #8 (glob security update)
  - [ ] Check CI status
  - [ ] Merge with: `gh pr merge 8 --squash`
  - [ ] Verify branch auto-deleted

- [ ] Review PR #5 (vite security update)
  - [ ] Check CI status
  - [ ] Merge with: `gh pr merge 5 --squash`
  - [ ] Verify branch auto-deleted

- [ ] Review PR #7 (multi-package update)
  - [ ] Check what packages are updated
  - [ ] Review breaking changes
  - [ ] Merge or close: `gh pr merge 7 --squash` or `gh pr close 7`
  - [ ] Verify branch status

- [ ] Check multi-a50d7f32cf branch
  - [ ] Look for associated PR: `gh pr list --head dependabot/npm_and_yarn/multi-a50d7f32cf`
  - [ ] If no PR found, delete branch: `git push origin --delete dependabot/npm_and_yarn/multi-a50d7f32cf`

**Phase 1 Complete?** [ ] Yes - All security updates merged

---

## Phase 2: Merged Branches ✅

**Goal:** Delete branches that are already merged  
**Risk Level:** Very Low (already in main)  
**Time Estimate:** 5 minutes

- [ ] Delete `pico` branch
  - [ ] Verify merged: `git log --oneline main --grep="pico"`
  - [ ] Delete: `git push origin --delete pico`
  - [ ] Confirm deletion: `git branch -r | grep pico` (should show nothing)

**Phase 2 Complete?** [ ] Yes - Merged branches cleaned up

---

## Phase 3: Archive Branches 📦

**Goal:** Remove old backup branches  
**Risk Level:** Very Low (old backups)  
**Time Estimate:** 5 minutes

- [ ] Delete `main-old-23-07-2025` branch
  - [ ] Confirm it's an archive: `git log origin/main-old-23-07-2025 -1`
  - [ ] Delete: `git push origin --delete main-old-23-07-2025`
  - [ ] Confirm deletion: `git branch -r | grep main-old`

- [ ] Delete `old-main-2025-01-08` branch
  - [ ] Confirm it's an archive: `git log origin/old-main-2025-01-08 -1`
  - [ ] Delete: `git push origin --delete old-main-2025-01-08`
  - [ ] Confirm deletion: `git branch -r | grep old-main`

**Phase 3 Complete?** [ ] Yes - Archive branches removed

---

## Phase 4: Abandoned Branches 🗑️

**Goal:** Delete prep/abandoned branches  
**Risk Level:** Low (no valuable code)  
**Time Estimate:** 5 minutes

- [ ] Delete `more-oversight-rewrite` branch
  - [ ] Review commit: `git log origin/more-oversight-rewrite -1`
  - [ ] Confirm "Fresh branch" with no real work
  - [ ] Delete: `git push origin --delete more-oversight-rewrite`

- [ ] Delete `refactor` branch
  - [ ] Review commit: `git log origin/refactor -1`
  - [ ] Confirm "preppig for complete rewrite" [sic]
  - [ ] Delete: `git push origin --delete refactor`

**Phase 4 Complete?** [ ] Yes - Abandoned branches cleaned

---

## Phase 5: Experimental Rewrite Branches ⚠️

**Goal:** Evaluate and cleanup experimental rewrite branches  
**Risk Level:** Medium (requires review)  
**Time Estimate:** 1-2 hours

### Branch 1: `claude-rewrite-from-scratch`

- [ ] Review commits
  - [ ] List commits: `git log --oneline origin/claude-rewrite-from-scratch -10`
  - [ ] Check diff from main: `git diff main...origin/claude-rewrite-from-scratch --stat`
  - [ ] View specific files if interesting: `git diff main...origin/claude-rewrite-from-scratch -- <file>`

- [ ] Decision
  - [ ] Any valuable code to cherry-pick? (Write commit SHAs below)
    - Commit: ________________
    - Commit: ________________
  - [ ] Cherry-picked commits to main (if any)

- [ ] Cleanup
  - [ ] Close PR #2: `gh pr close 2 --comment "Closing in favor of main branch development"`
  - [ ] Delete branch: `git push origin --delete claude-rewrite-from-scratch`

### Branch 2: `claude-rewrite-refactor`

- [ ] Review commits
  - [ ] List commits: `git log --oneline origin/claude-rewrite-refactor -10`
  - [ ] Check authentication modal code (last commit topic)
  - [ ] Verify if auth improvements are in main

- [ ] Decision
  - [ ] Any valuable code to cherry-pick?
    - Commit: ________________
    - Commit: ________________
  - [ ] Cherry-picked commits to main (if any)

- [ ] Cleanup
  - [ ] Delete branch: `git push origin --delete claude-rewrite-refactor`

### Branch 3: `claude-rewrite-refactor-simplify`

- [ ] Review commits
  - [ ] List commits: `git log --oneline origin/claude-rewrite-refactor-simplify -10`
  - [ ] Check Supabase API improvements (last commit topic)
  - [ ] Verify if Supabase fixes are in main: `git log main --grep="Supabase"`

- [ ] Decision
  - [ ] Any valuable code to cherry-pick?
    - Commit: ________________
    - Commit: ________________
  - [ ] Cherry-picked commits to main (if any)

- [ ] Cleanup
  - [ ] Delete branch: `git push origin --delete claude-rewrite-refactor-simplify`

### Branch 4: `openai-rewrite`

- [ ] Review commits
  - [ ] List commits: `git log --oneline origin/openai-rewrite -10`
  - [ ] Check session expiry handling (last commit topic)
  - [ ] Verify if session expiry is in main

- [ ] Decision
  - [ ] Any valuable code to cherry-pick?
    - Commit: ________________
    - Commit: ________________
  - [ ] Cherry-picked commits to main (if any)

- [ ] Cleanup
  - [ ] Delete branch: `git push origin --delete openai-rewrite`

**Phase 5 Complete?** [ ] Yes - All experimental branches evaluated

---

## Phase 6: Final Verification 🎯

**Goal:** Confirm cleanup success  
**Time Estimate:** 5 minutes

- [ ] List remaining branches
  - [ ] Run: `git branch -r | grep -v HEAD | sort`
  - [ ] Count: Should be ~2-3 branches (main + active work)

- [ ] Verify protected branches
  - [ ] Confirm `main` still exists
  - [ ] Confirm any active work branches are intentional

- [ ] Check for forgotten branches
  - [ ] Review list for any unexpected branches
  - [ ] Document reason for keeping any additional branches

- [ ] Update repository documentation
  - [ ] Add branch naming conventions to CONTRIBUTING.md (if exists)
  - [ ] Document cleanup in project history

**Phase 6 Complete?** [ ] Yes - Cleanup verified

---

## Overall Progress

**Completion Status:**

- [ ] Phase 1: Security Updates (5 branches)
- [ ] Phase 2: Merged Branches (1 branch)
- [ ] Phase 3: Archive Branches (2 branches)
- [ ] Phase 4: Abandoned Branches (2 branches)
- [ ] Phase 5: Experimental Branches (4 branches)
- [ ] Phase 6: Final Verification

**Final Stats:**

- Branches before cleanup: 16
- Branches after cleanup: _____
- Security PRs merged: _____
- Branches deleted: _____
- Time spent: _____ hours

---

## Notes & Issues

Use this space to document any issues or decisions made during cleanup:

```
Date: _____________
Issue: 

Resolution:


---

Date: _____________
Issue:

Resolution:


---
```

---

## Completion

- [ ] All phases complete
- [ ] Repository owner notified
- [ ] Cleanup documentation archived
- [ ] PR #10 (this branch analysis) can be merged/closed

**Cleaned up by:** _________________  
**Date completed:** _________________  
**Total time spent:** _________________

---

## Future Maintenance

To prevent branch accumulation in the future:

- [ ] Set up Dependabot auto-merge for security patches
- [ ] Establish branch naming convention in CONTRIBUTING.md
- [ ] Set branch deletion policy (e.g., delete after 90 days of inactivity)
- [ ] Schedule quarterly branch review
- [ ] Document experimental branch workflow

---

**Questions or issues during cleanup?** Refer to `BRANCH_ANALYSIS.md` for detailed context.
