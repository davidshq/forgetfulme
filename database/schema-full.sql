-- ForgetfulMe Database Schema (Full Version)
-- Run this in Supabase SQL Editor
-- Based on dev-docs/DATABASE_SCHEMA.md

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For better text search

-- 1. USER PROFILES TABLE
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- User preferences stored as JSONB for flexibility
  preferences JSONB NOT NULL DEFAULT '{
    "defaultStatus": "read",
    "autoTagging": false,
    "keyboardShortcuts": {
      "markAsRead": "Ctrl+Shift+R"
    },
    "theme": "auto",
    "pageSize": 25,
    "showDescriptions": true
  }'::jsonb,
  
  -- Usage statistics
  total_bookmarks INTEGER NOT NULL DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_last_active ON user_profiles(last_active_at);

-- RLS Policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- 2. STATUS TYPES TABLE (per-user custom statuses)
CREATE TABLE public.status_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT, -- Hex color code (e.g., "#3b82f6")
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT status_types_name_length CHECK (length(name) >= 1 AND length(name) <= 50),
  CONSTRAINT status_types_color_format CHECK (color IS NULL OR color ~ '^#[0-9a-fA-F]{6}$'),
  CONSTRAINT unique_status_name_per_user UNIQUE (user_id, name)
);

-- Indexes for status_types
CREATE INDEX idx_status_types_user_id ON status_types(user_id);
CREATE INDEX idx_status_types_sort_order ON status_types(user_id, sort_order);

-- RLS Policies for status_types
ALTER TABLE status_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own status types" ON status_types
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own status types" ON status_types
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. BOOKMARKS TABLE (enhanced with full-text search)
CREATE TABLE public.bookmarks (
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
  
  -- Constraints
  CONSTRAINT bookmarks_url_length CHECK (length(url) >= 1 AND length(url) <= 2048),
  CONSTRAINT bookmarks_title_length CHECK (length(title) >= 1 AND length(title) <= 500),
  CONSTRAINT bookmarks_description_length CHECK (description IS NULL OR length(description) <= 2000),
  CONSTRAINT bookmarks_status_length CHECK (length(status) >= 1 AND length(status) <= 50),
  
  -- Unique constraint to prevent duplicate URLs per user
  CONSTRAINT unique_url_per_user UNIQUE (user_id, url)
);

-- Indexes for performance
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_status ON bookmarks(user_id, status);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(user_id, created_at DESC);
CREATE INDEX idx_bookmarks_updated_at ON bookmarks(user_id, updated_at DESC);
CREATE INDEX idx_bookmarks_last_accessed ON bookmarks(user_id, last_accessed_at DESC);
CREATE INDEX idx_bookmarks_url ON bookmarks(user_id, url); -- For existence checks
CREATE INDEX idx_bookmarks_tags ON bookmarks USING GIN(tags); -- For tag searches
CREATE INDEX idx_bookmarks_title_search ON bookmarks USING GIN(to_tsvector('english', title));
CREATE INDEX idx_bookmarks_description_search ON bookmarks USING GIN(to_tsvector('english', description));

-- Combined index for common queries
CREATE INDEX idx_bookmarks_user_status_created ON bookmarks(user_id, status, created_at DESC);

-- RLS Policies for bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own bookmarks" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- TRIGGERS AND FUNCTIONS

-- Update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_status_types_updated_at
  BEFORE UPDATE ON status_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookmarks_updated_at
  BEFORE UPDATE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile trigger
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

-- Insert default status types for new users
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

-- Update bookmark access tracking
CREATE OR REPLACE FUNCTION update_bookmark_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if it's been more than 1 hour since last access
  IF OLD.last_accessed_at IS NULL OR NOW() - OLD.last_accessed_at > INTERVAL '1 hour' THEN
    NEW.access_count = COALESCE(OLD.access_count, 0) + 1;
    NEW.last_accessed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bookmark_access_trigger
  BEFORE UPDATE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_bookmark_access();

-- Update user's total bookmark count
CREATE OR REPLACE FUNCTION update_user_bookmark_count()
RETURNS TRIGGER AS $$
DECLARE
  affected_user_id UUID;
BEGIN
  -- Determine which user was affected
  IF TG_OP = 'DELETE' THEN
    affected_user_id = OLD.user_id;
  ELSE
    affected_user_id = NEW.user_id;
  END IF;
  
  -- Update the user's bookmark count
  UPDATE user_profiles 
  SET total_bookmarks = (
    SELECT COUNT(*) 
    FROM bookmarks 
    WHERE user_id = affected_user_id
  )
  WHERE id = affected_user_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_bookmark_count_trigger
  AFTER INSERT OR DELETE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_user_bookmark_count();

-- ADVANCED SEARCH FUNCTION
CREATE OR REPLACE FUNCTION search_bookmarks(
  search_text TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  tag_filters TEXT[] DEFAULT NULL,
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL,
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
  updated_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER,
  relevance_score REAL
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
    b.updated_at,
    b.last_accessed_at,
    b.access_count,
    CASE 
      WHEN search_text IS NOT NULL THEN
        ts_rank(
          to_tsvector('english', b.title || ' ' || COALESCE(b.description, '')),
          plainto_tsquery('english', search_text)
        )
      ELSE 0.0
    END as relevance_score
  FROM bookmarks b
  WHERE 
    b.user_id = auth.uid()
    AND (search_text IS NULL OR (
      to_tsvector('english', b.title || ' ' || COALESCE(b.description, '')) 
      @@ plainto_tsquery('english', search_text)
      OR b.url ILIKE '%' || search_text || '%'
    ))
    AND (status_filter IS NULL OR b.status = status_filter)
    AND (tag_filters IS NULL OR b.tags && tag_filters)
    AND (date_from IS NULL OR b.created_at >= date_from)
    AND (date_to IS NULL OR b.created_at <= date_to)
  ORDER BY 
    CASE 
      WHEN search_text IS NOT NULL THEN relevance_score 
      ELSE 0.0 
    END DESC,
    b.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- BULK OPERATIONS FUNCTION
CREATE OR REPLACE FUNCTION bulk_update_bookmarks(
  bookmark_ids UUID[],
  new_status TEXT DEFAULT NULL,
  add_tags TEXT[] DEFAULT NULL,
  remove_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  updated_count INTEGER,
  error_count INTEGER,
  errors TEXT[]
)
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER := 0;
  error_count INTEGER := 0;
  errors TEXT[] := ARRAY[]::TEXT[];
  bookmark_id UUID;
BEGIN
  -- Validate that all bookmarks belong to the current user
  IF EXISTS (
    SELECT 1 FROM bookmarks 
    WHERE id = ANY(bookmark_ids) 
    AND user_id != auth.uid()
  ) THEN
    error_count := array_length(bookmark_ids, 1);
    errors := array_append(errors, 'Unauthorized access to bookmarks');
    RETURN QUERY SELECT updated_count, error_count, errors;
    RETURN;
  END IF;

  -- Perform updates
  FOREACH bookmark_id IN ARRAY bookmark_ids
  LOOP
    BEGIN
      UPDATE bookmarks 
      SET 
        status = COALESCE(new_status, status),
        tags = CASE 
          WHEN add_tags IS NOT NULL AND remove_tags IS NOT NULL THEN
            array(SELECT DISTINCT unnest(tags || add_tags) EXCEPT SELECT unnest(remove_tags))
          WHEN add_tags IS NOT NULL THEN
            array(SELECT DISTINCT unnest(tags || add_tags))
          WHEN remove_tags IS NOT NULL THEN
            array(SELECT unnest(tags) EXCEPT SELECT unnest(remove_tags))
          ELSE tags
        END,
        updated_at = NOW()
      WHERE id = bookmark_id AND user_id = auth.uid();
      
      IF FOUND THEN
        updated_count := updated_count + 1;
      ELSE
        error_count := error_count + 1;
        errors := array_append(errors, 'Bookmark not found: ' || bookmark_id::TEXT);
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      errors := array_append(errors, 'Error updating bookmark ' || bookmark_id::TEXT || ': ' || SQLERRM);
    END;
  END LOOP;

  RETURN QUERY SELECT updated_count, error_count, errors;
END;
$$ LANGUAGE plpgsql;

-- STATISTICS VIEWS
CREATE OR REPLACE VIEW bookmark_stats_view AS
SELECT 
  user_id,
  COUNT(*) as total_bookmarks,
  COUNT(*) FILTER (WHERE status = 'read') as read_count,
  COUNT(*) FILTER (WHERE status = 'good-reference') as reference_count,
  COUNT(*) FILTER (WHERE status = 'low-value') as low_value_count,
  COUNT(*) FILTER (WHERE status = 'revisit-later') as revisit_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_7_days,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent_30_days,
  COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) as this_month,
  AVG(access_count) as avg_access_count,
  MAX(created_at) as last_bookmark_at
FROM bookmarks
GROUP BY user_id;

-- RLS for view
CREATE POLICY "Users can only see their own stats" ON bookmark_stats_view
  FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW tag_stats_view AS
SELECT 
  user_id,
  unnest(tags) as tag,
  COUNT(*) as usage_count,
  MAX(created_at) as last_used_at,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent_usage
FROM bookmarks
WHERE tags != ARRAY[]::TEXT[]
GROUP BY user_id, unnest(tags);

-- RLS for tag view
CREATE POLICY "Users can only see their own tag stats" ON tag_stats_view
  FOR SELECT USING (auth.uid() = user_id);

-- PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Enable realtime for real-time sync
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
ALTER PUBLICATION supabase_realtime ADD TABLE status_types;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;