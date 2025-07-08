-- Migration: 0004_seed_sample_data_safe.sql  
-- Description: 안전한 테스트용 샘플 데이터 생성 (민감정보 제거)
-- Created at: 2025-01-07

BEGIN;

-- ==========================================
-- 안전한 샘플 데이터 생성
-- ==========================================

-- 1. 학원 데이터 (예시)
INSERT INTO academies (id, name, code, address, phone, email) VALUES 
('demo-academy', '샘플학원', 'DEMO001', '서울시 강남구 샘플로 123', '02-0000-0000', 'contact@example.com')
ON CONFLICT (id) DO NOTHING;

-- 2. 계정 데이터 (더미 해시)
INSERT INTO accounts (id, username, password, academy_name, admin_email, admin_phone) VALUES 
('account-demo', 'demo-admin', '$2b$10$dummy.hash.for.testing.only', '샘플학원', 'admin@example.com', '010-0000-0000')
ON CONFLICT (username) DO NOTHING;

-- 3. 사용자 데이터 (더미 정보)
INSERT INTO users (id, email, name, phone, role, academy_id) VALUES 
('user-admin', 'admin@example.com', '김관리자', '010-0000-0000', 'OWNER', 'demo-academy'),
('user-instructor-1', 'teacher1@example.com', '이강사', '010-0000-0001', 'INSTRUCTOR', 'demo-academy'),
('user-instructor-2', 'teacher2@example.com', '박강사', '010-0000-0002', 'INSTRUCTOR', 'demo-academy')
ON CONFLICT (email) DO NOTHING;

-- 4. 과목 데이터
INSERT INTO subjects (id, name, color, academy_id) VALUES 
('subject-math', '수학', '#FF5722', 'demo-academy'),
('subject-english', '영어', '#2196F3', 'demo-academy'),
('subject-science', '과학', '#4CAF50', 'demo-academy')
ON CONFLICT (id) DO NOTHING;

-- 5. 강사 프로필 데이터
INSERT INTO instructors (id, user_id, academy_id, specialties, bio) VALUES 
('instructor-1', 'user-instructor-1', 'demo-academy', '["수학"]', '수학 전문 강사'),
('instructor-2', 'user-instructor-2', 'demo-academy', '["영어"]', '영어 전문 강사')
ON CONFLICT (user_id) DO NOTHING;

-- 6. 강의실 데이터
INSERT INTO classrooms (id, name, capacity, floor, location, academy_id) VALUES 
('classroom-1', '강의실 A', 20, 2, '201호', 'demo-academy'),
('classroom-2', '강의실 B', 15, 2, '202호', 'demo-academy')
ON CONFLICT (id) DO NOTHING;

-- 7. 수업 유형 데이터
INSERT INTO class_types (id, name, color, description, academy_id) VALUES 
('classtype-regular', '정규수업', '#1976D2', '정규 수업', 'demo-academy'),
('classtype-intensive', '특강', '#D32F2F', '집중 특강', 'demo-academy')
ON CONFLICT (id) DO NOTHING;

COMMIT;