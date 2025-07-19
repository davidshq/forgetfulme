// Migration script for ForgetfulMe extension
class MigrationManager {
  constructor(supabaseService) {
    this.supabaseService = supabaseService
  }

  async migrateFromChromeSync() {
    try {
      // Get existing data from Chrome sync
      const result = await chrome.storage.sync.get(['entries', 'customStatusTypes'])
      const entries = result.entries || []
      const customStatusTypes = result.customStatusTypes || []
      
      if (entries.length === 0) {
        console.log('No data to migrate')
        return { success: true, message: 'No data to migrate' }
      }

      // Transform data for Supabase
      const transformedBookmarks = entries.map(entry => ({
        url: entry.url,
        title: entry.title,
        description: entry.description || '',
        read_status: entry.status,
        tags: entry.tags || [],
        created_at: entry.timestamp ? new Date(entry.timestamp).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        access_count: 1
      }))

      // Save bookmarks to Supabase
      for (const bookmark of transformedBookmarks) {
        await this.supabaseService.saveBookmark(bookmark)
      }

      // Save custom status types as user preferences
      if (customStatusTypes.length > 0) {
        await this.supabaseService.saveUserPreferences({
          customStatusTypes: customStatusTypes
        })
      }

      // Clear Chrome sync data after successful migration
      await chrome.storage.sync.remove(['entries', 'customStatusTypes'])
      
      return {
        success: true,
        message: `Successfully migrated ${transformedBookmarks.length} bookmarks and ${customStatusTypes.length} custom status types`,
        migratedBookmarks: transformedBookmarks.length,
        migratedStatusTypes: customStatusTypes.length
      }
      
    } catch (error) {
      console.error('Migration failed:', error)
      return {
        success: false,
        message: `Migration failed: ${error.message}`,
        error: error
      }
    }
  }

  async checkForExistingData() {
    try {
      const result = await chrome.storage.sync.get(['entries', 'customStatusTypes'])
      const entries = result.entries || []
      const customStatusTypes = result.customStatusTypes || []
      
      return {
        hasData: entries.length > 0 || customStatusTypes.length > 0,
        entryCount: entries.length,
        statusTypeCount: customStatusTypes.length
      }
    } catch (error) {
      console.error('Error checking for existing data:', error)
      return { hasData: false, entryCount: 0, statusTypeCount: 0 }
    }
  }

  async showMigrationPrompt() {
    const dataCheck = await this.checkForExistingData()
    
    if (!dataCheck.hasData) {
      return { shouldMigrate: false, message: 'No existing data found' }
    }

    const message = `Found ${dataCheck.entryCount} bookmarks and ${dataCheck.statusTypeCount} custom status types in Chrome Sync. Would you like to migrate this data to your Supabase account?`
    
    return {
      shouldMigrate: true,
      message: message,
      dataCheck: dataCheck
    }
  }
}

// Export for use in other files
window.MigrationManager = MigrationManager 