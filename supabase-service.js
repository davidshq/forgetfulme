// Supabase service layer for ForgetfulMe extension
class SupabaseService {
  constructor(supabaseConfig) {
    this.config = supabaseConfig
    this.supabase = null
    this.realtimeManager = null
  }

  async initialize() {
    console.log('Initializing SupabaseService...')
    await this.config.initialize()
    this.supabase = this.config.getSupabaseClient()
    console.log('Got Supabase client:', this.supabase)
    console.log('Client has from method:', typeof this.supabase?.from)
    this.realtimeManager = new RealtimeManager(this.supabase)
  }

  // Bookmark operations
  async saveBookmark(bookmark) {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError('User not authenticated', ErrorHandler.ERROR_TYPES.AUTH, 'supabase-service.saveBookmark')
    }

    // Validate bookmark data before transformation
    const validation = BookmarkTransformer.validate(bookmark)
    if (!validation.isValid) {
      throw ErrorHandler.createError(
        `Invalid bookmark data: ${validation.errors.join(', ')}`, 
        ErrorHandler.ERROR_TYPES.VALIDATION, 
        'supabase-service.saveBookmark'
      )
    }

    const userId = this.config.getCurrentUser().id
    
    const bookmarkData = BookmarkTransformer.toSupabaseFormat(bookmark, userId)

    try {
      const { data, error } = await this.supabase
        .from('bookmarks')
        .insert(bookmarkData)

      if (error) throw error
      return data[0]
    } catch (error) {
      ErrorHandler.handle(error, 'supabase-service.saveBookmark')
      throw error
    }
  }

  async getBookmarks(options = {}) {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError('User not authenticated', ErrorHandler.ERROR_TYPES.AUTH, 'supabase-service.getBookmarks')
    }

    const userId = this.config.getCurrentUser().id
    
    const {
      page = 1,
      limit = 50,
      status = null,
      search = null,
      tags = null
    } = options

    try {
      console.log('Creating query with supabase client:', this.supabase)
      console.log('Client type:', typeof this.supabase)
      console.log('Client has from method:', typeof this.supabase?.from)
      
      let query = this.supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (status) {
        query = query.eq('read_status', status)
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      if (tags && tags.length > 0) {
        query = query.overlaps('tags', tags)
      }

      const { data, error } = await query
      if (error) throw error

      return data
    } catch (error) {
      ErrorHandler.handle(error, 'supabase-service.getBookmarks')
      throw error
    }
  }

  async updateBookmark(bookmarkId, updates) {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError('User not authenticated', ErrorHandler.ERROR_TYPES.AUTH, 'supabase-service.updateBookmark')
    }

    try {
      const { data, error } = await this.supabase
        .from('bookmarks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookmarkId)
        .eq('user_id', this.config.getCurrentUser().id)

      if (error) throw error
      return data[0]
    } catch (error) {
      ErrorHandler.handle(error, 'supabase-service.updateBookmark')
      throw error
    }
  }

  async deleteBookmark(bookmarkId) {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError('User not authenticated', ErrorHandler.ERROR_TYPES.AUTH, 'supabase-service.deleteBookmark')
    }

    try {
      const { error } = await this.supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', this.config.getCurrentUser().id)

      if (error) throw error
      return true
    } catch (error) {
      ErrorHandler.handle(error, 'supabase-service.deleteBookmark')
      throw error
    }
  }

  async getBookmarkStats() {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError('User not authenticated', ErrorHandler.ERROR_TYPES.AUTH, 'supabase-service.getBookmarkStats')
    }

    const userId = this.config.getCurrentUser().id

    try {
      const { data, error } = await this.supabase
        .from('bookmarks')
        .select('read_status')
        .eq('user_id', userId)

      if (error) throw error

      return data.reduce((stats, bookmark) => {
        stats[bookmark.read_status] = (stats[bookmark.read_status] || 0) + 1
        return stats
      }, {})
    } catch (error) {
      ErrorHandler.handle(error, 'supabase-service.getBookmarkStats')
      throw error
    }
  }

  // User preferences operations
  async saveUserPreferences(preferences) {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError('User not authenticated', ErrorHandler.ERROR_TYPES.AUTH, 'supabase-service.saveUserPreferences')
    }

    const userId = this.config.getCurrentUser().id

    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          preferences: preferences,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      return data[0]
    } catch (error) {
      ErrorHandler.handle(error, 'supabase-service.saveUserPreferences')
      throw error
    }
  }

  async getUserPreferences() {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError('User not authenticated', ErrorHandler.ERROR_TYPES.AUTH, 'supabase-service.getUserPreferences')
    }

    const userId = this.config.getCurrentUser().id

    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('preferences')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data?.preferences || {}
    } catch (error) {
      ErrorHandler.handle(error, 'supabase-service.getUserPreferences')
      throw error
    }
  }

  // Real-time subscriptions
  subscribeToBookmarks(callback) {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError('User not authenticated', ErrorHandler.ERROR_TYPES.AUTH, 'supabase-service.subscribeToBookmarks')
    }

    const userId = this.config.getCurrentUser().id
    return this.realtimeManager.subscribeToBookmarks(userId, callback)
  }

  unsubscribe(channelName) {
    this.realtimeManager.unsubscribe(channelName)
  }

  // Data export/import
  async exportData() {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError('User not authenticated', ErrorHandler.ERROR_TYPES.AUTH, 'supabase-service.exportData')
    }

    try {
      const bookmarks = await this.getBookmarks({ limit: 10000 }) // Get all bookmarks
      const preferences = await this.getUserPreferences()

      return {
        bookmarks: bookmarks,
        preferences: preferences,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      }
    } catch (error) {
      ErrorHandler.handle(error, 'supabase-service.exportData')
      throw error
    }
  }

  async importData(importData) {
    if (!this.config.isAuthenticated()) {
      throw ErrorHandler.createError('User not authenticated', ErrorHandler.ERROR_TYPES.AUTH, 'supabase-service.importData')
    }

    try {
      const userId = this.config.getCurrentUser().id

      if (importData.bookmarks && importData.bookmarks.length > 0) {
        const transformedBookmarks = BookmarkTransformer.transformMultiple(
          importData.bookmarks, 
          userId, 
          { preserveTimestamps: true, setDefaults: false }
        )

        const { error } = await this.supabase
          .from('bookmarks')
          .insert(transformedBookmarks)

        if (error) throw error
      }

      if (importData.preferences) {
        await this.saveUserPreferences(importData.preferences)
      }

      return true
    } catch (error) {
      ErrorHandler.handle(error, 'supabase-service.importData')
      throw error
    }
  }
}

// Real-time manager for handling subscriptions
class RealtimeManager {
  constructor(supabase) {
    this.supabase = supabase
    this.subscriptions = new Map()
  }

  subscribeToBookmarks(userId, callback) {
    const subscription = this.supabase
      .channel('bookmarks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()

    this.subscriptions.set('bookmarks', subscription)
    return subscription
  }

  unsubscribe(channelName) {
    const subscription = this.subscriptions.get(channelName)
    if (subscription) {
      this.supabase.removeChannel(subscription)
      this.subscriptions.delete(channelName)
    }
  }
}

// Export for use in other files
window.SupabaseService = SupabaseService 