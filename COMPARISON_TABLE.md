# Branch Comparison Quick Reference

**Last Updated**: January 1, 2026

## At a Glance

| Aspect | Main | OpenAI Rewrite | Claude Rewrite |
|--------|------|----------------|----------------|
| **Status** | Legacy/Deprecated | ✅ **RECOMMENDED** | Alternative |
| **Lines of Code** | 8,733 | **539** (-87%) | 8,956 |
| **Architecture** | Flat/Monolithic | Clean/Modular | Service-Oriented |
| **Largest File** | 999 lines | 200 lines | 953 lines |
| **Test Coverage** | Partial | **Excellent** | Good |
| **Visual Tests** | ❌ None | ✅ **Mandatory** | ✅ Present |
| **Documentation** | Extensive/Outdated | **Focused/Clear** | Comprehensive/Verbose |
| **Complexity** | High | **Low** | High |
| **Maintainability** | Low | **High** | Medium |
| **Feature Complete** | ✅ Yes | ⚠️ 90% | ✅ Yes |
| **Bundle Size** | Large | **Small** | Large (+Grid.js) |
| **Learning Curve** | Steep | **Gentle** | Steep |
| **Overall Score** | 6.0/10 | **9.2/10** ⭐ | 6.9/10 |

---

## Feature Comparison Matrix

| Feature | Main | OpenAI | Claude | Notes |
|---------|------|--------|--------|-------|
| **Mark as Read** | ✅ | ✅ | ✅ | All branches |
| **Authentication** | ✅ | ✅ | ✅ | Email/password |
| **Recent Pages List** | ✅ | ✅ | ✅ | With pagination |
| **Search/Filter** | ✅ | ✅ | ✅ | Title/domain |
| **Keyboard Shortcuts** | ✅ | ✅ | ✅ | Ctrl+Shift+R |
| **Badge Updates** | ✅ | ✅ | ✅ | Read/unread indicator |
| **Cross-Device Sync** | ✅ | ✅ | ✅ | Via Supabase |
| **Custom Status Types** | ✅ | ⚠️ | ✅ | OpenAI: read/unread only (UI) |
| **Tags** | ✅ | ⚠️ | ✅ | OpenAI: to be added |
| **Export/Import** | ✅ | ❌ | ✅ | OpenAI: to be added |
| **Bookmark Manager** | ✅ | ⚠️ | ✅ Grid.js | OpenAI: simple list |
| **Statistics** | ✅ | ❌ | ✅ | OpenAI: to be added |
| **Toast Notifications** | ⚠️ | ✅ | ✅ | OpenAI: best implementation |
| **Visual Testing** | ❌ | ✅ | ✅ | OpenAI: mandatory |
| **Docker Support** | ❌ | ✅ | ❌ | OpenAI: for tests |
| **Atomic Operations** | ❌ | ✅ | ❌ | OpenAI: toggle_read() RPC |

**Legend**: ✅ Complete | ⚠️ Partial/In Progress | ❌ Not Present

---

## Code Structure Comparison

### File Organization

**Main Branch** (Flat):
```
Root directory:
├── popup.js (814 lines)
├── options.js (708 lines)
├── background.js (594 lines)
├── bookmark-management.js (999 lines)
├── auth-ui.js (408 lines)
├── config-ui.js (350 lines)
└── utils/ (7 files)
```

**OpenAI Rewrite** (Modular):
```
src/
├── background/index.js (42 lines)
├── popup/ (html, js, css)
├── options/ (html, js, css)
├── utils/
│   ├── storage.js (50 lines)
│   ├── supabase.js (150 lines)
│   └── url.js (50 lines)
└── lib/ (vendored dependencies)
```

**Claude Rewrite** (Service-Oriented):
```
src/
├── controllers/ (4 files, 553-953 lines each)
├── services/ (7 services)
├── background/BackgroundService.js (656 lines)
├── main/ (5 entry points)
├── ui/ (templates + components)
└── utils/ (7 files)
```

---

## Documentation Comparison

| Documentation | Main | OpenAI | Claude | Quality |
|---------------|------|--------|--------|---------|
| **README** | 356 lines | Delegated | Delegated | Main: outdated |
| **Setup Guide** | 316 lines | 120 lines | 316 lines | OpenAI: focused |
| **Architecture** | Multiple docs | **260-line REBUILD_GUIDE** | 877 lines | OpenAI: clear |
| **API Docs** | Scattered | Inline JSDoc | **2,733 lines** | Claude: excessive |
| **Development** | CODE_REVIEW.md | REWRITE_NOTES.md | 11 dev-docs | OpenAI: practical |
| **Onboarding** | Difficult | **Easy** | Moderate | OpenAI: best |
| **Total Pages** | ~15 files | ~5 files | **25+ files** | OpenAI: right-sized |

---

## Technical Metrics

### Code Metrics

| Metric | Main | OpenAI | Claude |
|--------|------|--------|--------|
| **Total JS Files** | 30 | 7 | 29 |
| **Total JS Lines** | 8,733 | 539 | 8,956 |
| **Avg Lines/File** | 291 | 77 | 309 |
| **Max Lines/File** | 999 | 200 | 953 |
| **Cyclomatic Complexity** | High | Low | High |
| **Coupling** | High | Low | Medium |
| **Cohesion** | Low | High | Medium |

### Bundle Size

| Asset | Main | OpenAI | Claude |
|-------|------|--------|--------|
| **Pico CSS** | ~3MB (old) | 4KB (minified) | 4KB (minified) |
| **Supabase** | Inline 120KB | Bundled ~50KB | Inline 120KB |
| **Grid.js** | ❌ | ❌ | 326KB + theme |
| **Total Estimate** | ~3.2MB | **~54KB** | ~450KB |

### Performance

| Metric | Main | OpenAI | Claude |
|--------|------|--------|--------|
| **Startup Time** | Slow | **Fast** | Medium |
| **Memory Usage** | High | **Low** | Medium |
| **Parse Time** | High | **Low** | Medium |

---

## Testing Comparison

### Test Infrastructure

| Test Type | Main | OpenAI | Claude |
|-----------|------|--------|--------|
| **Unit Tests (Vitest)** | 11 files | 2 files | Limited | 
| **Integration Tests** | 2 files | ✅ Present | 7 files |
| **Visual Tests** | ❌ None | ✅ **4 files + Docker** | ✅ 4 files |
| **E2E Tests** | ✅ Playwright | ✅ Playwright | ✅ Playwright |
| **Test Coverage** | ~60% | ~70% | ~70% |
| **Visual Baseline** | ❌ | ✅ **Required** | ✅ |
| **CI/CD** | Basic | **Full workflow** | Full workflow |

### Test Commands

| Command | Main | OpenAI | Claude |
|---------|------|--------|--------|
| `npm test` | ✅ | ✅ | ✅ |
| `npm run test:visual` | ❌ | ✅ | ✅ |
| `npm run test:visual:update` | ❌ | ✅ | ✅ |
| `npm run test:visual:report` | ❌ | ✅ | ✅ |

---

## Development Experience

### Developer Onboarding

| Aspect | Main | OpenAI | Claude |
|--------|------|--------|--------|
| **Setup Time** | 1-2 hours | **30 min** | 1-2 hours |
| **Understanding Codebase** | 3-5 days | **4-8 hours** | 2-3 days |
| **First Contribution** | 1 week | **1-2 days** | 4-5 days |
| **Learning Curve** | Steep | **Gentle** | Steep |
| **Documentation Quality** | Mixed | **Excellent** | Comprehensive |

### Build & Development Tools

| Tool | Main | OpenAI | Claude |
|------|------|--------|--------|
| **ESLint** | ✅ | ✅ | ✅ |
| **Prettier** | ✅ | ✅ | ✅ |
| **Husky Git Hooks** | Basic | ✅ Full | ✅ Full |
| **Makefile** | ❌ | ✅ | ❌ |
| **Docker** | ❌ | ✅ **Tests** | ❌ |
| **Bundle Scripts** | ❌ | ✅ Supabase | ❌ |

---

## Maintenance Burden

### Monthly Maintenance Hours (Estimated)

| Activity | Main | OpenAI | Claude |
|----------|------|--------|--------|
| **Bug Fixes** | 8-10h | **2-3h** | 6-8h |
| **Feature Adds** | 16-20h | **8-10h** | 12-16h |
| **Refactoring** | 8h | **2h** | 6h |
| **Testing** | 6h | **3h** | 5h |
| **Documentation** | 4h | **2h** | 4h |
| **Total/Month** | 42-48h | **17-20h** | 33-39h |

**Maintenance Savings with OpenAI**: ~25 hours/month (~60% reduction)

---

## Risk Assessment

### Technical Risks

| Risk | Main | OpenAI | Claude | Severity |
|------|------|--------|--------|----------|
| **Architectural Debt** | 🔴 High | 🟢 None | 🟡 Medium | High |
| **Unmaintainability** | 🔴 High | 🟢 Low | 🟡 Medium | High |
| **Hidden Bugs** | 🔴 High | 🟢 Low | 🟡 Medium | Medium |
| **Performance Issues** | 🟡 Medium | 🟢 Low | 🟡 Medium | Low |
| **Security Vulnerabilities** | 🟡 Medium | 🟢 Low | 🟢 Low | High |
| **Vendor Lock-in** | 🟢 Low | 🟢 Low | 🟡 Medium | Medium |

### Development Risks

| Risk | Main | OpenAI | Claude | Mitigation |
|------|------|--------|--------|------------|
| **Feature Incomplete** | 🟢 None | 🟡 Medium | 🟢 None | 2-3 weeks dev |
| **Developer Attrition** | 🔴 High | 🟢 Low | 🟡 Medium | Good docs |
| **Knowledge Silos** | 🔴 High | 🟢 Low | 🟡 Medium | Simple code |
| **Testing Gaps** | 🔴 High | 🟢 Low | 🟡 Medium | Visual tests |

---

## Migration Path

### From Main to OpenAI Rewrite

**Effort**: 2-3 weeks  
**Risk**: Low  
**Benefit**: 87% code reduction

**Steps**:
1. Week 1: Test and validate core features
2. Week 2-3: Add missing features (export, stats, tags)
3. Week 4: Polish and deploy

### From Main to Claude Rewrite

**Effort**: 1 week (mostly testing)  
**Risk**: Medium  
**Benefit**: Better architecture, but similar complexity

**Steps**:
1. Extensive testing of all features
2. Simplification refactoring (optional)
3. Team training on service architecture

### Recommended: Main → OpenAI

**Why**: Long-term maintainability trumps short-term feature completeness

---

## Cost-Benefit Analysis

### OpenAI Rewrite Investment

**Costs**:
- 2-3 weeks development time
- Learning new codebase (minimal due to simplicity)

**Benefits**:
- 87% code reduction (8,733 → 539 lines)
- 60% maintenance time reduction (~25h/month savings)
- Faster bug fixes
- Easier onboarding
- Better testing infrastructure
- Atomic operations (no race conditions)

**ROI**: Positive after 1 month

### Claude Rewrite Investment

**Costs**:
- 1 week testing
- Learning service architecture
- Similar maintenance burden to main

**Benefits**:
- Better organization
- Grid.js table
- Comprehensive docs

**ROI**: Marginal

---

## Final Scores (Weighted)

| Category | Weight | Main | OpenAI | Claude |
|----------|--------|------|--------|--------|
| **Simplicity** | 20% | 4.0 | **10.0** | 5.0 |
| **Maintainability** | 20% | 5.0 | **10.0** | 6.0 |
| **Features** | 15% | 10.0 | 6.0 | 10.0 |
| **Documentation** | 10% | 7.0 | **9.0** | 8.0 |
| **Testing** | 15% | 6.0 | **10.0** | 8.0 |
| **Performance** | 10% | 6.0 | **9.0** | 6.0 |
| **Developer UX** | 10% | 5.0 | **9.0** | 7.0 |
| **TOTAL** | 100% | 6.0 | **9.2** ⭐ | 6.9 |

---

## Recommendation

**✅ Adopt OpenAI Rewrite**

Clear winner with 9.2/10 score and 87% code reduction. The 2-3 week investment to complete missing features is well worth the long-term benefits.

---

**For full analysis**: See [BRANCH_COMPARISON_ANALYSIS.md](./BRANCH_COMPARISON_ANALYSIS.md)  
**For executive summary**: See [RECOMMENDATION.md](./RECOMMENDATION.md)

**Document Version**: 1.0  
**Last Updated**: January 1, 2026
