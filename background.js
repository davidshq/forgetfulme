// Background service worker for ForgetfulMe extension
class ForgetfulMeBackground {
  constructor() {
    this.authState = null
    this.initializeEventListeners()
    this.initializeAuthState()
  }

  async initializeAuthState() {
    try {
      // Load current auth state from storage
      const result = await chrome.storage.sync.get(['auth_session'])
      this.authState = result.auth_session || null
      
      console.log('Background: Auth state initialized:', this.authState ? 'authenticated' : 'not authenticated')
    } catch (error) {
      console.error('Background: Error initializing auth state:', error)
    }
  }

  initializeEventListeners() {
    // Handle keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
      if (command === 'mark-as-read') {
        this.handleKeyboardShortcut()
      }
    })

    // Handle installation
    chrome.runtime.onInstalled.addListener(async (details) => {
      if (details.reason === 'install') {
        await this.initializeDefaultSettings()
      }
    })

    // Handle messages from popup and other contexts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true // Keep message channel open for async responses
    })

    // Handle storage changes (auth state changes)
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.auth_session) {
        this.handleStorageAuthChange(changes.auth_session.newValue)
      }
    })
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'MARK_AS_READ':
          await this.handleMarkAsRead(message.data)
          sendResponse({ success: true })
          break

        case 'GET_AUTH_STATE':
          const authState = await this.getAuthState()
          sendResponse({ success: true, authState })
          break

        case 'AUTH_STATE_CHANGED':
          // This is handled by storage.onChanged, but we can log it
          console.log('Background: Received auth state change message')
          break

        case 'GET_CONFIG_SUMMARY':
          const summary = this.getAuthSummary()
          sendResponse({ success: true, summary })
          break

        default:
          console.warn('Background: Unknown message type:', message.type)
          sendResponse({ success: false, error: 'Unknown message type' })
      }
    } catch (error) {
      console.error('Background: Error handling message:', error)
      sendResponse({ success: false, error: error.message })
    }
  }

  async getAuthState() {
    const result = await chrome.storage.sync.get(['auth_session'])
    return result.auth_session || null
  }

  async isAuthenticated() {
    const authState = await this.getAuthState()
    return authState !== null
  }

  handleAuthStateChange(session) {
    console.log('Background: Auth state changed:', session ? 'authenticated' : 'not authenticated')
    
    // Update extension badge or icon based on auth state
    this.updateExtensionBadge(session)
    
    // Show notification for significant auth changes
    if (session) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe',
        message: 'Successfully signed in!'
      })
    }
  }

  handleStorageAuthChange(newAuthState) {
    // Update local auth state
    this.authState = newAuthState
    
    // Handle the auth state change
    this.handleAuthStateChange(newAuthState)
  }

  updateExtensionBadge(session) {
    try {
      if (session) {
        // User is authenticated - show green badge or checkmark
        chrome.action.setBadgeText({ text: '✓' })
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' })
      } else {
        // User is not authenticated - show warning or clear badge
        chrome.action.setBadgeText({ text: '' })
      }
    } catch (error) {
      console.debug('Background: Error updating badge:', error.message)
    }
  }

  async handleKeyboardShortcut() {
    try {
      // Check if user is authenticated before allowing keyboard shortcut
      const isAuthenticated = await this.isAuthenticated()
      
      if (!isAuthenticated) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'ForgetfulMe',
          message: 'Please sign in to use keyboard shortcuts'
        })
        return
      }

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
      // Log error for debugging
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
      // Log error for debugging
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
      // Check if default settings already exist
      const result = await chrome.storage.sync.get(['customStatusTypes'])
      
      // Only initialize if custom status types don't exist
      if (!result.customStatusTypes) {
        const defaultStatusTypes = [
          'read',
          'good-reference',
          'low-value',
          'revisit-later'
        ]
        
        await chrome.storage.sync.set({
          customStatusTypes: defaultStatusTypes
        })
        
        console.log('Default settings initialized')
      }
    } catch (error) {
      console.error('Error initializing default settings:', error)
    }
  }

  getAuthSummary() {
    return {
      isAuthenticated: this.authState !== null,
      hasSession: !!this.authState,
      userId: this.authState?.user?.id || null,
      email: this.authState?.user?.email || null,
      initialized: true
    }
  }
}

// Initialize background service worker
new ForgetfulMeBackground() 