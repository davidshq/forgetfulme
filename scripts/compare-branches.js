#!/usr/bin/env node

/**
 * Branch Comparison Script
 *
 * Compares code metrics, test coverage, and file structure across branches.
 * Usage: node scripts/compare-branches.js [options] [branch1] [branch2] [branch3...]
 *
 * Options:
 *   --detailed    Generate detailed comparison report
 *   --json        Output results in JSON format
 *   --save        Save report to file
 *
 * Examples:
 *   node scripts/compare-branches.js main openai claude
 *   node scripts/compare-branches.js --detailed main openai
 *   node scripts/compare-branches.js --json --save main openai claude
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  detailed: args.includes('--detailed'),
  json: args.includes('--json'),
  save: args.includes('--save'),
};

const branches = args.filter(arg => !arg.startsWith('--'));

// Default branches if none specified
const targetBranches =
  branches.length > 0 ? branches : ['main', 'openai', 'claude'];

/**
 * Execute git command and return output
 */
function gitCommand(command) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Check if branch exists
 */
function branchExists(branch) {
  const result = gitCommand(`git rev-parse --verify ${branch}`);
  return result !== null;
}

/**
 * Get current branch name
 */
function getCurrentBranch() {
  return gitCommand('git rev-parse --abbrev-ref HEAD');
}

/**
 * Count lines of code in JavaScript files (excluding node_modules and tests)
 */
function countLinesOfCode(branch) {
  try {
    const result = gitCommand(
      `git ls-tree -r ${branch} --name-only | grep '\\.js$' | grep -v 'node_modules' | grep -v '.min.js' | xargs -I {} git show ${branch}:{} | wc -l`
    );
    return parseInt(result) || 0;
  } catch {
    return 0;
  }
}

/**
 * Count number of files
 */
function countFiles(branch, _pattern = '*.js') {
  try {
    const result = gitCommand(
      `git ls-tree -r ${branch} --name-only | grep '\\.js$' | grep -v 'node_modules' | grep -v '.min.js' | wc -l`
    );
    return parseInt(result) || 0;
  } catch {
    return 0;
  }
}

/**
 * Get list of files in branch
 */
function getFileList(branch) {
  try {
    const result = gitCommand(
      `git ls-tree -r ${branch} --name-only | grep '\\.js$' | grep -v 'node_modules' | grep -v '.min.js'`
    );
    return result ? result.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * Get commit count for branch
 */
function getCommitCount(branch) {
  try {
    const result = gitCommand(`git rev-list --count ${branch}`);
    return parseInt(result) || 0;
  } catch {
    return 0;
  }
}

/**
 * Get last commit date
 */
function getLastCommitDate(branch) {
  try {
    return gitCommand(`git log -1 --format=%cd --date=short ${branch}`);
  } catch {
    return 'N/A';
  }
}

/**
 * Get last commit message
 */
function getLastCommitMessage(branch) {
  try {
    return gitCommand(`git log -1 --format=%s ${branch}`);
  } catch {
    return 'N/A';
  }
}

/**
 * Compare files between branches
 */
function compareFiles(branch1, branch2) {
  const files1 = new Set(getFileList(branch1));
  const files2 = new Set(getFileList(branch2));

  const onlyIn1 = [...files1].filter(f => !files2.has(f));
  const onlyIn2 = [...files2].filter(f => !files1.has(f));
  const common = [...files1].filter(f => files2.has(f));

  return { onlyIn1, onlyIn2, common };
}

/**
 * Get diff stats between branches
 */
function getDiffStats(branch1, branch2) {
  try {
    const result = gitCommand(`git diff --shortstat ${branch1}..${branch2}`);
    if (!result) return { files: 0, insertions: 0, deletions: 0 };

    const matches = result.match(
      /(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/
    );
    if (!matches) return { files: 0, insertions: 0, deletions: 0 };

    return {
      files: parseInt(matches[1]) || 0,
      insertions: parseInt(matches[2]) || 0,
      deletions: parseInt(matches[3]) || 0,
    };
  } catch {
    return { files: 0, insertions: 0, deletions: 0 };
  }
}

/**
 * Collect metrics for a branch
 */
function collectBranchMetrics(branch) {
  // eslint-disable-next-line no-console
  console.error(`Collecting metrics for ${branch}...`);

  return {
    branch,
    exists: branchExists(branch),
    linesOfCode: countLinesOfCode(branch),
    fileCount: countFiles(branch),
    commitCount: getCommitCount(branch),
    lastCommitDate: getLastCommitDate(branch),
    lastCommitMessage: getLastCommitMessage(branch),
    files: getFileList(branch),
  };
}

/**
 * Generate comparison report
 */
function generateReport(metrics, options) {
  if (options.json) {
    return JSON.stringify(metrics, null, 2);
  }

  const report = [];
  report.push('# Branch Comparison Report');
  report.push('');
  report.push(`Generated: ${new Date().toISOString()}`);
  report.push('');

  // Summary Table
  report.push('## Summary');
  report.push('');
  report.push('| Branch | Exists | LOC | Files | Commits | Last Commit Date |');
  report.push('|--------|--------|-----|-------|---------|------------------|');

  metrics.forEach(m => {
    report.push(
      `| ${m.branch} | ${m.exists ? '✅' : '❌'} | ${m.linesOfCode} | ${m.fileCount} | ${m.commitCount} | ${m.lastCommitDate} |`
    );
  });
  report.push('');

  // Last Commit Messages
  report.push('## Last Commit Messages');
  report.push('');
  metrics.forEach(m => {
    if (m.exists) {
      report.push(`### ${m.branch}`);
      report.push(`\`\`\`\n${m.lastCommitMessage}\n\`\`\``);
      report.push('');
    }
  });

  // Detailed comparison if requested
  if (options.detailed && metrics.length >= 2) {
    report.push('## Detailed Comparisons');
    report.push('');

    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const m1 = metrics[i];
        const m2 = metrics[j];

        if (!m1.exists || !m2.exists) continue;

        report.push(`### ${m1.branch} vs ${m2.branch}`);
        report.push('');

        // File comparison
        const fileComparison = compareFiles(m1.branch, m2.branch);
        report.push(`**Files:**`);
        report.push(`- Common files: ${fileComparison.common.length}`);
        report.push(`- Only in ${m1.branch}: ${fileComparison.onlyIn1.length}`);
        report.push(`- Only in ${m2.branch}: ${fileComparison.onlyIn2.length}`);
        report.push('');

        if (
          fileComparison.onlyIn1.length > 0 &&
          fileComparison.onlyIn1.length < 20
        ) {
          report.push(`**Files only in ${m1.branch}:**`);
          fileComparison.onlyIn1.forEach(f => report.push(`- ${f}`));
          report.push('');
        }

        if (
          fileComparison.onlyIn2.length > 0 &&
          fileComparison.onlyIn2.length < 20
        ) {
          report.push(`**Files only in ${m2.branch}:**`);
          fileComparison.onlyIn2.forEach(f => report.push(`- ${f}`));
          report.push('');
        }

        // Diff stats
        const diffStats = getDiffStats(m1.branch, m2.branch);
        report.push(`**Diff Statistics:**`);
        report.push(`- Files changed: ${diffStats.files}`);
        report.push(`- Insertions: ${diffStats.insertions}`);
        report.push(`- Deletions: ${diffStats.deletions}`);
        report.push('');
      }
    }
  }

  // Recommendations
  report.push('## Recommendations');
  report.push('');

  const existingBranches = metrics.filter(m => m.exists);
  if (existingBranches.length === 0) {
    report.push(
      '- No branches found. Create the branches to enable comparison.'
    );
  } else if (existingBranches.length === 1) {
    report.push(
      `- Only ${existingBranches[0].branch} exists. Create other branches to enable comparison.`
    );
  } else {
    // Find branch with most LOC
    const maxLOC = Math.max(...existingBranches.map(m => m.linesOfCode));
    const maxLOCBranch = existingBranches.find(m => m.linesOfCode === maxLOC);

    // Find branch with most commits
    const maxCommits = Math.max(...existingBranches.map(m => m.commitCount));
    const maxCommitsBranch = existingBranches.find(
      m => m.commitCount === maxCommits
    );

    report.push(
      `- **${maxLOCBranch.branch}** has the most lines of code (${maxLOC} LOC)`
    );
    report.push(
      `- **${maxCommitsBranch.branch}** has the most commits (${maxCommits} commits)`
    );
    report.push(
      '- Review the detailed comparison above to understand differences'
    );
    report.push('- Consider running tests on each branch to compare quality');
    report.push(
      '- Use `git diff <branch1>..<branch2> -- <file>` to compare specific files'
    );
  }
  report.push('');

  return report.join('\n');
}

/**
 * Main execution
 */
function main() {
  // eslint-disable-next-line no-console
  console.error('Branch Comparison Tool');
  // eslint-disable-next-line no-console
  console.error('======================\n');

  const currentBranch = getCurrentBranch();
  // eslint-disable-next-line no-console
  console.error(`Current branch: ${currentBranch}\n`);

  // eslint-disable-next-line no-console
  console.error(`Comparing branches: ${targetBranches.join(', ')}\n`);

  // Collect metrics for all branches
  const metrics = targetBranches.map(collectBranchMetrics);

  // Generate report
  const report = generateReport(metrics, options);

  // Output report
  // eslint-disable-next-line no-console
  console.log(report);

  // Save to file if requested
  if (options.save) {
    const filename = `branch-comparison-${Date.now()}.${options.json ? 'json' : 'md'}`;
    const filepath = path.join(process.cwd(), filename);
    fs.writeFileSync(filepath, report);
    // eslint-disable-next-line no-console
    console.error(`\nReport saved to: ${filepath}`);
  }
}

// Run the main function
main();

export { collectBranchMetrics, compareFiles, getDiffStats, generateReport };
