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
    this.markReadBtn = document.getElementById('mark-read')
    this.settingsBtn = document.getElementById('settings-btn')
    this.recentList = document.getElementById('recent-list')
  }

  bindEvents() {
    // Only bind events if elements exist
    if (this.markReadBtn) {
      this.markReadBtn.addEventListener('click', () => this.markAsRead())
    }
    
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
      console.error('Error initializing app:', error)
      this.showSetupInterface()
    }
  }

  showSetupInterface() {
    this.appContainer.innerHTML = `
      <div class="setup-container">
        <h2>Welcome to ForgetfulMe!</h2>
        <p>This extension helps you mark websites as read for research purposes.</p>
        
        <div class="setup-section">
          <h3>🔧 Setup Required</h3>
          <p>To use this extension, you need to configure your Supabase backend:</p>
          
          <ol>
            <li>Create a Supabase project at <a href="https://supabase.com" target="_blank">supabase.com</a></li>
            <li>Get your Project URL and anon public key</li>
            <li>Open the extension settings to configure</li>
          </ol>
          
          <button id="open-settings" class="primary-btn">Open Settings</button>
        </div>
        
        <div class="setup-section">
          <h3>📚 How it works</h3>
          <ul>
            <li>Click the extension icon to mark the current page</li>
            <li>Choose a status (Read, Good Reference, etc.)</li>
            <li>Add tags to organize your entries</li>
            <li>View your recent entries in the popup</li>
          </ul>
        </div>
      </div>
    `
    
    // Bind settings button
    const settingsBtn = document.getElementById('open-settings')
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettings())
    }
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
    // Show the main popup interface
    this.appContainer.innerHTML = `
      <header>
        <h1>ForgetfulMe</h1>
        <button id="settings-btn" class="settings-btn" title="Settings">⚙️</button>
      </header>
      
      <div class="main-content">
        <div class="form-group">
          <label for="read-status">Mark as:</label>
          <select id="read-status">
            <option value="read">Read</option>
            <option value="good-reference">Good Reference</option>
            <option value="low-value">Low Value</option>
            <option value="revisit-later">Revisit Later</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="tags">Tags (comma separated):</label>
          <input type="text" id="tags" placeholder="research, tutorial, important">
        </div>
        
        <button id="mark-read" class="primary-btn">Mark as Read</button>
      </div>
      
      <div class="recent-section">
        <h3>Recent Entries</h3>
        <div id="recent-list"></div>
      </div>
    `
    
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
        this.showMessage('Cannot mark browser pages as read', 'error')
        return
      }

      const bookmark = {
        url: tab.url,
        title: tab.title,
        status: status,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        timestamp: Date.now()
      }

      await this.supabaseService.saveBookmark(bookmark)
      this.showMessage('Page marked as read!', 'success')
      this.tagsInput.value = ''
      this.loadRecentEntries()
      
      // Close popup after a short delay
      setTimeout(() => {
        window.close()
      }, 1500)

    } catch (error) {
      console.error('Error marking as read:', error)
      this.showMessage('Error saving entry', 'error')
    }
  }

  async loadRecentEntries() {
    try {
      const bookmarks = await this.supabaseService.getBookmarks({ limit: 5 })
      
      this.recentList.innerHTML = ''
      
      if (bookmarks.length === 0) {
        this.recentList.innerHTML = '<div class="recent-item">No entries yet</div>'
        return
      }
      
      bookmarks.forEach(bookmark => {
        const item = document.createElement('div')
        item.className = 'recent-item'
        
        const title = document.createElement('div')
        title.className = 'title'
        title.textContent = bookmark.title || 'Untitled'
        title.title = bookmark.title || 'Untitled'
        
        const meta = document.createElement('div')
        meta.className = 'meta'
        
        const status = document.createElement('span')
        status.className = `status status-${bookmark.read_status}`
        status.textContent = this.formatStatus(bookmark.read_status)
        
        const time = document.createElement('span')
        time.textContent = this.formatTime(new Date(bookmark.created_at).getTime())
        
        meta.appendChild(status)
        meta.appendChild(time)
        
        if (bookmark.tags && bookmark.tags.length > 0) {
          const tags = document.createElement('span')
          tags.textContent = ` • ${bookmark.tags.join(', ')}`
          meta.appendChild(tags)
        }
        
        item.appendChild(title)
        item.appendChild(meta)
        this.recentList.appendChild(item)
      })
      
    } catch (error) {
      console.error('Error loading recent entries:', error)
      this.recentList.innerHTML = '<div class="recent-item">Error loading entries</div>'
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
      console.error('Error loading custom status types:', error)
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
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.success-message, .error-message')
    existingMessages.forEach(msg => msg.remove())
    
    const messageDiv = document.createElement('div')
    messageDiv.className = `${type}-message`
    messageDiv.textContent = message
    
    // Insert after header
    const header = document.querySelector('header')
    if (header) {
      header.parentNode.insertBefore(messageDiv, header.nextSibling)
    } else {
      // If no header, append to body
      document.body.appendChild(messageDiv)
    }
    
    // Remove message after 3 seconds
    setTimeout(() => {
      messageDiv.remove()
    }, 3000)
  }

  openSettings() {
    chrome.runtime.openOptionsPage()
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ForgetfulMePopup()
}) 