// Background service worker for ForgetfulMe extension
class ForgetfulMeBackground {
  constructor() {
    this.initializeEventListeners()
  }

  initializeEventListeners() {
    // Handle keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
      if (command === 'mark-as-read') {
        this.handleKeyboardShortcut()
      }
    })

    // Handle installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.initializeDefaultSettings()
      }
    })

    // Handle messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'MARK_AS_READ') {
        this.handleMarkAsRead(message.data)
        sendResponse({ success: true })
      }
    })
  }

  async handleKeyboardShortcut() {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        return // Don't mark browser pages
      }

      // Show notification to open popup for marking
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe',
        message: 'Click the extension icon to mark this page as read'
      })

    } catch (error) {
      console.error('Error handling keyboard shortcut:', error)
      
      // Show error notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe',
        message: 'Error handling shortcut. Please try again.'
      })
    }
  }

  async handleMarkAsRead(bookmarkData) {
    try {
      // This will be handled by the popup, background just shows notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe',
        message: 'Page marked as read!'
      })
    } catch (error) {
      console.error('Error marking as read:', error)
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe',
        message: 'Error saving bookmark. Please try again.'
      })
    }
  }

  async initializeDefaultSettings() {
    try {
      // Set up default settings in chrome.storage
      await chrome.storage.sync.set({
        customStatusTypes: [
          'read',
          'good-reference',
          'low-value',
          'revisit-later'
        ]
      })
      
      console.log('Default settings initialized')
    } catch (error) {
      console.error('Error initializing default settings:', error)
    }
  }
}

// Initialize background service worker
new ForgetfulMeBackground() 