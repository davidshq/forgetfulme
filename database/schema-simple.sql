-- ForgetfulMe Database Schema (Simplified Version)
-- Run this in Supabase SQL Editor first to test
-- Falls back to basic search if full-text search has issues

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES TABLE (simplified)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Simple preferences as separate columns instead of JSONB
  default_status TEXT DEFAULT 'read',
  page_size INTEGER DEFAULT 25,
  theme TEXT DEFAULT 'auto',
  
  -- Usage statistics
  total_bookmarks INTEGER NOT NULL DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STATUS TYPES TABLE (per-user)
CREATE TABLE IF NOT EXISTS public.status_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_status_name_per_user UNIQUE (user_id, name)
);

-- 3. BOOKMARKS TABLE (basic version)
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core bookmark data
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Categorization
  status TEXT NOT NULL DEFAULT 'read',
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  
  -- Usage tracking
  access_count INTEGER NOT NULL DEFAULT 0,
  
  -- Unique constraint to prevent duplicate URLs per user
  CONSTRAINT unique_url_per_user UNIQUE (user_id, url)
);

-- INDEXES (basic performance)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_status_types_user_id ON status_types(user_id);
CREATE INDEX IF NOT EXISTS idx_status_types_sort_order ON status_types(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_status ON bookmarks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags ON bookmarks USING GIN(tags);

-- RLS POLICIES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access their own status types" ON status_types
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own bookmarks" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- BASIC TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_status_types_updated_at
  BEFORE UPDATE ON status_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookmarks_updated_at
  BEFORE UPDATE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AUTO-SETUP FOR NEW USERS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create default status types for new users
CREATE OR REPLACE FUNCTION create_default_status_types()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.status_types (user_id, name, color, is_default, sort_order) VALUES
    (NEW.id, 'read', '#10b981', true, 1),
    (NEW.id, 'good-reference', '#3b82f6', false, 2),
    (NEW.id, 'low-value', '#6b7280', false, 3),
    (NEW.id, 'revisit-later', '#f59e0b', false, 4);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_user_default_status_types
  AFTER INSERT ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_status_types();

-- BASIC SEARCH FUNCTION (without full-text search)
CREATE OR REPLACE FUNCTION search_bookmarks_basic(
  search_text TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  tag_filters TEXT[] DEFAULT NULL,
  limit_count INTEGER DEFAULT 25,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  url TEXT,
  title TEXT,
  description TEXT,
  status TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.url,
    b.title,
    b.description,
    b.status,
    b.tags,
    b.created_at,
    b.updated_at
  FROM bookmarks b
  WHERE 
    b.user_id = auth.uid()
    AND (search_text IS NULL OR (
      b.title ILIKE '%' || search_text || '%'
      OR b.description ILIKE '%' || search_text || '%'
      OR b.url ILIKE '%' || search_text || '%'
    ))
    AND (status_filter IS NULL OR b.status = status_filter)
    AND (tag_filters IS NULL OR b.tags && tag_filters)
  ORDER BY b.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;