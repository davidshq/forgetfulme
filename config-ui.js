// Configuration UI component for ForgetfulMe extension
class ConfigUI {
  constructor(supabaseConfig) {
    this.config = supabaseConfig
  }

  showConfigForm(container) {
    const configHTML = `
      <div class="config-container">
        <div class="config-header">
          <h2>Supabase Configuration</h2>
          <p>Enter your Supabase project credentials to enable cloud sync</p>
        </div>
        
        <form id="configForm" class="config-form">
          <div class="form-group">
            <label for="supabaseUrl">Project URL</label>
            <input type="url" id="supabaseUrl" placeholder="https://your-project.supabase.co" required>
            <small>Your Supabase project URL (found in Settings > API)</small>
          </div>
          
          <div class="form-group">
            <label for="supabaseAnonKey">Anon Public Key</label>
            <input type="text" id="supabaseAnonKey" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." required>
            <small>Your anon public key (found in Settings > API)</small>
          </div>
          
          <button type="submit" class="config-btn primary">Save Configuration</button>
        </form>
        
        <div class="config-help">
          <h3>How to get your credentials:</h3>
          <ol>
            <li>Go to <a href="https://supabase.com" target="_blank">supabase.com</a> and create an account</li>
            <li>Create a new project</li>
            <li>Go to Settings > API in your project dashboard</li>
            <li>Copy the "Project URL" and "anon public" key</li>
            <li>Paste them in the form above</li>
          </ol>
          
          <div class="config-note">
            <strong>Note:</strong> Your credentials are stored securely in your browser's sync storage and are never shared with anyone.
          </div>
        </div>
        
        <div id="configMessage" class="config-message"></div>
      </div>
    `
    
    container.innerHTML = configHTML
    this.bindConfigEvents(container)
    this.loadCurrentConfig(container)
  }

  bindConfigEvents(container) {
    const configForm = container.querySelector('#configForm')
    
    if (configForm) {
      configForm.addEventListener('submit', (e) => {
        e.preventDefault()
        this.handleConfigSubmit(container)
      })
    }
  }

  async loadCurrentConfig(container) {
    try {
      const currentConfig = await this.config.getConfiguration()
      
      if (currentConfig) {
        const urlInput = container.querySelector('#supabaseUrl')
        const keyInput = container.querySelector('#supabaseAnonKey')
        
        if (urlInput) urlInput.value = currentConfig.url || ''
        if (keyInput) keyInput.value = currentConfig.anonKey || ''
        
        this.showConfigMessage(container, 'Current configuration loaded', 'info')
      }
    } catch (error) {
      console.error('Error loading current config:', error)
    }
  }

  async handleConfigSubmit(container) {
    const urlInput = container.querySelector('#supabaseUrl')
    const keyInput = container.querySelector('#supabaseAnonKey')
    
    const url = urlInput.value.trim()
    const anonKey = keyInput.value.trim()
    
    if (!url || !anonKey) {
      this.showConfigMessage(container, 'Please fill in all fields', 'error')
      return
    }
    
    try {
      this.showConfigMessage(container, 'Saving configuration...', 'info')
      
      const result = await this.config.setConfiguration(url, anonKey)
      
      if (result.success) {
        this.showConfigMessage(container, 'Configuration saved successfully!', 'success')
        
        // Test the configuration
        setTimeout(async () => {
          try {
            await this.config.initialize()
            this.showConfigMessage(container, 'Configuration test successful! You can now use the extension.', 'success')
          } catch (error) {
            this.showConfigMessage(container, 'Configuration saved but test failed. Please check your credentials.', 'error')
          }
        }, 1000)
        
      } else {
        this.showConfigMessage(container, `Error: ${result.message}`, 'error')
      }
      
    } catch (error) {
      console.error('Error saving configuration:', error)
      this.showConfigMessage(container, 'Error saving configuration', 'error')
    }
  }

  showConfigMessage(container, message, type) {
    const messageEl = container.querySelector('#configMessage')
    if (messageEl) {
      messageEl.textContent = message
      messageEl.className = `config-message ${type}`
      
      // Clear message after 5 seconds
      setTimeout(() => {
        messageEl.textContent = ''
        messageEl.className = 'config-message'
      }, 5000)
    }
  }

  showConfigStatus(container) {
    const statusHTML = `
      <div class="config-status">
        <h3>Configuration Status</h3>
        <div class="status-item">
          <span class="status-label">Supabase URL:</span>
          <span class="status-value" id="statusUrl">-</span>
        </div>
        <div class="status-item">
          <span class="status-label">Anon Key:</span>
          <span class="status-value" id="statusKey">-</span>
        </div>
        <div class="status-item">
          <span class="status-label">Connection:</span>
          <span class="status-value" id="statusConnection">-</span>
        </div>
        
        <button id="testConnectionBtn" class="config-btn secondary">Test Connection</button>
        <button id="editConfigBtn" class="config-btn secondary">Edit Configuration</button>
      </div>
    `
    
    container.innerHTML = statusHTML
    this.loadConfigStatus(container)
    this.bindStatusEvents(container)
  }

  async loadConfigStatus(container) {
    try {
      const config = await this.config.getConfiguration()
      
      if (config) {
        const urlEl = container.querySelector('#statusUrl')
        const keyEl = container.querySelector('#statusKey')
        
        if (urlEl) urlEl.textContent = config.url || 'Not set'
        if (keyEl) keyEl.textContent = config.anonKey ? `${config.anonKey.substring(0, 20)}...` : 'Not set'
        
        // Test connection
        await this.testConnection(container)
      } else {
        const urlEl = container.querySelector('#statusUrl')
        const keyEl = container.querySelector('#statusKey')
        const connectionEl = container.querySelector('#statusConnection')
        
        if (urlEl) urlEl.textContent = 'Not configured'
        if (keyEl) keyEl.textContent = 'Not configured'
        if (connectionEl) connectionEl.textContent = 'Not configured'
      }
    } catch (error) {
      console.error('Error loading config status:', error)
    }
  }

  async testConnection(container) {
    const connectionEl = container.querySelector('#statusConnection')
    
    try {
      await this.config.initialize()
      if (connectionEl) {
        connectionEl.textContent = 'Connected'
        connectionEl.className = 'status-value connected'
      }
    } catch (error) {
      if (connectionEl) {
        connectionEl.textContent = 'Failed'
        connectionEl.className = 'status-value failed'
      }
    }
  }

  bindStatusEvents(container) {
    const testBtn = container.querySelector('#testConnectionBtn')
    const editBtn = container.querySelector('#editConfigBtn')
    
    if (testBtn) {
      testBtn.addEventListener('click', async () => {
        await this.testConnection(container)
      })
    }
    
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        this.showConfigForm(container)
      })
    }
  }
}

// Export for use in other files
window.ConfigUI = ConfigUI 