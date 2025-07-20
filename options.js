// Options page script for ForgetfulMe extension with Supabase integration
class ForgetfulMeOptions {
  constructor() {
    this.configManager = new ConfigManager()
    this.authStateManager = new AuthStateManager()
    this.supabaseConfig = new SupabaseConfig()
    this.supabaseService = new SupabaseService(this.supabaseConfig)
    this.authUI = new AuthUI(this.supabaseConfig, () => this.onAuthSuccess(), this.authStateManager)
    this.configUI = new ConfigUI(this.supabaseConfig)
    
    // Initialize after DOM is ready
    this.initializeAsync()
  }

  async initializeAsync() {
    try {
      // Wait for DOM to be ready
      await UIComponents.DOM.ready()
      
      this.initializeElements()
      await this.initializeApp()
      this.initializeAuthState()
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.initializeAsync')
      console.error('Failed to initialize options:', errorResult)
    }
  }

  async initializeAuthState() {
    try {
      await this.authStateManager.initialize()
      
      // Listen for auth state changes
      this.authStateManager.addListener('authStateChanged', (session) => {
        this.handleAuthStateChange(session)
      })
      
      // Listen for runtime messages from background
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'AUTH_STATE_CHANGED') {
          this.handleAuthStateChange(message.session)
        }
      })
      
      console.log('Options: Auth state initialized')
    } catch (error) {
      console.error('Options: Error initializing auth state:', error)
    }
  }

  handleAuthStateChange(session) {
    console.log('Options: Auth state changed:', session ? 'authenticated' : 'not authenticated')
    
    // Update UI based on auth state
    if (session) {
      // User is authenticated - show main interface
      this.showMainInterface()
      this.loadData()
    } else {
      // User is not authenticated - show auth interface
      this.showAuthInterface()
    }
  }

  initializeElements() {
    // Initialize elements that exist in the initial HTML
    this.appContainer = UIComponents.DOM.getElement('app')
    
    // Re-initialize dynamically created elements with safe access
    this.statusTypesList = UIComponents.DOM.getElement('status-types-list')
    this.newStatusInput = UIComponents.DOM.getElement('new-status')
    this.addStatusBtn = UIComponents.DOM.getElement('add-status-btn')
    this.exportDataBtn = UIComponents.DOM.getElement('export-data-btn')
    this.importDataBtn = UIComponents.DOM.getElement('import-data-btn')
    this.importFile = UIComponents.DOM.getElement('import-file')
    this.clearDataBtn = UIComponents.DOM.getElement('clear-data-btn')
    this.viewAllBtn = UIComponents.DOM.getElement('view-all-btn')
    this.recentEntriesList = UIComponents.DOM.getElement('recent-entries-list')
    
    // Stats elements
    this.totalEntries = UIComponents.DOM.getElement('total-entries')
    this.statusTypesCount = UIComponents.DOM.getElement('status-types-count')
    this.mostUsedStatus = UIComponents.DOM.getElement('most-used-status')
  }

  bindEvents() {
    // Only bind events if elements exist using safe DOM utilities
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
      
      // Check if user is authenticated using auth state manager
      const isAuthenticated = await this.authStateManager.isAuthenticated()
      
      if (isAuthenticated) {
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
    // Update auth state in the manager
    this.authStateManager.setAuthState(this.supabaseConfig.session)
    
    this.showMainInterface()
    this.loadData()
  }

  showMainInterface() {
    // Create main container
    const mainContainer = UIComponents.createContainer('ForgetfulMe Settings', '', 'main-container')
    
    // Create config section
    const configSection = UIComponents.createSection('Supabase Configuration', 'config-section')
    const configStatusContainer = document.createElement('div')
    configStatusContainer.id = 'config-status-container'
    configSection.appendChild(configStatusContainer)
    mainContainer.appendChild(configSection)
    
    // Create stats section
    const statsSection = UIComponents.createSection('Statistics', 'stats-section')
    const statsGrid = UIComponents.createGrid([
      { text: 'Total Entries:', className: 'stat-item' },
      { text: 'Status Types:', className: 'stat-item' },
      { text: 'Most Used Status:', className: 'stat-item' }
    ], { className: 'stats-grid' })
    
    // Add stat values
    const statItems = statsGrid.querySelectorAll('.grid-item')
    statItems[0].innerHTML = '<span class="stat-label">Total Entries:</span><span id="total-entries" class="stat-value">-</span>'
    statItems[1].innerHTML = '<span class="stat-label">Status Types:</span><span id="status-types-count" class="stat-value">-</span>'
    statItems[2].innerHTML = '<span class="stat-label">Most Used Status:</span><span id="most-used-status" class="stat-value">-</span>'
    
    statsSection.appendChild(statsGrid)
    mainContainer.appendChild(statsSection)
    
    // Create status types section
    const statusSection = UIComponents.createSection('Custom Status Types', 'status-types-section')
    
    const addStatusContainer = document.createElement('div')
    addStatusContainer.className = 'add-status'
    
    const statusInput = UIComponents.createFormField('text', 'new-status', '', {
      placeholder: 'Enter new status type'
    })
    const addStatusBtn = UIComponents.createButton('Add', () => this.addStatusType(), 'ui-btn-primary', {
      id: 'add-status-btn'
    })
    
    addStatusContainer.appendChild(statusInput)
    addStatusContainer.appendChild(addStatusBtn)
    statusSection.appendChild(addStatusContainer)
    
    const statusTypesList = UIComponents.createList('status-types-list')
    statusSection.appendChild(statusTypesList)
    mainContainer.appendChild(statusSection)
    
    // Create data management section
    const dataSection = UIComponents.createSection('Data Management', 'data-section')
    const dataActions = document.createElement('div')
    dataActions.className = 'data-actions'
    
    const exportBtn = UIComponents.createButton('Export Data', () => this.exportData(), 'ui-btn-secondary', {
      id: 'export-data-btn'
    })
    const importBtn = UIComponents.createButton('Import Data', () => this.importFile.click(), 'ui-btn-secondary', {
      id: 'import-data-btn'
    })
    const clearBtn = UIComponents.createButton('Clear All Data', () => this.clearData(), 'ui-btn-danger', {
      id: 'clear-data-btn'
    })
    
    dataActions.appendChild(exportBtn)
    dataActions.appendChild(importBtn)
    dataActions.appendChild(clearBtn)
    
    // Hidden file input
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.id = 'import-file'
    fileInput.accept = '.json'
    fileInput.style.display = 'none'
    dataActions.appendChild(fileInput)
    
    dataSection.appendChild(dataActions)
    mainContainer.appendChild(dataSection)
    
    // Create recent entries section
    const recentSection = UIComponents.createSection('Recent Entries', 'recent-section')
    const viewAllBtn = UIComponents.createButton('View All Entries', () => this.viewAllEntries(), 'ui-btn-secondary', {
      id: 'view-all-btn'
    })
    const recentEntriesList = UIComponents.createList('recent-entries-list')
    
    recentSection.appendChild(viewAllBtn)
    recentSection.appendChild(recentEntriesList)
    mainContainer.appendChild(recentSection)
    
    // Assemble the interface
    this.appContainer.innerHTML = ''
    this.appContainer.appendChild(mainContainer)
    
    // Re-initialize elements after DOM update
    this.initializeElements()
    this.bindEvents()
    
    // Show configuration status
    if (configStatusContainer) {
      this.configUI.showConfigStatus(configStatusContainer)
    }
  }

  async loadData() {
    try {
      await this.configManager.initialize()
      const [bookmarks, customStatusTypes] = await Promise.all([
        this.supabaseService.getBookmarks({ limit: 1000 }),
        this.configManager.getCustomStatusTypes()
      ])
      
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
      const emptyItem = UIComponents.createListItem({
        title: 'No custom status types defined',
        meta: {
          status: 'info',
          statusText: 'No status types'
        }
      }, { className: 'status-type-item empty' })
      this.statusTypesList.appendChild(emptyItem)
      return
    }
    
    statusTypes.forEach(status => {
      const listItem = UIComponents.createListItem({
        title: this.formatStatus(status),
        actions: [
          {
            text: 'Remove',
            onClick: () => this.removeStatusType(status),
            className: 'ui-btn-danger ui-btn-small'
          }
        ]
      }, { className: 'status-type-item' })
      
      this.statusTypesList.appendChild(listItem)
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
      await this.configManager.initialize()
      await this.configManager.addCustomStatusType(status)
      
      this.newStatusInput.value = ''
      const customStatusTypes = await this.configManager.getCustomStatusTypes()
      this.loadStatusTypes(customStatusTypes)
      UIMessages.success('Status type added successfully', this.appContainer)
      
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.addStatusType')
      UIMessages.error(errorResult.userMessage, this.appContainer)
    }
  }

  async removeStatusType(status) {
    try {
      await this.configManager.initialize()
      await this.configManager.removeCustomStatusType(status)
      
      const customStatusTypes = await this.configManager.getCustomStatusTypes()
      this.loadStatusTypes(customStatusTypes)
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
      const emptyItem = UIComponents.createListItem({
        title: 'No entries yet',
        meta: {
          status: 'info',
          statusText: 'No entries'
        }
      }, { className: 'recent-item empty' })
      this.recentEntriesList.appendChild(emptyItem)
      return
    }
    
    const recentBookmarks = bookmarks.slice(0, 10)
    
    recentBookmarks.forEach(bookmark => {
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
      
      this.recentEntriesList.appendChild(listItem)
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

// Initialize options page immediately (DOM ready is handled in constructor)
new ForgetfulMeOptions() 