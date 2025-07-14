-- Board tables for academy forum feature
-- Posts table to store board posts
CREATE TABLE board_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_code TEXT NOT NULL REFERENCES academies(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_nickname TEXT NOT NULL DEFAULT '익명',
  password_hash TEXT NOT NULL, -- bcrypt hash of user-set password
  is_notice BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table to store post comments  
CREATE TABLE board_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_nickname TEXT NOT NULL DEFAULT '익명',
  password_hash TEXT NOT NULL, -- bcrypt hash of user-set password
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_board_posts_academy_code ON board_posts(academy_code);
CREATE INDEX idx_board_posts_created_at ON board_posts(created_at DESC);
CREATE INDEX idx_board_posts_is_notice ON board_posts(is_notice, created_at DESC);
CREATE INDEX idx_board_comments_post_id ON board_comments(post_id);
CREATE INDEX idx_board_comments_created_at ON board_comments(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_comments ENABLE ROW LEVEL SECURITY;

-- Allow read access to all posts and comments
CREATE POLICY "Allow read access to board posts" ON board_posts
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to board comments" ON board_comments  
  FOR SELECT USING (true);

-- Allow insert for authenticated users (we'll handle auth in API)
CREATE POLICY "Allow insert board posts" ON board_posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert board comments" ON board_comments
  FOR INSERT WITH CHECK (true);

-- Allow update/delete with proper authentication (handled in API)
CREATE POLICY "Allow update board posts" ON board_posts
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete board posts" ON board_posts
  FOR DELETE USING (true);

CREATE POLICY "Allow update board comments" ON board_comments
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete board comments" ON board_comments
  FOR DELETE USING (true);