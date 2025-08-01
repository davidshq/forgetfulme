/**
 * @fileoverview Database setup utility for ForgetfulMe
 * Creates necessary tables and configures the database
 */

import { createClient } from '../lib/supabase.js';
import { StorageService } from '../services/StorageService.js';

/**
 * Setup database schema
 */
export async function setupDatabase() {
  try {
    console.log('Starting database setup...');

    // Get config from storage
    const storageService = new StorageService();
    const config = await storageService.getConfig();

    if (!config) {
      throw new Error('Supabase configuration not found. Please configure the extension first.');
    }

    // Create official Supabase client
    const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

    // Try to restore session from storage
    const storedSession = await storageService.getUserSession();
    if (storedSession && storedSession.access_token) {
      await supabase.auth.setSession({
        access_token: storedSession.access_token,
        refresh_token: storedSession.refresh_token
      });
    }

    // Check if we have an authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be signed in to setup the database');
    }

    console.log('Authenticated as:', user.email);

    // Database schema for reference (from database/schema-simple.sql)
    // This must be run manually in Supabase SQL Editor before using the extension
    const _schema = `
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Create bookmarks table
      CREATE TABLE IF NOT EXISTS bookmarks (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          url TEXT NOT NULL,
          title TEXT,
          status TEXT NOT NULL DEFAULT 'unread',
          tags TEXT[] DEFAULT '{}',
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          UNIQUE(user_id, url)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_url ON bookmarks(url);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_status ON bookmarks(status);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_tags ON bookmarks USING GIN(tags);

      -- Create status_types table
      CREATE TABLE IF NOT EXISTS status_types (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          icon TEXT,
          description TEXT,
          is_default BOOLEAN DEFAULT FALSE,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
      );

      -- Insert default status types
      INSERT INTO status_types (id, name, color, icon, description, is_default, display_order) VALUES
          ('read', 'Read', '#22c55e', 'check', 'Completely read', FALSE, 1),
          ('unread', 'Unread', '#ef4444', 'circle', 'Not read yet', TRUE, 2),
          ('in-progress', 'In Progress', '#f59e0b', 'book-open', 'Currently reading', FALSE, 3),
          ('reference', 'Reference', '#3b82f6', 'bookmark', 'Saved for reference', FALSE, 4),
          ('archived', 'Archived', '#6b7280', 'archive', 'Archived for later', FALSE, 5)
      ON CONFLICT (id) DO NOTHING;

      -- Create user_preferences table
      CREATE TABLE IF NOT EXISTS user_preferences (
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          default_status TEXT DEFAULT 'unread',
          items_per_page INTEGER DEFAULT 25,
          sort_by TEXT DEFAULT 'created_at',
          sort_order TEXT DEFAULT 'desc',
          auto_sync BOOLEAN DEFAULT TRUE,
          sync_interval TEXT DEFAULT 'normal',
          show_notifications BOOLEAN DEFAULT TRUE,
          compact_view BOOLEAN DEFAULT FALSE,
          theme TEXT DEFAULT 'system',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
      );

      -- Enable RLS
      ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE status_types ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

      -- Create policies
      CREATE POLICY "Users can view their own bookmarks" ON bookmarks
          FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can insert their own bookmarks" ON bookmarks
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update their own bookmarks" ON bookmarks
          FOR UPDATE USING (auth.uid() = user_id);
      CREATE POLICY "Users can delete their own bookmarks" ON bookmarks
          FOR DELETE USING (auth.uid() = user_id);
      CREATE POLICY "Anyone can view status types" ON status_types
          FOR SELECT USING (true);
      CREATE POLICY "Users can view their own preferences" ON user_preferences
          FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can insert their own preferences" ON user_preferences
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update their own preferences" ON user_preferences
          FOR UPDATE USING (auth.uid() = user_id);

      -- Create updated_at trigger
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = TIMEZONE('utc', NOW());
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create triggers
      CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE ON bookmarks
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_status_types_updated_at BEFORE UPDATE ON status_types
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    console.log('Executing database schema...');

    // Note: Supabase JS client doesn't support raw SQL execution
    // We need to check if tables exist and create them using the REST API

    // Check if bookmarks table exists by trying to query it
    const { error: bookmarksError } = await supabase.from('bookmarks').select('id').limit(1);

    if (bookmarksError && bookmarksError.code === '42P01') {
      console.log('Bookmarks table does not exist');
      throw new Error(
        'Database tables do not exist. Please run the SQL schema in Supabase dashboard.'
      );
    }

    // If we get here, tables exist - let's verify they're working
    console.log('Verifying database tables...');

    // Test status_types
    const { data: statusTypes, error: statusError } = await supabase
      .from('status_types')
      .select('*')
      .order('display_order');

    if (statusError) {
      throw new Error(`Failed to query status_types: ${statusError.message}`);
    }

    console.log(`Found ${statusTypes.length} status types`);

    // Test bookmarks
    const { data: _bookmarks, error: bookmarksQueryError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (bookmarksQueryError) {
      throw new Error(`Failed to query bookmarks: ${bookmarksQueryError.message}`);
    }

    console.log('Database setup verified successfully!');

    return {
      success: true,
      statusTypes: statusTypes.length,
      message: 'Database is ready to use'
    };
  } catch (error) {
    console.error('Database setup error:', error);
    throw error;
  }
}

/**
 * Create database tables manually if they don't exist
 * This is a workaround since Supabase JS doesn't support DDL
 * Provides helpful error message with setup instructions
 */
export async function createTablesManually() {
  try {
    const storageService = new StorageService();
    const config = await storageService.getConfig();

    if (!config) {
      throw new Error('Supabase configuration not found');
    }

    // Create admin client with service role key
    // Note: This would require the service role key which we don't have in the browser
    // The proper way is to use Supabase dashboard or create an edge function

    throw new Error(
      'Automatic table creation requires database admin access. ' +
        'Please run the SQL schema in Supabase dashboard:\n\n' +
        '1. Go to Supabase Dashboard\n' +
        '2. Navigate to SQL Editor\n' +
        '3. Copy the schema from database/schema-simple.sql\n' +
        '4. Run the SQL\n\n' +
        'The schema is also available in setupDatabase.js for reference.'
    );
  } catch (error) {
    console.error('Manual table creation error:', error);
    throw error;
  }
}

