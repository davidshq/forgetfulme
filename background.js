// Background service worker for ForgetfulMe extension
class ForgetfulMeBackground {
  constructor() {
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Handle keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
      if (command === 'mark-as-read') {
        this.handleKeyboardShortcut();
      }
    });

    // Handle installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.initializeDefaultSettings();
      }
    });
  }

  async handleKeyboardShortcut() {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        return; // Don't mark browser pages
      }

      // Create a basic entry with default status
      const entry = {
        url: tab.url,
        title: tab.title,
        status: 'read',
        tags: [],
        timestamp: Date.now(),
        id: this.generateId()
      };

      // Save the entry
      await this.saveEntry(entry);
      
      // Show a notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe',
        message: 'Page marked as read!'
      });

    } catch (error) {
      console.error('Error handling keyboard shortcut:', error);
    }
  }

  async saveEntry(entry) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(['entries'], (result) => {
        const entries = result.entries || [];
        entries.unshift(entry);
        
        // Keep only the last 1000 entries
        if (entries.length > 1000) {
          entries.splice(1000);
        }
        
        chrome.storage.sync.set({ entries }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async initializeDefaultSettings() {
    try {
      // Set default custom status types if none exist
      const result = await chrome.storage.sync.get(['customStatusTypes']);
      if (!result.customStatusTypes) {
        const defaultStatusTypes = [
          'read',
          'good-reference',
          'low-value',
          'revisit-later'
        ];
        
        await chrome.storage.sync.set({ customStatusTypes: defaultStatusTypes });
      }
    } catch (error) {
      console.error('Error initializing default settings:', error);
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Initialize background service worker
new ForgetfulMeBackground(); 