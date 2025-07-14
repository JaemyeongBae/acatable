-- 대댓글 기능 추가 및 비추천 제거 마이그레이션

-- 1. 댓글 테이블에 대댓글 지원을 위한 parent_id 컬럼 추가
ALTER TABLE board_comments 
ADD COLUMN parent_id UUID REFERENCES board_comments(id) ON DELETE CASCADE;

-- 2. dislike_count 컬럼 제거 (비추천 기능 제거)
ALTER TABLE board_posts 
DROP COLUMN IF EXISTS dislike_count;

ALTER TABLE board_comments 
DROP COLUMN IF EXISTS dislike_count;

-- 3. board_votes 테이블에서 dislike 관련 데이터 제거
DELETE FROM board_votes WHERE vote_type = 'dislike';

-- 4. vote_type 체크 제약조건 업데이트 (like만 허용)
ALTER TABLE board_votes 
DROP CONSTRAINT IF EXISTS board_votes_vote_type_check;

ALTER TABLE board_votes 
ADD CONSTRAINT board_votes_vote_type_check CHECK (vote_type = 'like');

-- 5. 댓글 정렬을 위한 인덱스 추가 (부모 댓글 → 대댓글 순서)
CREATE INDEX IF NOT EXISTS idx_board_comments_parent_created 
ON board_comments(post_id, parent_id, created_at);

-- 6. 대댓글 깊이 제한을 위한 함수 생성 (최대 1단계 대댓글만 허용)
CREATE OR REPLACE FUNCTION check_reply_depth()
RETURNS TRIGGER AS $$
BEGIN
  -- 대댓글의 대댓글은 허용하지 않음
  IF NEW.parent_id IS NOT NULL THEN
    -- 부모 댓글이 이미 대댓글인지 확인
    IF EXISTS (
      SELECT 1 FROM board_comments 
      WHERE id = NEW.parent_id AND parent_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION '대댓글의 대댓글은 작성할 수 없습니다.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 대댓글 깊이 제한 트리거 추가
DROP TRIGGER IF EXISTS check_reply_depth_trigger ON board_comments;
CREATE TRIGGER check_reply_depth_trigger
  BEFORE INSERT OR UPDATE ON board_comments
  FOR EACH ROW
  EXECUTE FUNCTION check_reply_depth();

-- 8. 투표 집계 함수 업데이트 (dislike 제거)
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- 게시글 투표 수 업데이트
  IF TG_TABLE_NAME = 'board_votes' AND NEW.post_id IS NOT NULL THEN
    UPDATE board_posts 
    SET like_count = (
      SELECT COUNT(*) FROM board_votes 
      WHERE post_id = NEW.post_id AND vote_type = 'like'
    )
    WHERE id = NEW.post_id;
  END IF;
  
  -- 댓글 투표 수 업데이트
  IF TG_TABLE_NAME = 'board_votes' AND NEW.comment_id IS NOT NULL THEN
    UPDATE board_comments 
    SET like_count = (
      SELECT COUNT(*) FROM board_votes 
      WHERE comment_id = NEW.comment_id AND vote_type = 'like'
    )
    WHERE id = NEW.comment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. 기존 투표 카운트 다시 계산
UPDATE board_posts 
SET like_count = (
  SELECT COUNT(*) FROM board_votes 
  WHERE post_id = board_posts.id AND vote_type = 'like'
);

UPDATE board_comments 
SET like_count = (
  SELECT COUNT(*) FROM board_votes 
  WHERE comment_id = board_comments.id AND vote_type = 'like'
);