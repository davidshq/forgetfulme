// Template for Supabase configuration
// Copy this file to supabase-config.local.js and fill in your credentials
// This file should NOT be committed to version control

class SupabaseConfigTemplate {
  constructor() {
    // Replace these with your actual Supabase project credentials
    this.supabaseUrl = 'https://your-project.supabase.co'
    this.supabaseAnonKey = 'your-anon-public-key-here'
    
    this.supabase = null
    this.auth = null
    this.user = null
    this.session = null
  }

  async initialize() {
    try {
      // Check if Supabase client is available
      if (typeof window.supabase === 'undefined') {
        throw new Error('Supabase client not loaded. Please include the Supabase library.')
      }

      // Use the globally available Supabase client
      this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseAnonKey)
      this.auth = this.supabase.auth
      
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

  isConfigured() {
    return this.supabaseUrl !== null && this.supabaseAnonKey !== null
  }
}

// Export for use in other files
window.SupabaseConfig = SupabaseConfigTemplate 