/**
 * @fileoverview Popup script for ForgetfulMe extension with Supabase integration
 * @module popup
 * @description Main popup interface for the ForgetfulMe Chrome extension.
 * Handles user authentication, bookmark management, and UI interactions.
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import UIComponents from './utils/ui-components.js';
import AuthStateManager from './utils/auth-state-manager.js';
import ErrorHandler from './utils/error-handler.js';
import UIMessages from './utils/ui-messages.js';
import ConfigManager from './utils/config-manager.js';
import BookmarkTransformer from './utils/bookmark-transformer.js';
import SupabaseConfig from './supabase-config.js';
import SupabaseService from './supabase-service.js';
import AuthUI from './auth-ui.js';

/**
 * Main popup class for the ForgetfulMe Chrome extension
 * @class ForgetfulMePopup
 * @description Manages the popup interface, user authentication, and bookmark operations
 *
 * @example
 * // The popup is automatically instantiated when the popup.html loads
 * // No manual instantiation required
 */
class ForgetfulMePopup {
  /**
   * Initialize the popup with all required services and managers
   * @constructor
   * @description Sets up the popup with authentication, configuration, and service dependencies
   */
  constructor() {
    /** @type {ConfigManager} Configuration manager for user preferences */
    this.configManager = new ConfigManager();
    /** @type {AuthStateManager} Authentication state manager */
    this.authStateManager = new AuthStateManager();
    /** @type {SupabaseConfig} Supabase configuration manager */
    this.supabaseConfig = new SupabaseConfig();
    /** @type {SupabaseService} Supabase service for data operations */
    this.supabaseService = new SupabaseService(this.supabaseConfig);
    /** @type {AuthUI} Authentication UI manager */
    this.authUI = new AuthUI(
      this.supabaseConfig,
      () => this.onAuthSuccess(),
      this.authStateManager
    );

    /** @type {string|null} Current bookmark URL being edited */
    this.currentBookmarkUrl = null;

    // Initialize after DOM is ready
    this.initializeAsync();
  }

  /**
   * Initialize the popup asynchronously after DOM is ready
   * @async
   * @method initializeAsync
   * @description Performs all initialization tasks including DOM setup, app initialization, and auth state setup
   * @throws {Error} When initialization fails
   *
   * @example
   * // Called automatically in constructor
   * await popup.initializeAsync();
   */
  async initializeAsync() {
    try {
      // Wait for DOM to be ready
      await UIComponents.DOM.ready();

      this.initializeElements();
      await this.initializeApp();
      this.initializeAuthState();
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'popup.initializeAsync');
      console.error('Failed to initialize popup:', errorResult);
    }
  }

  /**
   * Initialize authentication state and set up listeners
   * @async
   * @method initializeAuthState
   * @description Sets up authentication state management and listeners for auth state changes
   * @throws {Error} When auth state initialization fails
   *
   * @example
   * // Called during popup initialization
   * await popup.initializeAuthState();
   */
  async initializeAuthState() {
    try {
      await this.authStateManager.initialize();

      // Listen for auth state changes
      this.authStateManager.addListener('authStateChanged', session => {
        this.handleAuthStateChange(session);
      });

      // Listen for runtime messages from background
      chrome.runtime.onMessage.addListener(
        (message, _sender, _sendResponse) => {
          if (message.type === 'AUTH_STATE_CHANGED') {
            this.handleAuthStateChange(message.session);
          }
        }
      );

      console.log('Popup: Auth state initialized');
    } catch (error) {
      console.error('Popup: Error initializing auth state:', error);
    }
  }

  /**
   * Handle authentication state changes and update UI accordingly
   * @method handleAuthStateChange
   * @param {Object|null} session - The current session object or null if not authenticated
   * @description Updates the UI based on authentication state - shows main interface for authenticated users or auth interface for unauthenticated users
   *
   * @example
   * // Called automatically when auth state changes
   * popup.handleAuthStateChange(session);
   */
  handleAuthStateChange(session) {
    console.log(
      'Popup: Auth state changed:',
      session ? 'authenticated' : 'not authenticated'
    );

    // Update UI based on auth state
    if (session) {
      // User is authenticated - show main interface
      this.showMainInterface();
      this.loadRecentEntries();
      this.loadCustomStatusTypes();
    } else {
      // User is not authenticated - show auth interface
      this.showAuthInterface();
    }
  }

  /**
   * Initialize DOM element references
   * @method initializeElements
   * @description Sets up references to key DOM elements used throughout the popup
   *
   * @example
   * // Called during popup initialization
   * popup.initializeElements();
   */
  initializeElements() {
    // Initialize elements that exist in the initial HTML
    /** @type {HTMLElement} Main app container */
    this.appContainer = UIComponents.DOM.getElement('app');

    // Try to get dynamically created elements with safe access
    /** @type {HTMLSelectElement} Status selection dropdown */
    this.readStatusSelect = UIComponents.DOM.getElement('read-status');
    /** @type {HTMLInputElement} Tags input field */
    this.tagsInput = UIComponents.DOM.getElement('tags');
    /** @type {HTMLButtonElement} Form submit button */
    this.markReadBtn = UIComponents.DOM.querySelector('button[type="submit"]'); // Form submit button
    /** @type {HTMLButtonElement} Settings button */
    this.settingsBtn = UIComponents.DOM.getElement('settings-btn');
    /** @type {HTMLElement} Recent entries list container */
    this.recentList = UIComponents.DOM.getElement('recent-list');
  }

  bindEvents() {
    // Only bind events if elements exist using safe DOM utilities
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener('click', () => this.openSettings());
    }

    if (this.tagsInput) {
      // Allow Enter key to mark as read
      this.tagsInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
          this.markAsRead();
        }
      });
    }
  }

  async initializeApp() {
    try {
      // Check if Supabase is configured
      if (!(await this.supabaseConfig.isConfigured())) {
        this.showSetupInterface();
        return;
      }

      // Initialize Supabase with retry mechanism
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          await this.supabaseService.initialize();
          break; // Success, exit the retry loop
        } catch (error) {
          retryCount++;
          console.log(
            `Supabase initialization attempt ${retryCount} failed:`,
            error
          );

          if (retryCount >= maxRetries) {
            throw error; // Re-throw if we've exhausted retries
          }

          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Check if user is authenticated using auth state manager
      const isAuthenticated = await this.authStateManager.isAuthenticated();

      if (isAuthenticated) {
        this.showMainInterface();
        this.loadRecentEntries();
        this.loadCustomStatusTypes();
        // Check current tab URL status
        await this.checkCurrentTabUrlStatus();
      } else {
        this.showAuthInterface();
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'popup.initializeApp');
      if (errorResult.shouldShowToUser) {
        UIMessages.error(errorResult.userMessage, this.appContainer);
      }
      this.showSetupInterface();
    }
  }

  showSetupInterface() {
    // Create main container
    const container = UIComponents.createContainer(
      'Welcome to ForgetfulMe!',
      'This extension helps you mark websites as read for research purposes.',
      'setup-container'
    );

    // Create setup section
    const setupSection = UIComponents.createSection(
      '🔧 Setup Required',
      'setup-section'
    );
    setupSection.innerHTML = `
      <p>To use this extension, you need to configure your Supabase backend:</p>
      
      <ol>
        <li>Create a Supabase project at <a href="https://supabase.com" target="_blank">supabase.com</a></li>
        <li>Get your Project URL and anon public key</li>
        <li>Open the extension settings to configure</li>
      </ol>
    `;

    const settingsBtn = UIComponents.createButton(
      'Open Settings',
      () => this.openSettings(),
      'primary'
    );
    setupSection.appendChild(settingsBtn);
    container.appendChild(setupSection);

    // Create how it works section
    const howItWorksSection = UIComponents.createSection(
      '📚 How it works',
      'setup-section'
    );
    howItWorksSection.innerHTML = `
      <ul>
        <li>Click the extension icon to mark the current page</li>
        <li>Choose a status (Read, Good Reference, etc.)</li>
        <li>Add tags to organize your entries</li>
        <li>View your recent entries in the popup</li>
      </ul>
    `;
    container.appendChild(howItWorksSection);

    this.appContainer.innerHTML = '';
    this.appContainer.appendChild(container);
  }

  showAuthInterface() {
    this.authUI.showLoginForm(this.appContainer);
  }

  onAuthSuccess() {
    // Update auth state in the manager
    this.authStateManager.setAuthState(this.supabaseConfig.session);

    this.showMainInterface();
    this.loadRecentEntries();
    this.loadCustomStatusTypes();
  }

  showMainInterface() {
    // Create header with better accessibility
    const header = document.createElement('header');
    header.setAttribute('role', 'banner');

    const title = document.createElement('h1');
    title.textContent = 'ForgetfulMe';
    title.setAttribute('id', 'popup-title');
    header.appendChild(title);

    const headerActions = document.createElement('div');
    headerActions.className = 'grid';
    headerActions.setAttribute('role', 'toolbar');
    headerActions.setAttribute('aria-label', 'Extension actions');

    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'outline';
    settingsBtn.setAttribute('aria-label', 'Open settings');
    settingsBtn.setAttribute('title', 'Settings');
    settingsBtn.addEventListener('click', () => this.openSettings());

    const settingsIcon = document.createElement('span');
    settingsIcon.textContent = '⚙️';
    settingsBtn.appendChild(settingsIcon);

    const settingsText = document.createElement('span');
    settingsText.textContent = ' Settings';
    settingsBtn.appendChild(settingsText);

    headerActions.appendChild(settingsBtn);

    const manageBtn = document.createElement('button');
    manageBtn.className = 'outline';
    manageBtn.setAttribute('aria-label', 'Manage bookmarks');
    manageBtn.setAttribute('title', 'Manage Bookmarks');
    manageBtn.addEventListener('click', () => this.showBookmarkManagement());

    const manageIcon = document.createElement('span');
    manageIcon.textContent = '📚';
    manageBtn.appendChild(manageIcon);

    const manageText = document.createElement('span');
    manageText.textContent = ' Manage URLs';
    manageBtn.appendChild(manageText);

    headerActions.appendChild(manageBtn);

    header.appendChild(headerActions);

    // Create main content container
    const mainContent = document.createElement('div');
    mainContent.setAttribute('role', 'main');

    // Create form with better accessibility
    const form = document.createElement('form');
    form.setAttribute('role', 'form');
    form.setAttribute('aria-label', 'Mark current page as read');

    // Status selection group
    const statusGroup = document.createElement('div');

    const statusLabel = document.createElement('label');
    statusLabel.setAttribute('for', 'read-status');
    statusLabel.textContent = 'Mark as:';
    statusGroup.appendChild(statusLabel);

    const statusSelect = document.createElement('select');
    statusSelect.id = 'read-status';
    statusSelect.name = 'read-status';
    statusSelect.setAttribute('aria-describedby', 'status-help');
    statusGroup.appendChild(statusSelect);

    // Add status options
    const statusOptions = [
      { value: 'read', text: 'Read' },
      { value: 'good-reference', text: 'Good Reference' },
      { value: 'low-value', text: 'Low Value' },
      { value: 'revisit-later', text: 'Revisit Later' },
    ];

    statusOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      statusSelect.appendChild(optionElement);
    });

    const statusHelp = document.createElement('small');
    statusHelp.id = 'status-help';
    statusHelp.textContent = 'Choose how you want to categorize this page';
    statusGroup.appendChild(statusHelp);

    // Tags input group
    const tagsGroup = document.createElement('div');

    const tagsLabel = document.createElement('label');
    tagsLabel.setAttribute('for', 'tags');
    tagsLabel.textContent = 'Tags (comma separated):';
    tagsGroup.appendChild(tagsLabel);

    const tagsInput = document.createElement('input');
    tagsInput.type = 'text';
    tagsInput.id = 'tags';
    tagsInput.name = 'tags';
    tagsInput.placeholder = 'research, tutorial, important';
    tagsInput.setAttribute('aria-describedby', 'tags-help');
    tagsGroup.appendChild(tagsInput);

    const tagsHelp = document.createElement('small');
    tagsHelp.id = 'tags-help';
    tagsHelp.textContent = 'Add tags to help organize your bookmarks';
    tagsGroup.appendChild(tagsHelp);

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'primary';
    submitBtn.textContent = 'Mark as Read';
    submitBtn.setAttribute(
      'aria-label',
      'Mark current page as read with selected status and tags'
    );

    // Add form elements
    form.appendChild(statusGroup);
    form.appendChild(tagsGroup);
    form.appendChild(submitBtn);

    // Add form submit handler
    form.addEventListener('submit', e => {
      e.preventDefault();
      this.markAsRead();
    });

    mainContent.appendChild(form);

    // Create recent section with better accessibility
    const recentSection = document.createElement('section');
    recentSection.setAttribute('role', 'region');
    recentSection.setAttribute('aria-label', 'Recent entries');

    const recentTitle = document.createElement('h3');
    recentTitle.textContent = 'Recent Entries';
    recentSection.appendChild(recentTitle);

    const recentList = document.createElement('div');
    recentList.id = 'recent-list';
    recentList.setAttribute('role', 'list');
    recentList.setAttribute('aria-label', 'Recent bookmarks');
    recentSection.appendChild(recentList);

    // Assemble the interface
    this.appContainer.innerHTML = '';
    this.appContainer.appendChild(header);
    this.appContainer.appendChild(mainContent);
    this.appContainer.appendChild(recentSection);

    // Re-initialize elements after DOM update
    this.initializeElements();
    this.bindEvents();
  }

  async markAsRead() {
    try {
      // Safely get form values using DOM utilities
      const status = UIComponents.DOM.getValue('read-status') || 'read';
      const tags = UIComponents.DOM.getValue('tags') || '';

      // Get current tab info
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (
        !tab.url ||
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://')
      ) {
        UIMessages.error(
          'Cannot mark browser pages as read',
          this.appContainer
        );
        return;
      }

      const bookmark = BookmarkTransformer.fromCurrentTab(
        tab,
        status,
        tags.trim() ? tags.trim().split(',') : []
      );

      const result = await this.supabaseService.saveBookmark(bookmark);

      if (result.isDuplicate) {
        // Show edit interface for existing bookmark
        this.showEditInterface(result);
      } else {
        UIMessages.success('Page marked as read!', this.appContainer);

        // Clear tags input safely
        UIComponents.DOM.setValue('tags', '');

        this.loadRecentEntries();

        // Notify background script about saved bookmark
        try {
          await chrome.runtime.sendMessage({
            type: 'BOOKMARK_SAVED',
            data: { url: bookmark.url },
          });
        } catch (error) {
          console.debug(
            'Popup: Error notifying background about saved bookmark:',
            error.message
          );
        }

        // Close popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'popup.markAsRead');
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }

  async loadRecentEntries() {
    try {
      const bookmarks = await this.supabaseService.getBookmarks({ limit: 5 });

      const recentListEl = document.getElementById('recent-list');
      if (!recentListEl) return;

      recentListEl.innerHTML = '';

      if (bookmarks.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'recent-item empty';
        emptyItem.setAttribute('role', 'listitem');
        emptyItem.setAttribute('aria-label', 'No recent entries');

        const emptyIcon = document.createElement('div');
        emptyIcon.textContent = '📚';
        emptyItem.appendChild(emptyIcon);

        const emptyTitle = document.createElement('div');
        emptyTitle.textContent = 'No entries yet';
        emptyItem.appendChild(emptyTitle);

        const emptyMeta = document.createElement('div');
        emptyMeta.innerHTML = '<small>No entries</small>';
        emptyItem.appendChild(emptyMeta);

        recentListEl.appendChild(emptyItem);
        return;
      }

      bookmarks.forEach((bookmark, index) => {
        const uiBookmark = BookmarkTransformer.toUIFormat(bookmark);
        const listItem = this.createRecentListItem(uiBookmark, index);
        recentListEl.appendChild(listItem);
      });
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'popup.loadRecentEntries');
      const recentListEl = document.getElementById('recent-list');
      if (recentListEl) {
        const errorItem = document.createElement('div');
        errorItem.setAttribute('role', 'listitem');
        errorItem.setAttribute('aria-label', 'Error loading entries');

        const errorTitle = document.createElement('div');
        errorTitle.textContent = 'Error loading entries';
        errorItem.appendChild(errorTitle);

        const errorMeta = document.createElement('div');
        errorMeta.innerHTML = '<small>Error</small>';
        errorItem.appendChild(errorMeta);

        recentListEl.appendChild(errorItem);
      }

      if (errorResult.shouldShowToUser) {
        UIMessages.error(errorResult.userMessage, this.appContainer);
      }
    }
  }

  /**
   * Create a recent list item with proper accessibility
   * @method createRecentListItem
   * @param {Object} bookmark - The bookmark to display
   * @param {number} index - The index of the bookmark in the list
   * @returns {HTMLElement} The list item element
   */
  createRecentListItem(bookmark, index) {
    const listItem = document.createElement('div');
    listItem.setAttribute('role', 'listitem');
    listItem.setAttribute(
      'aria-label',
      `Recent bookmark ${index + 1}: ${bookmark.title}`
    );

    // Add title
    const titleDiv = document.createElement('div');
    titleDiv.textContent = bookmark.title;
    titleDiv.setAttribute('title', bookmark.title);
    listItem.appendChild(titleDiv);

    // Add meta information
    const metaDiv = document.createElement('div');

    // Add status badge
    const statusSpan = document.createElement('small');
    statusSpan.textContent = this.formatStatus(bookmark.status);
    statusSpan.setAttribute(
      'aria-label',
      `Status: ${this.formatStatus(bookmark.status)}`
    );
    metaDiv.appendChild(statusSpan);

    // Add time
    const timeSpan = document.createElement('small');
    timeSpan.textContent = this.formatTime(
      new Date(bookmark.created_at).getTime()
    );
    timeSpan.setAttribute(
      'aria-label',
      `Created ${this.formatTime(new Date(bookmark.created_at).getTime())}`
    );
    metaDiv.appendChild(timeSpan);

    // Add tags if they exist
    if (bookmark.tags && bookmark.tags.length > 0) {
      const tagsSpan = document.createElement('small');
      tagsSpan.textContent = `Tags: ${bookmark.tags.join(', ')}`;
      tagsSpan.setAttribute('aria-label', `Tags: ${bookmark.tags.join(', ')}`);
      metaDiv.appendChild(tagsSpan);
    }

    listItem.appendChild(metaDiv);

    return listItem;
  }

  async loadCustomStatusTypes() {
    try {
      await this.configManager.initialize();
      const customStatusTypes = await this.configManager.getCustomStatusTypes();

      if (customStatusTypes.length > 0) {
        // Safely get the select element
        const readStatusSelectEl = UIComponents.DOM.getElement('read-status');
        if (readStatusSelectEl) {
          // Clear default options and add custom ones
          readStatusSelectEl.innerHTML = '';
          customStatusTypes.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = this.formatStatus(status);
            readStatusSelectEl.appendChild(option);
          });
        }
      }
    } catch (error) {
      ErrorHandler.handle(error, 'popup.loadCustomStatusTypes', {
        silent: true,
      });
      // Don't show user for this error as it's not critical
    }
  }

  formatStatus(status) {
    return status
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
  }

  showMessage(message, type) {
    // Use the centralized UIMessages system
    UIMessages.show(message, type, this.appContainer);
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  /**
   * Open bookmark management in a new tab
   * @method showBookmarkManagement
   * @description Opens the bookmark management interface in a new tab for better usability
   */
  showBookmarkManagement() {
    // Open bookmark management page in a new tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('bookmark-management.html'),
    });
  }

  /**
   * Check the current tab URL status and notify background script
   * @async
   * @method checkCurrentTabUrlStatus
   * @description Checks if the current tab URL is already saved and notifies background script
   */
  async checkCurrentTabUrlStatus() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab || !tab.url) {
        return;
      }

      // Skip browser pages and extension pages
      if (
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('about:') ||
        tab.url.startsWith('moz-extension://')
      ) {
        return;
      }

      // Check if URL is already saved
      try {
        const bookmark = await this.supabaseService.getBookmarkByUrl(tab.url);
        const isSaved = !!bookmark;

        // Send result to background script
        await chrome.runtime.sendMessage({
          type: 'URL_STATUS_RESULT',
          data: { url: tab.url, isSaved },
        });
      } catch (error) {
        console.debug('Popup: Error checking URL in database:', error.message);
        // Send default state on error
        await chrome.runtime.sendMessage({
          type: 'URL_STATUS_RESULT',
          data: { url: tab.url, isSaved: false },
        });
      }
    } catch (error) {
      console.debug('Popup: Error checking URL status:', error.message);
    }
  }

  showEditInterface(existingBookmark) {
    this.currentBookmarkUrl = existingBookmark.url;
    // Create header
    const header = document.createElement('header');
    const title = document.createElement('h1');
    title.textContent = 'Edit Bookmark';
    header.appendChild(title);

    const backBtn = UIComponents.createButton(
      '← Back',
      () => this.showMainInterface(),
      'secondary',
      { title: 'Back to main interface' }
    );
    header.appendChild(backBtn);

    // Create main content container
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';

    // Create info section
    const infoSection = UIComponents.createSection(
      'Bookmark Info',
      'info-section'
    );
    infoSection.innerHTML = `
      <div class="bookmark-info">
        <p><strong>Title:</strong> ${existingBookmark.title}</p>
        <p><strong>URL:</strong> <a href="${existingBookmark.url}" target="_blank">${existingBookmark.url}</a></p>
        <p><strong>Current Status:</strong> ${this.formatStatus(existingBookmark.read_status)}</p>
        <p><strong>Current Tags:</strong> ${existingBookmark.tags ? existingBookmark.tags.join(', ') : 'None'}</p>
        <p><strong>Created:</strong> ${this.formatTime(new Date(existingBookmark.created_at).getTime())}</p>
      </div>
    `;

    // Create edit form using UI components
    const statusOptions = [
      { value: 'read', text: 'Read' },
      { value: 'good-reference', text: 'Good Reference' },
      { value: 'low-value', text: 'Low Value' },
      { value: 'revisit-later', text: 'Revisit Later' },
    ];

    // Mark the current status as selected
    statusOptions.forEach(option => {
      if (option.value === existingBookmark.read_status) {
        option.selected = true;
      }
    });

    const editForm = UIComponents.createForm(
      'editBookmarkForm',
      e => {
        e.preventDefault();
        this.updateBookmark(existingBookmark.id);
      },
      [
        {
          type: 'select',
          id: 'edit-read-status',
          label: 'Update Status:',
          options: {
            options: statusOptions,
          },
        },
        {
          type: 'text',
          id: 'edit-tags',
          label: 'Update Tags (comma separated):',
          options: {
            placeholder: 'research, tutorial, important',
            value: existingBookmark.tags
              ? existingBookmark.tags.join(', ')
              : '',
          },
        },
      ],
      {
        submitText: 'Update Bookmark',
      }
    );

    // Assemble the interface
    this.appContainer.innerHTML = '';
    this.appContainer.appendChild(header);
    this.appContainer.appendChild(mainContent);
    mainContent.appendChild(infoSection);
    mainContent.appendChild(editForm);
  }

  async updateBookmark(bookmarkId) {
    try {
      const status = UIComponents.DOM.getValue('edit-read-status') || 'read';
      const tags = UIComponents.DOM.getValue('edit-tags') || '';

      const updates = {
        read_status: status,
        tags: tags.trim()
          ? tags
              .trim()
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag)
          : [],
        updated_at: new Date().toISOString(),
      };

      await this.supabaseService.updateBookmark(bookmarkId, updates);
      UIMessages.success('Bookmark updated successfully!', this.appContainer);

      // Notify background script about updated bookmark
      try {
        await chrome.runtime.sendMessage({
          type: 'BOOKMARK_UPDATED',
          data: { url: updates.url || this.currentBookmarkUrl },
        });
      } catch (error) {
        console.debug(
          'Popup: Error notifying background about updated bookmark:',
          error.message
        );
      }

      // Return to main interface after a short delay
      setTimeout(() => {
        this.showMainInterface();
        this.loadRecentEntries();
      }, 1500);
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'popup.updateBookmark');
      UIMessages.error(errorResult.userMessage, this.appContainer);
    }
  }
}

// Initialize popup immediately (DOM ready is handled in constructor)
new ForgetfulMePopup();

// Export for testing
export default ForgetfulMePopup;
