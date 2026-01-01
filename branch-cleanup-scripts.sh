#!/bin/bash
# Branch Cleanup Scripts for forgetfulme Repository
# Generated: 2026-01-01
# Review BRANCH_ANALYSIS.md before running any commands

set -e  # Exit on error

echo "========================================="
echo "ForgetfulMe Branch Cleanup Utility"
echo "========================================="
echo ""
echo "⚠️  WARNING: Review BRANCH_ANALYSIS.md before proceeding"
echo "This script contains commands to clean up repository branches."
echo "Commands are grouped by priority and safety level."
echo ""

# Function to prompt for confirmation
confirm() {
    read -p "Do you want to proceed with this step? (yes/no): " response
    if [[ "$response" != "yes" ]]; then
        echo "Skipped."
        return 1
    fi
    return 0
}

# ==========================================
# PHASE 1: SECURITY UPDATES (HIGHEST PRIORITY)
# ==========================================

phase1_merge_security_updates() {
    echo ""
    echo "========================================="
    echo "PHASE 1: Merge Security Updates"
    echo "========================================="
    echo "This will merge pending Dependabot security PRs."
    echo ""
    
    if confirm; then
        echo "Merging critical js-yaml security update (PR #6)..."
        gh pr merge 6 --squash --body "Security fix: Fixes prototype pollution vulnerability in js-yaml"
        
        echo "Merging glob security update (PR #8)..."
        gh pr merge 8 --squash --body "Security update: Bump glob from 10.4.5 to 10.5.0"
        
        echo "Merging vite security update (PR #5)..."
        gh pr merge 5 --squash --body "Security update: Bump vite from 7.0.5 to 7.1.11"
        
        echo "✅ Security updates merged!"
        echo "Note: Merged branches are automatically deleted by GitHub"
    fi
}

# ==========================================
# PHASE 2: REVIEW MULTI-PACKAGE UPDATES
# ==========================================

phase2_review_multi_updates() {
    echo ""
    echo "========================================="
    echo "PHASE 2: Review Multi-Package Updates"
    echo "========================================="
    echo "Review and merge or close multi-package update PRs."
    echo ""
    
    if confirm; then
        echo "Opening PR #7 for review..."
        gh pr view 7
        
        echo ""
        echo "After review, merge with:"
        echo "  gh pr merge 7 --squash"
        echo "Or close with:"
        echo "  gh pr close 7"
        
        echo ""
        echo "Checking for PR associated with multi-a50d7f32cf..."
        gh pr list --head dependabot/npm_and_yarn/multi-a50d7f32cf || echo "No PR found - consider deleting branch"
    fi
}

# ==========================================
# PHASE 3: DELETE MERGED BRANCHES
# ==========================================

phase3_delete_merged() {
    echo ""
    echo "========================================="
    echo "PHASE 3: Delete Merged Branches"
    echo "========================================="
    echo "These branches have been merged to main and can be safely deleted."
    echo ""
    
    if confirm; then
        echo "Deleting 'pico' branch (merged via PR #1)..."
        git push origin --delete pico && echo "✅ Deleted pico" || echo "❌ Failed or already deleted"
    fi
}

# ==========================================
# PHASE 4: DELETE ARCHIVE BRANCHES
# ==========================================

phase4_delete_archives() {
    echo ""
    echo "========================================="
    echo "PHASE 4: Delete Archive Branches"
    echo "========================================="
    echo "These are old main backups that are no longer needed."
    echo ""
    
    if confirm; then
        echo "Deleting archive branches..."
        git push origin --delete main-old-23-07-2025 && echo "✅ Deleted main-old-23-07-2025" || echo "❌ Failed or already deleted"
        git push origin --delete old-main-2025-01-08 && echo "✅ Deleted old-main-2025-01-08" || echo "❌ Failed or already deleted"
    fi
}

# ==========================================
# PHASE 5: DELETE ABANDONED BRANCHES
# ==========================================

phase5_delete_abandoned() {
    echo ""
    echo "========================================="
    echo "PHASE 5: Delete Abandoned Prep Branches"
    echo "========================================="
    echo "These are prep/fresh-start branches with no valuable commits."
    echo ""
    
    if confirm; then
        echo "Deleting abandoned branches..."
        git push origin --delete more-oversight-rewrite && echo "✅ Deleted more-oversight-rewrite" || echo "❌ Failed or already deleted"
        git push origin --delete refactor && echo "✅ Deleted refactor" || echo "❌ Failed or already deleted"
    fi
}

# ==========================================
# PHASE 6: EVALUATE REWRITE BRANCHES
# ==========================================

phase6_evaluate_rewrites() {
    echo ""
    echo "========================================="
    echo "PHASE 6: Evaluate Rewrite Branches"
    echo "========================================="
    echo "⚠️  MANUAL REVIEW REQUIRED"
    echo "These branches contain experimental rewrites."
    echo "Review each branch to determine if any commits should be cherry-picked."
    echo ""
    
    if confirm; then
        echo ""
        echo "Branches to evaluate:"
        echo "  1. claude-rewrite-from-scratch (PR #2)"
        echo "  2. claude-rewrite-refactor"
        echo "  3. claude-rewrite-refactor-simplify"
        echo "  4. openai-rewrite"
        echo ""
        echo "For each branch:"
        echo "  1. Review commits: git log --oneline origin/<branch>"
        echo "  2. View diff from main: git diff main...origin/<branch>"
        echo "  3. Cherry-pick valuable commits if any: git cherry-pick <commit-sha>"
        echo "  4. Close associated PR: gh pr close <pr-number>"
        echo "  5. Delete branch: git push origin --delete <branch>"
        echo ""
        echo "Example workflow for claude-rewrite-from-scratch:"
        echo "  git log --oneline origin/claude-rewrite-from-scratch"
        echo "  gh pr close 2 --comment 'Closing in favor of main branch development'"
        echo "  git push origin --delete claude-rewrite-from-scratch"
    fi
}

# ==========================================
# PHASE 7: CLEANUP DEPENDABOT BRANCHES
# ==========================================

phase7_cleanup_dependabot() {
    echo ""
    echo "========================================="
    echo "PHASE 7: Cleanup Remaining Dependabot Branches"
    echo "========================================="
    echo "After merging PRs, cleanup any remaining dependabot branches."
    echo ""
    
    if confirm; then
        echo "Checking for stale dependabot branches..."
        git branch -r | grep "dependabot" || echo "No dependabot branches found"
        
        echo ""
        echo "To delete a specific dependabot branch:"
        echo "  git push origin --delete dependabot/npm_and_yarn/<package>"
    fi
}

# ==========================================
# MAIN MENU
# ==========================================

show_menu() {
    echo ""
    echo "========================================="
    echo "Select Phase to Execute:"
    echo "========================================="
    echo "  1. Phase 1: Merge Security Updates (PRIORITY)"
    echo "  2. Phase 2: Review Multi-Package Updates"
    echo "  3. Phase 3: Delete Merged Branches"
    echo "  4. Phase 4: Delete Archive Branches"
    echo "  5. Phase 5: Delete Abandoned Branches"
    echo "  6. Phase 6: Evaluate Rewrite Branches (Manual)"
    echo "  7. Phase 7: Cleanup Dependabot Branches"
    echo "  8. Execute All Automatic Phases (1-5)"
    echo "  9. Show Branch Status"
    echo "  0. Exit"
    echo ""
}

show_branch_status() {
    echo ""
    echo "========================================="
    echo "Current Branch Status"
    echo "========================================="
    git branch -r | grep -v "HEAD" | sort
    echo ""
    echo "Open Pull Requests:"
    gh pr list
}

execute_all_automatic() {
    echo ""
    echo "========================================="
    echo "Executing All Automatic Cleanup Phases"
    echo "========================================="
    echo "This will execute phases 1-5 in sequence."
    echo "Phase 6 (Rewrite branch evaluation) requires manual review."
    echo ""
    
    if confirm; then
        phase1_merge_security_updates
        phase2_review_multi_updates
        phase3_delete_merged
        phase4_delete_archives
        phase5_delete_abandoned
        
        echo ""
        echo "========================================="
        echo "✅ Automatic cleanup complete!"
        echo "========================================="
        echo "Next steps:"
        echo "  1. Review Phase 6 (Rewrite Branches) manually"
        echo "  2. Run Phase 7 to cleanup any remaining dependabot branches"
    fi
}

# ==========================================
# MAIN PROGRAM
# ==========================================

main() {
    # Check if gh CLI is installed
    if ! command -v gh &> /dev/null; then
        echo "❌ Error: GitHub CLI (gh) is not installed."
        echo "Install it from: https://cli.github.com/"
        exit 1
    fi
    
    # Check if we're in the right repository
    if ! git remote get-url origin | grep -q "davidshq/forgetfulme"; then
        echo "❌ Error: Not in the forgetfulme repository."
        exit 1
    fi
    
    while true; do
        show_menu
        read -p "Enter choice [0-9]: " choice
        
        case $choice in
            1) phase1_merge_security_updates ;;
            2) phase2_review_multi_updates ;;
            3) phase3_delete_merged ;;
            4) phase4_delete_archives ;;
            5) phase5_delete_abandoned ;;
            6) phase6_evaluate_rewrites ;;
            7) phase7_cleanup_dependabot ;;
            8) execute_all_automatic ;;
            9) show_branch_status ;;
            0) echo "Exiting..."; exit 0 ;;
            *) echo "Invalid choice. Please try again." ;;
        esac
    done
}

# Run main program if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi
