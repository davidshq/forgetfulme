# GitHub Actions Setup Guide

This document outlines the steps needed to activate automated code quality checks for the ForgetfulMe Chrome extension.

## 🚀 Quick Setup Checklist

### ✅ Step 1: Enable GitHub Actions
1. Go to your repository: `https://github.com/davidshq/forgetfulme`
2. Navigate to **Settings → Actions → General**
3. Under "Actions permissions":
   - Select "Allow all actions and reusable workflows"
4. Under "Workflow permissions":
   - Select "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"

### ✅ Step 2: Configure Branch Protection (Recommended)
1. Go to **Settings → Branches**
2. Click "Add branch protection rule"
3. Branch name pattern: `main`
4. Enable these settings:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Required status checks:
     - `code-quality (ubuntu-latest, 18)`
     - `code-quality (ubuntu-latest, 20)`
     - `security-audit`
     - `quality-gate`

### ✅ Step 3: Set Up Codecov (Optional)
1. Visit [codecov.io](https://codecov.io) and sign in with GitHub
2. Add your repository: `davidshq/forgetfulme`
3. Copy the repository token
4. In GitHub, go to **Settings → Secrets and variables → Actions**
5. Click "New repository secret"
6. Name: `CODECOV_TOKEN`
7. Value: [paste your Codecov token]

## 🔧 What Gets Automated

### Pre-commit Hooks (Local)
- **Lint-staged**: Auto-format and lint staged files
- **Unit tests**: Run tests before commit
- **Coverage check**: Prevent coverage regression

### GitHub Actions (CI/CD)
- **Code Quality**: ESLint + Prettier on Node 18 & 20
- **Testing**: Unit tests with coverage reporting
- **Integration**: Playwright browser tests
- **Visual Regression**: Screenshot comparisons
- **Security**: npm audit for vulnerabilities
- **Performance**: Performance test suite

## 🎯 Quality Gates

### Pre-commit
- All staged files must pass linting
- All staged files must be properly formatted
- Unit tests must pass
- Coverage must not decrease

### CI Pipeline
- ESLint must pass (warnings allowed)
- Prettier formatting must pass
- All unit tests must pass
- Coverage must be ≥68% (target 75%)
- Integration tests must pass
- Visual regression tests must pass
- No high/critical security vulnerabilities

## 🚨 Troubleshooting

### Actions Not Running?
- Check Actions permissions in repository settings
- Ensure workflows are in `.github/workflows/` directory
- Verify branch triggers match your branch names

### Tests Failing?
- Run `npm run check:all` locally first
- Check test outputs in Actions tab
- Review visual test diffs in test reports

### Coverage Issues?
- Run `npm run test:unit:coverage` locally
- Check `coverage/index.html` for detailed report
- Ensure new code has corresponding tests

## 📊 Monitoring

### GitHub Actions Tab
- View all workflow runs
- Download test artifacts
- Review coverage reports

### Pull Request Checks
- Status checks show before merge
- Click "Details" to see full reports
- Visual diff reports available

### Weekly Reports
- Security audit runs every Sunday 2 AM UTC
- Check for new vulnerabilities
- Review dependency updates

## 🔄 Development Workflow

1. **Make changes** to your code
2. **Stage files**: `git add .`
3. **Commit**: Pre-commit hooks run automatically
4. **Push**: Pre-push hooks run quality checks
5. **Create PR**: GitHub Actions run full test suite
6. **Review**: Check status indicators before merge
7. **Merge**: Quality gates must pass

## 📞 Support

If you encounter issues:
1. Check the Actions tab for detailed logs
2. Run quality checks locally: `npm run quality`
3. Review this setup guide
4. Check individual workflow files in `.github/workflows/`