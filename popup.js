// Popup script for ForgetfulMe extension with Supabase integration
class ForgetfulMePopup {
  constructor() {
    this.supabaseConfig = new SupabaseConfig()
    this.supabaseService = new SupabaseService(this.supabaseConfig)
    this.authUI = new AuthUI(this.supabaseConfig, () => this.onAuthSuccess())
    
    this.initializeElements()
    this.initializeApp()
  }

  initializeElements() {
    // Initialize elements that exist in the initial HTML
    this.appContainer = document.getElementById('app')
    
    // Try to get dynamically created elements
    this.readStatusSelect = document.getElementById('read-status')
    this.tagsInput = document.getElementById('tags')
    this.markReadBtn = document.querySelector('button[type="submit"]') // Form submit button
    this.settingsBtn = document.getElementById('settings-btn')
    this.recentList = document.getElementById('recent-list')
  }

  bindEvents() {
    // Only bind events if elements exist
    // Note: Form submit is handled by the form's onSubmit event
    // No need to bind click event to submit button
    
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener('click', () => this.openSettings())
    }
    
    if (this.tagsInput) {
      // Allow Enter key to mark as read
      this.tagsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.markAsRead()
        }
      })
    }
  }

  async initializeApp() {
    try {
      // Check if Supabase is configured
      if (!(await this.supabaseConfig.isConfigured())) {
        this.showSetupInterface()
        return
      }

      // Initialize Supabase
      await this.supabaseService.initialize()
      
      // Check if user is authenticated
      if (this.supabaseConfig.isAuthenticated()) {
        this.showMainInterface()
        this.loadRecentEntries()
        this.loadCustomStatusTypes()
      } else {
        this.showAuthInterface()
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'popup.initializeApp')
      if (errorResult.shouldShowToUser) {
        UIMessages.error(errorResult.userMessage, this.appContainer)
      }
      this.showSetupInterface()
    }
  }

  showSetupInterface() {
    // Create main container
    const container = UIComponents.createContainer(
      'Welcome to ForgetfulMe!',
      'This extension helps you mark websites as read for research purposes.',
      'setup-container'
    )
    
    // Create setup section
    const setupSection = UIComponents.createSection('🔧 Setup Required', 'setup-section')
    setupSection.innerHTML = `
      <p>To use this extension, you need to configure your Supabase backend:</p>
      
      <ol>
        <li>Create a Supabase project at <a href="https://supabase.com" target="_blank">supabase.com</a></li>
        <li>Get your Project URL and anon public key</li>
        <li>Open the extension settings to configure</li>
      </ol>
    `
    
    const settingsBtn = UIComponents.createButton('Open Settings', () => this.openSettings(), 'ui-btn-primary')
    setupSection.appendChild(settingsBtn)
    container.appendChild(setupSection)
    
    // Create how it works section
    const howItWorksSection = UIComponents.createSection('📚 How it works', 'setup-section')
    howItWorksSection.innerHTML = `
      <ul>
        <li>Click the extension icon to mark the current page</li>
        <li>Choose a status (Read, Good Reference, etc.)</li>
        <li>Add tags to organize your entries</li>
        <li>View your recent entries in the popup</li>
      </ul>
    `
    container.appendChild(howItWorksSection)
    
    this.appContainer.innerHTML = ''
    this.appContainer.appendChild(container)
  }

  showAuthInterface() {
    this.authUI.showLoginForm(this.appContainer)
  }

  onAuthSuccess() {
    this.showMainInterface()
    this.loadRecentEntries()
    this.loadCustomStatusTypes()
  }

  showMainInterface() {
    // Create header
    const header = document.createElement('header')
    const title = document.createElement('h1')
    title.textContent = 'ForgetfulMe'
    header.appendChild(title)
    
    const settingsBtn = UIComponents.createButton('⚙️', () => this.openSettings(), 'ui-btn-secondary settings-btn', {
      title: 'Settings',
      id: 'settings-btn'
    })
    header.appendChild(settingsBtn)
    
    // Create main content container
    const mainContent = document.createElement('div')
    mainContent.className = 'main-content'
    
    // Create form using UI components
    const form = UIComponents.createForm('bookmarkForm', (e) => this.markAsRead(), [
      {
        type: 'select',
        id: 'read-status',
        label: 'Mark as:',
        options: {
          options: [
            { value: 'read', text: 'Read' },
            { value: 'good-reference', text: 'Good Reference' },
            { value: 'low-value', text: 'Low Value' },
            { value: 'revisit-later', text: 'Revisit Later' }
          ]
        }
      },
      {
        type: 'text',
        id: 'tags',
        label: 'Tags (comma separated):',
        options: {
          placeholder: 'research, tutorial, important'
        }
      }
    ], {
      submitText: 'Mark as Read',
      className: 'bookmark-form'
    })
    
    mainContent.appendChild(form)
    
    // Create recent section
    const recentSection = UIComponents.createSection('Recent Entries', 'recent-section')
    const recentList = UIComponents.createList('recent-list')
    recentSection.appendChild(recentList)
    
    // Assemble the interface
    this.appContainer.innerHTML = ''
    this.appContainer.appendChild(header)
    this.appContainer.appendChild(mainContent)
    this.appContainer.appendChild(recentSection)
    
    // Re-initialize elements after DOM update
    this.initializeElements()
    this.bindEvents()
  }

  async markAsRead() {
    try {
      const status = this.readStatusSelect.value
      const tags = this.tagsInput.value.trim()
      
      // Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        UIMessages.error('Cannot mark browser pages as read', this.appContainer)
        return
      }

      const bookmark = BookmarkTransformer.fromCurrentTab(tab, status, tags ? tags.split(',') : [])

      await this.supabaseService.saveBookmark(bookmark)
      UIMessages.success('Page marked as read!', this.appContainer)
      this.tagsInput.value = ''
      this.loadRecentEntries()
      
      // Close popup after a short delay
      setTimeout(() => {
        window.close()
      }, 1500)

    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'popup.markAsRead')
      UIMessages.error(errorResult.userMessage, this.appContainer)
    }
  }

  async loadRecentEntries() {
    try {
      const bookmarks = await this.supabaseService.getBookmarks({ limit: 5 })
      
      this.recentList.innerHTML = ''
      
      if (bookmarks.length === 0) {
        const emptyItem = UIComponents.createListItem({
          title: 'No entries yet',
          meta: {
            status: 'info',
            statusText: 'No entries'
          }
        }, { className: 'recent-item empty' })
        this.recentList.appendChild(emptyItem)
        return
      }
      
      bookmarks.forEach(bookmark => {
        const uiBookmark = BookmarkTransformer.toUIFormat(bookmark)
        const listItem = UIComponents.createListItem({
          title: uiBookmark.title,
          titleTooltip: uiBookmark.title,
          meta: {
            status: uiBookmark.status,
            statusText: this.formatStatus(uiBookmark.status),
            time: this.formatTime(new Date(uiBookmark.created_at).getTime()),
            tags: uiBookmark.tags
          }
        }, { className: 'recent-item' })
        
        this.recentList.appendChild(listItem)
      })
      
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'popup.loadRecentEntries')
      const errorItem = UIComponents.createListItem({
        title: 'Error loading entries',
        meta: {
          status: 'error',
          statusText: 'Error'
        }
      }, { className: 'recent-item error' })
      this.recentList.appendChild(errorItem)
      
      if (errorResult.shouldShowToUser) {
        UIMessages.error(errorResult.userMessage, this.appContainer)
      }
    }
  }

  async loadCustomStatusTypes() {
    try {
      const preferences = await this.supabaseService.getUserPreferences()
      const customStatusTypes = preferences.customStatusTypes || []
      
      if (customStatusTypes.length > 0) {
        // Clear default options and add custom ones
        this.readStatusSelect.innerHTML = ''
        customStatusTypes.forEach(status => {
          const option = document.createElement('option')
          option.value = status
          option.textContent = this.formatStatus(status)
          this.readStatusSelect.appendChild(option)
        })
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'popup.loadCustomStatusTypes', { silent: true })
      // Don't show user for this error as it's not critical
    }
  }

  formatStatus(status) {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  formatTime(timestamp) {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    
    return new Date(timestamp).toLocaleDateString()
  }

  showMessage(message, type) {
    // Use the centralized UIMessages system
    UIMessages.show(message, type, this.appContainer)
  }

  openSettings() {
    chrome.runtime.openOptionsPage()
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ForgetfulMePopup()
}) 