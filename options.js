// Options page script for ForgetfulMe extension with Supabase integration
class ForgetfulMeOptions {
  constructor() {
    this.supabaseConfig = new SupabaseConfig()
    this.supabaseService = new SupabaseService(this.supabaseConfig)
    this.authUI = new AuthUI(this.supabaseConfig, () => this.onAuthSuccess())
    this.configUI = new ConfigUI(this.supabaseConfig)
    
    this.initializeElements()
    this.initializeApp()
  }

  initializeElements() {
    // Initialize elements that exist in the initial HTML
    this.appContainer = document.getElementById('app')
    
    // These elements will be created dynamically, so we'll initialize them later
    this.statusTypesList = null
    this.newStatusInput = null
    this.addStatusBtn = null
    this.exportDataBtn = null
    this.importDataBtn = null
    this.importFile = null
    this.clearDataBtn = null
    this.viewAllBtn = null
    this.recentEntriesList = null
    
    // Stats elements
    this.totalEntries = null
    this.statusTypesCount = null
    this.mostUsedStatus = null
  }

  bindEvents() {
    // Only bind events if elements exist
    if (this.addStatusBtn) {
      this.addStatusBtn.addEventListener('click', () => this.addStatusType())
    }
    
    if (this.newStatusInput) {
      this.newStatusInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addStatusType()
        }
      })
    }
    
    if (this.exportDataBtn) {
      this.exportDataBtn.addEventListener('click', () => this.exportData())
    }
    
    if (this.importDataBtn) {
      this.importDataBtn.addEventListener('click', () => this.importFile.click())
    }
    
    if (this.importFile) {
      this.importFile.addEventListener('change', (e) => this.importData(e))
    }
    
    if (this.clearDataBtn) {
      this.clearDataBtn.addEventListener('click', () => this.clearData())
    }
    
    if (this.viewAllBtn) {
      this.viewAllBtn.addEventListener('click', () => this.viewAllEntries())
    }
  }

  async initializeApp() {
    try {
      // Check if Supabase is configured
      if (!(await this.supabaseConfig.isConfigured())) {
        this.showConfigInterface()
        return
      }

      // Initialize Supabase
      await this.supabaseService.initialize()
      
      // Check if user is authenticated
      if (this.supabaseConfig.isAuthenticated()) {
        this.showMainInterface()
        this.loadData()
      } else {
        this.showAuthInterface()
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.initializeApp')
      if (errorResult.shouldShowToUser) {
        UIMessages.error(errorResult.userMessage, this.appContainer)
      }
      this.showConfigInterface()
    }
  }

  showConfigInterface() {
    this.configUI.showConfigForm(this.appContainer)
  }

  showAuthInterface() {
    this.authUI.showLoginForm(this.appContainer)
  }

  onAuthSuccess() {
    this.showMainInterface()
    this.loadData()
  }

  showMainInterface() {
    // Show the main options interface
    this.appContainer.innerHTML = `
      <div class="container">
        <header>
          <h1>ForgetfulMe Settings</h1>
        </header>

        <div class="config-section">
          <h2>Supabase Configuration</h2>
          <div id="config-status-container"></div>
        </div>

        <div class="stats-section">
          <h2>Statistics</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Total Entries:</span>
              <span id="total-entries" class="stat-value">-</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Status Types:</span>
              <span id="status-types-count" class="stat-value">-</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Most Used Status:</span>
              <span id="most-used-status" class="stat-value">-</span>
            </div>
          </div>
        </div>

        <div class="status-types-section">
          <h2>Custom Status Types</h2>
          <div class="add-status">
            <input type="text" id="new-status" placeholder="Enter new status type">
            <button id="add-status-btn">Add</button>
          </div>
          <div id="status-types-list"></div>
        </div>

        <div class="data-section">
          <h2>Data Management</h2>
          <div class="data-actions">
            <button id="export-data-btn">Export Data</button>
            <button id="import-data-btn">Import Data</button>
            <input type="file" id="import-file" accept=".json" style="display: none;">
            <button id="clear-data-btn" class="danger">Clear All Data</button>
          </div>
        </div>

        <div class="recent-section">
          <h2>Recent Entries</h2>
          <button id="view-all-btn">View All Entries</button>
          <div id="recent-entries-list"></div>
        </div>
      </div>
    `
    
    // Re-initialize elements after DOM update
    this.initializeElements()
    this.bindEvents()
    
    // Show configuration status
    const configContainer = document.getElementById('config-status-container')
    if (configContainer) {
      this.configUI.showConfigStatus(configContainer)
    }
  }

  async loadData() {
    try {
      const [bookmarks, preferences] = await Promise.all([
        this.supabaseService.getBookmarks({ limit: 1000 }),
        this.supabaseService.getUserPreferences()
      ])
      
      const customStatusTypes = preferences.customStatusTypes || []
      
      this.loadStatusTypes(customStatusTypes)
      this.loadStatistics(bookmarks, customStatusTypes)
      this.loadRecentEntries(bookmarks)
      
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.loadData')
      UIMessages.error(errorResult.userMessage, this.appContainer)
    }
  }

  loadStatusTypes(statusTypes) {
    if (!this.statusTypesList) return
    
    this.statusTypesList.innerHTML = ''
    
    if (statusTypes.length === 0) {
      this.statusTypesList.innerHTML = '<p style="color: #6c757d; font-style: italic;">No custom status types defined</p>'
      return
    }
    
    statusTypes.forEach(status => {
      const item = document.createElement('div')
      item.className = 'status-type-item'
      
      const name = document.createElement('span')
      name.className = 'status-name'
      name.textContent = this.formatStatus(status)
      
      const removeBtn = document.createElement('button')
      removeBtn.className = 'remove-btn'
      removeBtn.textContent = 'Remove'
      removeBtn.addEventListener('click', () => this.removeStatusType(status))
      
      item.appendChild(name)
      item.appendChild(removeBtn)
      this.statusTypesList.appendChild(item)
    })
  }

  async addStatusType() {
    if (!this.newStatusInput) return
    
    const status = this.newStatusInput.value.trim().toLowerCase().replace(/\s+/g, '-')
    
    if (!status) {
      UIMessages.error('Please enter a status type', this.appContainer)
      return
    }

    try {
      const preferences = await this.supabaseService.getUserPreferences()
      const customStatusTypes = preferences.customStatusTypes || []
      
      if (customStatusTypes.includes(status)) {
        UIMessages.error('Status type already exists', this.appContainer)
        return
      }

      customStatusTypes.push(status)
      await this.supabaseService.saveUserPreferences({ customStatusTypes })
      
      this.newStatusInput.value = ''
      this.loadStatusTypes(customStatusTypes)
      UIMessages.success('Status type added successfully', this.appContainer)
      
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.addStatusType')
      UIMessages.error(errorResult.userMessage, this.appContainer)
    }
  }

  async removeStatusType(status) {
    try {
      const preferences = await this.supabaseService.getUserPreferences()
      const customStatusTypes = preferences.customStatusTypes || []
      
      const updatedTypes = customStatusTypes.filter(type => type !== status)
      await this.supabaseService.saveUserPreferences({ customStatusTypes: updatedTypes })
      
      this.loadStatusTypes(updatedTypes)
      UIMessages.success('Status type removed successfully', this.appContainer)
      
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.removeStatusType')
      UIMessages.error(errorResult.userMessage, this.appContainer)
    }
  }

  loadStatistics(bookmarks, statusTypes) {
    if (!this.totalEntries || !this.statusTypesCount || !this.mostUsedStatus) return
    
    // Total entries
    this.totalEntries.textContent = bookmarks.length
    
    // Status types count
    this.statusTypesCount.textContent = statusTypes.length
    
    // Most used status
    const statusCounts = {}
    bookmarks.forEach(bookmark => {
      statusCounts[bookmark.read_status] = (statusCounts[bookmark.read_status] || 0) + 1
    })
    
    const mostUsed = Object.entries(statusCounts)
      .sort(([,a], [,b]) => b - a)[0]
    
    if (mostUsed) {
      this.mostUsedStatus.textContent = this.formatStatus(mostUsed[0])
    } else {
      this.mostUsedStatus.textContent = 'None'
    }
  }

  loadRecentEntries(bookmarks) {
    if (!this.recentEntriesList) return
    
    this.recentEntriesList.innerHTML = ''
    
    if (bookmarks.length === 0) {
      this.recentEntriesList.innerHTML = '<p style="color: #6c757d; font-style: italic;">No entries yet</p>'
      return
    }
    
    const recentBookmarks = bookmarks.slice(0, 10)
    
    recentBookmarks.forEach(bookmark => {
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
      this.recentEntriesList.appendChild(item)
    })
  }

  async exportData() {
    try {
      const exportData = await this.supabaseService.exportData()
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `forgetfulme-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      UIMessages.success('Data exported successfully', this.appContainer)
      
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.exportData')
      UIMessages.error(errorResult.userMessage, this.appContainer)
    }
  }

  async importData(event) {
    const file = event.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const importData = JSON.parse(text)
      
      await this.supabaseService.importData(importData)
      
      UIMessages.success('Data imported successfully', this.appContainer)
      this.loadData() // Refresh the data
      
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.importData')
      UIMessages.error(errorResult.userMessage, this.appContainer)
    }
    
    // Clear the file input
    event.target.value = ''
  }

  async clearData() {
    UIMessages.confirm(
      'Are you sure you want to clear all data? This action cannot be undone.',
      async () => {
        try {
          const bookmarks = await this.supabaseService.getBookmarks({ limit: 10000 })
          
          for (const bookmark of bookmarks) {
            await this.supabaseService.deleteBookmark(bookmark.id)
          }
          
          UIMessages.success('All data cleared successfully', this.appContainer)
          this.loadData() // Refresh the data
          
        } catch (error) {
          const errorResult = ErrorHandler.handle(error, 'options.clearData')
          UIMessages.error(errorResult.userMessage, this.appContainer)
        }
      },
      () => {
        // User cancelled
      },
      this.appContainer
    )
  }

  viewAllEntries() {
    // Open a new tab with all entries
    chrome.tabs.create({ url: 'options.html?view=all' })
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
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ForgetfulMeOptions()
}) 