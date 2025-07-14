-- IP 주소 필드 추가
ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS author_ip TEXT;
ALTER TABLE board_comments ADD COLUMN IF NOT EXISTS author_ip TEXT;

-- 인덱스 추가 for better performance
CREATE INDEX IF NOT EXISTS idx_board_posts_author_ip ON board_posts(author_ip);
CREATE INDEX IF NOT EXISTS idx_board_comments_author_ip ON board_comments(author_ip);