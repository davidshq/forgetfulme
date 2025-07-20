// Popup script for ForgetfulMe extension with Supabase integration
import UIComponents from './utils/ui-components.js';
import AuthStateManager from './utils/auth-state-manager.js';
import ErrorHandler from './utils/error-handler.js';
import UIMessages from './utils/ui-messages.js';
import ConfigManager from './utils/config-manager.js';
import BookmarkTransformer from './utils/bookmark-transformer.js';
import SupabaseConfig from './supabase-config.js';
import SupabaseService from './supabase-service.js';
import AuthUI from './auth-ui.js';

class ForgetfulMePopup {
  constructor() {
    this.configManager = new ConfigManager();
    this.authStateManager = new AuthStateManager();
    this.supabaseConfig = new SupabaseConfig();
    this.supabaseService = new SupabaseService(this.supabaseConfig);
    this.authUI = new AuthUI(
      this.supabaseConfig,
      () => this.onAuthSuccess(),
      this.authStateManager
    );

    // Initialize after DOM is ready
    this.initializeAsync();
  }

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

  async initializeAuthState() {
    try {
      await this.authStateManager.initialize();

      // Listen for auth state changes
      this.authStateManager.addListener('authStateChanged', session => {
        this.handleAuthStateChange(session);
      });

      // Listen for runtime messages from background
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'AUTH_STATE_CHANGED') {
          this.handleAuthStateChange(message.session);
        }
      });

      console.log('Popup: Auth state initialized');
    } catch (error) {
      console.error('Popup: Error initializing auth state:', error);
    }
  }

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

  initializeElements() {
    // Initialize elements that exist in the initial HTML
    this.appContainer = UIComponents.DOM.getElement('app');

    // Try to get dynamically created elements with safe access
    this.readStatusSelect = UIComponents.DOM.getElement('read-status');
    this.tagsInput = UIComponents.DOM.getElement('tags');
    this.markReadBtn = UIComponents.DOM.querySelector('button[type="submit"]'); // Form submit button
    this.settingsBtn = UIComponents.DOM.getElement('settings-btn');
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
          console.log(`Supabase initialization attempt ${retryCount} failed:`, error);
          
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
      'ui-btn-primary'
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
    // Create header
    const header = document.createElement('header');
    const title = document.createElement('h1');
    title.textContent = 'ForgetfulMe';
    header.appendChild(title);

    const settingsBtn = UIComponents.createButton(
      '⚙️',
      () => this.openSettings(),
      'ui-btn-secondary settings-btn',
      {
        title: 'Settings',
        id: 'settings-btn',
      }
    );
    header.appendChild(settingsBtn);

    // Create main content container
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';

    // Create form using UI components
    const form = UIComponents.createForm(
      'bookmarkForm',
      e => this.markAsRead(),
      [
        {
          type: 'select',
          id: 'read-status',
          label: 'Mark as:',
          options: {
            options: [
              { value: 'read', text: 'Read' },
              { value: 'good-reference', text: 'Good Reference' },
              { value: 'low-value', text: 'Low Value' },
              { value: 'revisit-later', text: 'Revisit Later' },
            ],
          },
        },
        {
          type: 'text',
          id: 'tags',
          label: 'Tags (comma separated):',
          options: {
            placeholder: 'research, tutorial, important',
          },
        },
      ],
      {
        submitText: 'Mark as Read',
        className: 'bookmark-form',
      }
    );

    mainContent.appendChild(form);

    // Create recent section
    const recentSection = UIComponents.createSection(
      'Recent Entries',
      'recent-section'
    );
    const recentList = UIComponents.createList('recent-list');
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

      const recentListEl = UIComponents.DOM.getElement('recent-list');
      if (!recentListEl) return;

      recentListEl.innerHTML = '';

      if (bookmarks.length === 0) {
        const emptyItem = UIComponents.createListItem(
          {
            title: 'No entries yet',
            meta: {
              status: 'info',
              statusText: 'No entries',
            },
          },
          { className: 'recent-item empty' }
        );
        recentListEl.appendChild(emptyItem);
        return;
      }

      bookmarks.forEach(bookmark => {
        const uiBookmark = BookmarkTransformer.toUIFormat(bookmark);
        const listItem = UIComponents.createListItem(
          {
            title: uiBookmark.title,
            titleTooltip: uiBookmark.title,
            meta: {
              status: uiBookmark.status,
              statusText: this.formatStatus(uiBookmark.status),
              time: this.formatTime(new Date(uiBookmark.created_at).getTime()),
              tags: uiBookmark.tags,
            },
          },
          { className: 'recent-item' }
        );

        recentListEl.appendChild(listItem);
      });
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'popup.loadRecentEntries');
      const recentListEl = UIComponents.DOM.getElement('recent-list');
      if (recentListEl) {
        const errorItem = UIComponents.createListItem(
          {
            title: 'Error loading entries',
            meta: {
              status: 'error',
              statusText: 'Error',
            },
          },
          { className: 'recent-item error' }
        );
        recentListEl.appendChild(errorItem);
      }

      if (errorResult.shouldShowToUser) {
        UIMessages.error(errorResult.userMessage, this.appContainer);
      }
    }
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
      const errorResult = ErrorHandler.handle(
        error,
        'popup.loadCustomStatusTypes',
        { silent: true }
      );
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

  showEditInterface(existingBookmark) {
    // Create header
    const header = document.createElement('header');
    const title = document.createElement('h1');
    title.textContent = 'Edit Bookmark';
    header.appendChild(title);

    const backBtn = UIComponents.createButton(
      '← Back',
      () => this.showMainInterface(),
      'ui-btn-secondary',
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
      (e) => {
        e.preventDefault();
        this.updateBookmark(existingBookmark.id);
      },
      [
        {
          type: 'select',
          id: 'edit-read-status',
          label: 'Update Status:',
          options: {
            options: statusOptions
          },
        },
        {
          type: 'text',
          id: 'edit-tags',
          label: 'Update Tags (comma separated):',
          options: {
            placeholder: 'research, tutorial, important',
            value: existingBookmark.tags ? existingBookmark.tags.join(', ') : ''
          },
        },
      ],
      {
        submitText: 'Update Bookmark'
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
        tags: tags.trim() ? tags.trim().split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        updated_at: new Date().toISOString()
      };

      await this.supabaseService.updateBookmark(bookmarkId, updates);
      UIMessages.success('Bookmark updated successfully!', this.appContainer);

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
