// Supabase configuration for ForgetfulMe extension
class SupabaseConfig {
  constructor() {
    this.supabaseUrl = null
    this.supabaseAnonKey = null
    
    this.supabase = null
    this.auth = null
    this.user = null
    this.session = null
    
    // Don't load configuration immediately - wait until needed
    this.configLoaded = false
  }

  async loadConfiguration() {
    if (this.configLoaded) {
      return
    }

    try {
      // Try to load from chrome.storage first (for user-provided config)
      const result = await chrome.storage.sync.get(['supabaseConfig'])
      if (result.supabaseConfig) {
        this.supabaseUrl = result.supabaseConfig.url
        this.supabaseAnonKey = result.supabaseConfig.anonKey
        this.configLoaded = true
        return
      }

      // Fallback to environment variables (for development)
      // Note: These won't work in extension context, but useful for development
      if (typeof process !== 'undefined' && process.env) {
        this.supabaseUrl = process.env.SUPABASE_URL
        this.supabaseAnonKey = process.env.SUPABASE_ANON_KEY
        this.configLoaded = true
        return
      }

      // If no configuration found, don't show error - just mark as not configured
      this.configLoaded = true
      
    } catch (error) {
      console.error('Error loading Supabase configuration:', error)
      this.configLoaded = true
    }
  }

  showSetupInstructions() {
    console.log(`
      ⚠️  Supabase configuration not found!
      
      Please configure your Supabase credentials:
      
      1. Create a Supabase project at https://supabase.com
      2. Get your Project URL and anon public key
      3. Open the extension options page
      4. Go to Settings > Supabase Configuration
      5. Enter your Project URL and anon public key
      
      Or set environment variables:
      - SUPABASE_URL
      - SUPABASE_ANON_KEY
    `)
  }

  async setConfiguration(url, anonKey) {
    try {
      // Validate the configuration
      if (!url || !anonKey) {
        throw new Error('Both URL and anon key are required')
      }

      if (!url.startsWith('https://')) {
        throw new Error('URL must start with https://')
      }

      if (!anonKey.startsWith('eyJ')) {
        throw new Error('Invalid anon key format')
      }

      // Save to chrome.storage
      await chrome.storage.sync.set({
        supabaseConfig: {
          url: url,
          anonKey: anonKey
        }
      })

      // Update local configuration
      this.supabaseUrl = url
      this.supabaseAnonKey = anonKey
      this.configLoaded = true

      return { success: true, message: 'Configuration saved successfully' }
      
    } catch (error) {
      console.error('Error setting configuration:', error)
      return { success: false, message: error.message }
    }
  }

  async getConfiguration() {
    await this.loadConfiguration()
    const result = await chrome.storage.sync.get(['supabaseConfig'])
    return result.supabaseConfig || null
  }

  async initialize() {
    try {
      // Load configuration if not already loaded
      await this.loadConfiguration()

      if (!this.supabaseUrl || !this.supabaseAnonKey) {
        return false // Not configured, but not an error
      }

      // Check if Supabase client is available
      if (typeof supabase === 'undefined') {
        console.error('Supabase client not loaded. Please include the Supabase library.')
        return false
      }

      // Use the globally available Supabase client
      console.log('Creating Supabase client with URL:', this.supabaseUrl)
      this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseAnonKey)
      this.auth = this.supabase.auth
      
      // Verify the client was created properly
      if (!this.supabase || typeof this.supabase.from !== 'function') {
        console.error('Supabase client not properly initialized')
        return false
      }
      
      // Check for existing session
      const { data: { session } } = await this.auth.getSession()
      if (session) {
        this.session = session
        this.user = session.user
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error initializing Supabase:', error)
      return false
    }
  }

  async signIn(email, password) {
    try {
      if (!this.auth) {
        throw new Error('Supabase not initialized')
      }

      const { data, error } = await this.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      this.session = data.session
      this.user = data.user
      return data
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  async signUp(email, password) {
    try {
      if (!this.auth) {
        throw new Error('Supabase not initialized')
      }

      const { data, error } = await this.auth.signUp({
        email,
        password
      })
      
      if (error) throw error
      
      return data
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  async signOut() {
    try {
      if (!this.auth) {
        return
      }

      await this.auth.signOut()
      this.session = null
      this.user = null
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  isAuthenticated() {
    return this.user !== null && this.session !== null
  }

  getCurrentUser() {
    return this.user
  }

  getSupabaseClient() {
    return this.supabase
  }

  async isConfigured() {
    await this.loadConfiguration()
    return this.supabaseUrl !== null && this.supabaseAnonKey !== null
  }
}

// Export for use in other files
window.SupabaseConfig = SupabaseConfig 