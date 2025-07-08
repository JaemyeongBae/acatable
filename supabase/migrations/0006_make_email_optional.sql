-- Migration: 0006_make_email_optional.sql
-- Description: 사용자 이메일을 선택사항으로 변경
-- Created at: 2025-01-07

BEGIN;

-- 기존 UNIQUE 제약 조건 제거 (email이 NOT NULL이므로)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- 새로운 UNIQUE 제약 조건 추가 (NULL 값 허용하면서 중복 방지)
-- PostgreSQL에서는 NULL 값은 UNIQUE 제약 조건에서 제외됨
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique 
ON users (email) 
WHERE email IS NOT NULL;

COMMIT;