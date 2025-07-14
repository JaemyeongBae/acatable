-- Add like/dislike system to board
-- First, add vote counts to existing tables

-- Add vote columns to posts
ALTER TABLE board_posts 
ADD COLUMN like_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN dislike_count INTEGER NOT NULL DEFAULT 0;

-- Add vote columns to comments  
ALTER TABLE board_comments
ADD COLUMN like_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN dislike_count INTEGER NOT NULL DEFAULT 0;

-- Create votes tracking table
CREATE TABLE board_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  post_id UUID REFERENCES board_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES board_comments(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure either post_id or comment_id is set, but not both
  CONSTRAINT vote_target_check CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR 
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  
  -- Prevent duplicate votes from same IP for same target within cooldown period
  CONSTRAINT unique_vote_per_ip_per_target UNIQUE NULLS NOT DISTINCT (ip_address, post_id, comment_id)
);

-- Indexes for performance
CREATE INDEX idx_board_votes_ip_created ON board_votes(ip_address, created_at);
CREATE INDEX idx_board_votes_post_id ON board_votes(post_id);
CREATE INDEX idx_board_votes_comment_id ON board_votes(comment_id);

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update like/dislike counts based on vote type
    IF NEW.post_id IS NOT NULL THEN
      IF NEW.vote_type = 'like' THEN
        UPDATE board_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
      ELSE
        UPDATE board_posts SET dislike_count = dislike_count + 1 WHERE id = NEW.post_id;
      END IF;
    ELSIF NEW.comment_id IS NOT NULL THEN
      IF NEW.vote_type = 'like' THEN
        UPDATE board_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
      ELSE
        UPDATE board_comments SET dislike_count = dislike_count + 1 WHERE id = NEW.comment_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease like/dislike counts when vote is removed
    IF OLD.post_id IS NOT NULL THEN
      IF OLD.vote_type = 'like' THEN
        UPDATE board_posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
      ELSE
        UPDATE board_posts SET dislike_count = dislike_count - 1 WHERE id = OLD.post_id;
      END IF;
    ELSIF OLD.comment_id IS NOT NULL THEN
      IF OLD.vote_type = 'like' THEN
        UPDATE board_comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
      ELSE
        UPDATE board_comments SET dislike_count = dislike_count - 1 WHERE id = OLD.comment_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote count updates
CREATE TRIGGER trigger_update_vote_counts
  AFTER INSERT OR DELETE ON board_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_counts();

-- RLS policies for votes table
ALTER TABLE board_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to votes" ON board_votes
  FOR SELECT USING (true);

CREATE POLICY "Allow insert votes" ON board_votes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete votes" ON board_votes
  FOR DELETE USING (true);