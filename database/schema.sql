-- ForgetfulMe Database Schema (Full Version)
-- Run this in Supabase SQL Editor
-- Based on dev-docs/DATABASE_SCHEMA.md

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For better text search

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
    -- Add unique constraint to prevent duplicate bookmarks per user
    UNIQUE(user_id, url)
);

-- Create indexes for better performance
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

-- Create RLS (Row Level Security) policies
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks" ON bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks" ON bookmarks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- Status types policies (everyone can read, no one can modify)
CREATE POLICY "Anyone can view status types" ON status_types
    FOR SELECT USING (true);

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE ON bookmarks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_status_types_updated_at BEFORE UPDATE ON status_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();