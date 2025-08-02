# Future
- Add a notes field
- Keep a log of when we visited pages and how long we dwelt on the page.
    - This should be off by default and be configurable in settings at both levels - e.g., one can log visited pages or not and if one is logging visited pages then it should allow one to enable/disable dwell time.
    - If the dwell time option is enabled we need to record site dwell when we visit them even if they aren't saved, if they decide to save the page we'll want that. If they navigate away from the page without saving it then we should dispose of that time since we aren't tracking the page.

## Phase 3: Database & Backend Integration

### 3.1 Database Schema
- [ ] **Future consideration**: Upgrade to `schema-full.sql` when advanced features needed:
  - Full-text search with ts_rank scoring
  - JSONB preferences for flexibility
  - Bulk operations function
  - Statistics views
  - Advanced indexes and partitioning

---

## Phase 12: Deployment & Monitoring

### 12.1 Chrome Web Store Preparation
- [ ] Create store listing assets
- [ ] Write store description
- [ ] Create screenshots and promotional images
- [ ] Set up privacy policy
- [ ] Prepare extension for review
- [ ] Submit to Chrome Web Store

### 12.2 Monitoring & Support
- [ ] Set up error monitoring
- [ ] Create user feedback system
- [ ] Add usage analytics (privacy-compliant)
- [ ] Set up automated backups
- [ ] Create support documentation
- [ ] Plan for maintenance and updates

#### 6.2 Sync Manager
- [ ] Create `src/background/SyncManager.js`
- [ ] Implement real-time data synchronization
- [ ] Add conflict resolution
- [ ] Create sync status tracking
- [ ] Add offline support
- [ ] Implement batch sync operations
- [ ] Write sync manager tests

#### 6.3 Shortcut Manager
- [ ] Create `src/background/ShortcutManager.js`
- [ ] Implement keyboard shortcut registration
- [ ] Add Ctrl+Shift+R bookmark marking
- [ ] Create context menu integration
- [ ] Add customizable shortcuts
- [ ] Write shortcut tests

**Note**: BackgroundService already handles keyboard shortcuts and basic sync operations. SyncManager and ShortcutManager may be extracted for better separation of concerns.

### Phase 8: Testing Implementation
#### 8.2 Integration Tests
- [ ] Create cross-context message tests
- [ ] Add authentication workflow tests
- [ ] Implement database integration tests
- [ ] Test real-time sync operations
- [ ] Create error handling integration tests

#### 8.3 E2E & Visual Regression Tests
- [ ] Create complete user workflow tests (first-time setup, daily use)
- [ ] Extension environment testing with real extension ID discovery
- [ ] Cross-device synchronization simulation
- [ ] Create accessibility testing (keyboard navigation, screen readers)

### Phase 9: Security & Configuration
#### 9.1 Security Implementation
- [ ] Security audit and penetration testing
- [ ] Test security vulnerabilities

#### 9.2 Configuration Management
- [ ] Test configuration workflows end-to-end

### Phase 10: Performance & Optimization
#### 10.1 Performance Optimization
- [ ] Optimize service worker startup time (<500ms)
- [ ] Implement efficient caching strategies
- [ ] Add lazy loading for large datasets
- [ ] Optimize database queries
- [ ] Implement request debouncing
- [ ] Add performance monitoring

#### 10.2 User Experience
- [ ] Target user persona optimization (Academic Researcher, Content Curator, Knowledge Worker)
- [ ] Popup load within 500ms
- [ ] Page marking completion within 2 seconds
- [ ] Search results appearance within 3 seconds
- [ ] Implement loading states
- [ ] Add progress indicators
- [ ] Create smooth animations
- [ ] Full keyboard navigation support
- [ ] High contrast display mode support
- [ ] Test with screen readers
- [ ] Maintain search performance with large datasets

### Phase 11: Production Readiness
#### 11.1 Build & Distribution
- [ ] Create production build process
- [ ] Optimize assets for production
- [ ] Create extension packaging
- [ ] Add version management
- [ ] Create release documentation
- [ ] Set up automated testing in CI

#### 11.2 Documentation & Polish
- [ ] Update all documentation
- [ ] Create user guide
- [ ] Add troubleshooting guide
- [ ] Create developer documentation
- [ ] Add contributing guidelines
- [ ] Polish UI and error messages

#### 11.3 Quality Assurance
- [ ] Run complete test suite (target: 95%+ pass rate)
- [ ] Perform security audit  
- [ ] Test in multiple browsers
- [ ] Validate accessibility compliance
- [ ] Test with large datasets
- [ ] Verify cross-device sync

### Phase 12: Chrome Web Store Deployment
- [ ] Create store listing assets
- [ ] Write store description
- [ ] Create screenshots and promotional images
- [ ] Set up privacy policy
- [ ] Prepare extension for review
- [ ] Submit to Chrome Web Store