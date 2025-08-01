/**
 * @fileoverview Popup controller for the ForgetfulMe extension
 */

import { BaseController } from './BaseController.js';
import { $, show, hide, setFormData, clearElement } from '../utils/dom.js';
import { formatUrl } from '../utils/formatting.js';

/**
 * Controller for the extension popup
 */
export class PopupController extends BaseController {
  /**
   * @param {AuthService} authService - Authentication service
   * @param {BookmarkService} bookmarkService - Bookmark service
   * @param {ConfigService} configService - Configuration service
   * @param {ErrorService} errorService - Error handling service
   */
  constructor(authService, bookmarkService, configService, errorService) {
    super(errorService);
    this.authService = authService;
    this.bookmarkService = bookmarkService;
    this.configService = configService;

    this.currentTab = null;
    this.currentBookmark = null;
    this.statusTypes = [];
  }

  /**
   * Initialize the popup controller
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Show loading initially
      this.showSection('loading-section');

      // Check if Supabase is configured
      const isConfigured = await this.configService.isSupabaseConfigured();
      if (!isConfigured) {
        this.showConfigRequired();
        return;
      }

      // Initialize auth service
      const isAuthInitialized = await this.authService.initialize();

      if (!isAuthInitialized) {
        // Configuration is missing or invalid
        this.showConfigRequired();
        return;
      }

      // Set up authentication state listener
      const authCleanup = this.authService.addAuthChangeListener(user => {
        this.handleAuthStateChange(user);
      });
      this.addCleanup(authCleanup);

      // Get current tab info
      await this.getCurrentTabInfo();

      // Load status types
      await this.loadStatusTypes();

      // Set up event listeners
      this.setupEventListeners();

      // Show appropriate section based on auth state
      if (this.authService.isAuthenticated()) {
        await this.showMainSection();
      } else {
        this.showAuthSection();
      }
    } catch (error) {
      this.handleError(error, 'PopupController.initialize');
      this.showConfigRequired();
    }
  }

  /**
   * Show configuration required section
   */
  showConfigRequired() {
    this.showSection('auth-section');
    show($('#config-required'));
    hide($('#signin-form'));
    hide($('#signup-form'));
    hide($('#auth-tabs'));
  }

  /**
   * Show authentication section
   */
  showAuthSection() {
    this.showSection('auth-section');
    hide($('#config-required'));
    show($('#auth-tabs'));
    show($('#signin-form'));
    hide($('#signup-form'));

    // Set active tab
    this.setActiveAuthTab('signin');
  }

  /**
   * Show main bookmark section
   */
  async showMainSection() {
    try {
      this.showSection('main-section');

      // Update user info
      const user = this.authService.getCurrentUser();
      if (user) {
        this.setText('#user-email', user.email);
      }

      // Load current page bookmark status
      await this.loadCurrentPageBookmark();

      // Load recent bookmarks
      await this.loadRecentBookmarks();
    } catch (error) {
      this.handleError(error, 'PopupController.showMainSection');
    }
  }

  /**
   * Show specific section and hide others
   * @param {string} sectionId - Section ID to show
   */
  showSection(sectionId) {
    const sections = ['loading-section', 'auth-section', 'main-section'];
    sections.forEach(id => {
      const element = $(`#${id}`);
      if (element) {
        if (id === sectionId) {
          show(element);
        } else {
          hide(element);
        }
      }
    });
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Auth tab switching
    this.addEventListener($('#signin-tab'), 'click', () => {
      this.setActiveAuthTab('signin');
    });

    this.addEventListener($('#signup-tab'), 'click', () => {
      this.setActiveAuthTab('signup');
    });

    // Auth forms
    this.addEventListener($('#signin-form'), 'submit', e => {
      e.preventDefault();
      this.handleSignIn();
    });

    this.addEventListener($('#signup-form'), 'submit', e => {
      e.preventDefault();
      this.handleSignUp();
    });

    // Forgot password
    this.addEventListener($('#forgot-password'), 'click', () => {
      this.handleForgotPassword();
    });

    // Sign out
    this.addEventListener($('#signout-btn'), 'click', () => {
      this.handleSignOut();
    });

    // Open options
    this.addEventListener($('#open-options'), 'click', () => {
      this.openOptionsPage();
    });

    // Bookmark form
    this.addEventListener($('#bookmark-form'), 'submit', e => {
      e.preventDefault();
      this.handleSaveBookmark();
    });

    // Delete bookmark
    this.addEventListener($('#delete-bookmark'), 'click', () => {
      this.handleDeleteBookmark();
    });

    // View all bookmarks
    this.addEventListener($('#view-all'), 'click', () => {
      this.openBookmarkManager();
    });

    // Recent bookmark clicks
    this.addEventListener($('#recent-list'), 'click', e => {
      const item = e.target.closest('.recent-item');
      if (item && item.dataset.url) {
        this.openInNewTab(item.dataset.url);
      }
    });
  }

  /**
   * Set active authentication tab
   * @param {string} tab - Tab name ('signin' or 'signup')
   */
  setActiveAuthTab(tab) {
    const signinTab = $('#signin-tab');
    const signupTab = $('#signup-tab');
    const signinForm = $('#signin-form');
    const signupForm = $('#signup-form');

    if (tab === 'signin') {
      // Active tab gets primary styling
      signinTab?.classList.add('active');
      signinTab?.classList.remove('secondary');
      // Inactive tab gets secondary styling
      signupTab?.classList.remove('active');
      signupTab?.classList.add('secondary');
      show(signinForm);
      hide(signupForm);
    } else {
      // Active tab gets primary styling
      signupTab?.classList.add('active');
      signupTab?.classList.remove('secondary');
      // Inactive tab gets secondary styling
      signinTab?.classList.remove('active');
      signinTab?.classList.add('secondary');
      show(signupForm);
      hide(signinForm);
    }
  }

  /**
   * Handle authentication state change
   * @param {Object|null} user - Current user or null
   */
  async handleAuthStateChange(user) {
    if (user) {
      await this.showMainSection();
    } else {
      this.showAuthSection();
    }
  }

  /**
   * Handle sign in
   */
  async handleSignIn() {
    const form = $('#signin-form');
    const formData = this.getFormData(form);

    if (!formData.email || !formData.password) {
      this.showError('Please enter both email and password');
      return;
    }

    await this.safeExecute(
      async () => {
        const user = await this.authService.signIn(formData.email, formData.password);
        this.showSuccess('Signed in successfully');
        return user;
      },
      'PopupController.handleSignIn',
      '#signin-submit',
      'Signing in...'
    );
  }

  /**
   * Handle sign up
   */
  async handleSignUp() {
    const form = $('#signup-form');
    const formData = this.getFormData(form);

    if (!formData.email || !formData.password || !formData.confirm) {
      this.showError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirm) {
      this.showError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      this.showError('Password must be at least 8 characters');
      return;
    }

    await this.safeExecute(
      async () => {
        const result = await this.authService.signUp(formData.email, formData.password);

        if (result.requiresConfirmation) {
          this.showInfo(
            `Confirmation email sent to ${result.email}. Please check your inbox.`,
            10000
          );
        } else {
          this.showSuccess('Account created successfully');
        }

        return result;
      },
      'PopupController.handleSignUp',
      '#signup-submit',
      'Creating account...'
    );
  }

  /**
   * Handle forgot password
   */
  async handleForgotPassword() {
    const email = prompt('Enter your email address:');
    if (!email) return;

    await this.safeExecute(async () => {
      await this.authService.resetPassword(email);
      this.showSuccess('Password reset email sent');
    }, 'PopupController.handleForgotPassword');
  }

  /**
   * Handle sign out
   */
  async handleSignOut() {
    await this.safeExecute(async () => {
      await this.authService.signOut();
      this.showSuccess('Signed out successfully');
    }, 'PopupController.handleSignOut');
  }

  /**
   * Get current tab information
   */
  async getCurrentTabInfo() {
    try {
      if (chrome && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        this.currentTab = tab;

        if (tab) {
          this.setText('#page-title', tab.title || 'Untitled');
          this.setText('#page-url', this.formatUrl(tab.url));
        }
      }
    } catch (error) {
      this.handleError(error, 'PopupController.getCurrentTabInfo');
    }
  }

  /**
   * Load status types for the form
   */
  async loadStatusTypes() {
    try {
      this.statusTypes = await this.configService.getStatusTypes();

      // Ensure statusTypes is an array
      if (!Array.isArray(this.statusTypes)) {
        console.warn(
          '[PopupController] statusTypes is not an array:',
          typeof this.statusTypes,
          this.statusTypes
        );
        this.statusTypes = [];
      }

      const select = $('#bookmark-status-select');
      if (select) {
        // Clear existing options except the first one
        while (select.children.length > 1) {
          select.removeChild(select.lastChild);
        }

        // Add status options
        this.statusTypes.forEach(statusType => {
          const option = document.createElement('option');
          option.value = statusType.id;
          option.textContent = statusType.name;
          select.appendChild(option);
        });
      }
    } catch (error) {
      this.handleError(error, 'PopupController.loadStatusTypes');
    }
  }

  /**
   * Load current page bookmark status
   */
  async loadCurrentPageBookmark() {
    if (!this.currentTab || !this.currentTab.url) return;

    try {
      this.currentBookmark = await this.bookmarkService.findBookmarkByUrl(this.currentTab.url);

      const statusElement = $('#bookmark-status');
      const deleteButton = $('#delete-bookmark');
      const form = $('#bookmark-form');

      if (this.currentBookmark) {
        // Page is bookmarked
        const statusType = this.statusTypes.find(s => s.id === this.currentBookmark.status);
        const statusIndicator = this.createStatusIndicator(statusType);

        clearElement(statusElement);
        statusElement.appendChild(statusIndicator);
        statusElement.classList.add('exists');
        statusElement.classList.remove('new');

        // Pre-fill form with existing data
        if (form) {
          setFormData(form, {
            status: this.currentBookmark.status,
            tags: this.currentBookmark.tags ? this.currentBookmark.tags.join(', ') : '',
            notes: this.currentBookmark.description || ''
          });
        }

        show(deleteButton);
      } else {
        // Page is not bookmarked
        this.setText(statusElement, 'Not bookmarked');
        statusElement.classList.add('new');
        statusElement.classList.remove('exists');

        // Set default status
        const defaultStatus = await this.configService.getDefaultStatusType();
        if (form && defaultStatus) {
          setFormData(form, { status: defaultStatus.id });
        }

        hide(deleteButton);
      }
    } catch (error) {
      this.handleError(error, 'PopupController.loadCurrentPageBookmark');
    }
  }

  /**
   * Handle save bookmark
   */
  async handleSaveBookmark() {
    if (!this.currentTab) {
      this.showError('No current page information');
      return;
    }

    const form = $('#bookmark-form');
    const formData = this.getFormData(form);

    if (!formData.status) {
      this.showError('Please select a status');
      return;
    }

    const bookmarkData = {
      url: this.currentTab.url,
      title: this.currentTab.title || '',
      status: formData.status,
      tags: formData.tags
        ? formData.tags
            .split(',')
            .map(t => t.trim())
            .filter(t => t)
        : [],
      description: formData.notes || ''
    };

    await this.safeExecute(
      async () => {
        if (this.currentBookmark) {
          // Update existing bookmark
          const updated = await this.bookmarkService.updateBookmark(
            this.currentBookmark.id,
            bookmarkData
          );
          this.currentBookmark = updated;
          this.showSuccess('Bookmark updated');
        } else {
          // Create new bookmark
          const created = await this.bookmarkService.createBookmark(bookmarkData);
          this.currentBookmark = created;
          this.showSuccess('Bookmark saved');
        }

        // Refresh current page status and recent bookmarks
        await this.loadCurrentPageBookmark();
        await this.loadRecentBookmarks();
      },
      'PopupController.handleSaveBookmark',
      '#save-bookmark',
      'Saving...'
    );
  }

  /**
   * Handle delete bookmark
   */
  async handleDeleteBookmark() {
    if (!this.currentBookmark) return;

    const confirmed = confirm('Are you sure you want to delete this bookmark?');
    if (!confirmed) return;

    await this.safeExecute(
      async () => {
        await this.bookmarkService.deleteBookmark(this.currentBookmark.id);
        this.currentBookmark = null;
        this.showSuccess('Bookmark deleted');

        // Refresh UI
        await this.loadCurrentPageBookmark();
        await this.loadRecentBookmarks();
      },
      'PopupController.handleDeleteBookmark',
      '#delete-bookmark',
      'Deleting...'
    );
  }

  /**
   * Load recent bookmarks
   */
  async loadRecentBookmarks() {
    const list = $('#recent-list');
    if (!list) return;

    try {
      // Show loading
      clearElement(list);
      const loadingItem = document.createElement('li');
      loadingItem.className = 'loading';
      loadingItem.textContent = 'Loading recent bookmarks...';
      list.appendChild(loadingItem);

      const recentBookmarks = await this.bookmarkService.getRecentBookmarks(5);

      // Clear loading
      clearElement(list);

      if (recentBookmarks.length === 0) {
        const noBookmarksItem = document.createElement('li');
        noBookmarksItem.className = 'loading';
        noBookmarksItem.textContent = 'No bookmarks yet';
        list.appendChild(noBookmarksItem);
        return;
      }

      // Create bookmark items
      recentBookmarks.forEach(bookmark => {
        const item = this.createRecentBookmarkItem(bookmark);
        list.appendChild(item);
      });
    } catch (error) {
      this.handleError(error, 'PopupController.loadRecentBookmarks');
      clearElement(list);
      const errorItem = document.createElement('li');
      errorItem.className = 'loading';
      errorItem.textContent = 'Failed to load bookmarks';
      list.appendChild(errorItem);
    }
  }

  /**
   * Create recent bookmark item element
   * @param {Object} bookmark - Bookmark data
   * @returns {Element} Bookmark item element
   */
  createRecentBookmarkItem(bookmark) {
    const statusType = this.statusTypes.find(s => s.id === bookmark.status);

    const item = document.createElement('li');
    item.className = 'recent-item';
    item.dataset.url = bookmark.url;
    item.dataset.testid = 'recent-bookmark-item';

    const title = document.createElement('h5');
    title.className = 'recent-item-title';
    title.textContent = bookmark.title || 'Untitled';

    const url = document.createElement('p');
    url.className = 'recent-item-url';
    url.textContent = this.formatUrl(bookmark.url);

    const meta = document.createElement('div');
    meta.className = 'recent-item-meta';

    const status = document.createElement('div');
    status.className = 'recent-item-status';
    if (statusType) {
      const statusIndicator = this.createStatusIndicator(statusType);
      status.appendChild(statusIndicator);
    }

    const date = document.createElement('span');
    date.className = 'recent-item-date';
    date.textContent = this.formatDate(bookmark.created_at);

    meta.appendChild(status);
    meta.appendChild(date);

    item.appendChild(title);
    item.appendChild(url);
    item.appendChild(meta);

    return item;
  }

  /**
   * Format URL for display (uses shared utility)
   * @param {string} url - URL to format
   * @returns {string} Formatted URL
   */
  formatUrl(url) {
    return formatUrl(url, 40);
  }

  /**
   * Open options page
   */
  openOptionsPage() {
    try {
      if (chrome && chrome.runtime) {
        chrome.runtime.openOptionsPage();
      } else {
        // Fallback for development
        window.open('options.html', '_blank');
      }
    } catch (error) {
      this.handleError(error, 'PopupController.openOptionsPage');
    }
  }

  /**
   * Open bookmark manager
   */
  openBookmarkManager() {
    try {
      const url = chrome.runtime
        ? chrome.runtime.getURL('src/ui/bookmark-manager.html')
        : 'bookmark-manager.html';
      this.openInNewTab(url);
    } catch (error) {
      this.handleError(error, 'PopupController.openBookmarkManager');
    }
  }
}
