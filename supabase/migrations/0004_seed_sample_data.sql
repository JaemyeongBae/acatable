-- Migration: 0004_seed_sample_data.sql  
-- Description: 테스트용 샘플 데이터 생성
-- Created at: 2025-01-07

BEGIN;

-- ==========================================
-- 샘플 데이터 생성
-- ==========================================

-- 1. 학원 데이터
INSERT INTO academies (id, name, code, address, phone, email) VALUES 
('demo-academy', '와이즈과학학원', 'DEMO001', '서울시 강남구 테스트로 123', '02-1234-5678', 'contact@demo-academy.com')
ON CONFLICT (id) DO NOTHING;

-- 2. 계정 데이터 (관리자용)
INSERT INTO accounts (id, username, password, academy_name, admin_email, admin_phone) VALUES 
('account-demo', 'demo-admin', '$2b$10$dummy.hash.for.testing.purposes.only', '와이즈과학학원', 'admin@demo.com', '010-1111-1111')
ON CONFLICT (username) DO NOTHING;

-- 3. 사용자 데이터
INSERT INTO users (id, email, name, phone, role, academy_id) VALUES 
('user-admin', 'admin@demo.com', '김원장', '010-1111-1111', 'OWNER', 'demo-academy'),
('user-instructor-1', 'teacher1@demo.com', '이수학', '010-2222-2222', 'INSTRUCTOR', 'demo-academy'),
('user-instructor-2', 'teacher2@demo.com', '박영어', '010-3333-3333', 'INSTRUCTOR', 'demo-academy'),
('user-instructor-3', 'teacher3@demo.com', '최과학', '010-4444-4444', 'INSTRUCTOR', 'demo-academy')
ON CONFLICT (email) DO NOTHING;

-- 4. 과목 데이터
INSERT INTO subjects (id, name, color, academy_id) VALUES 
('subject-math', '수학', '#FF5722', 'demo-academy'),
('subject-english', '영어', '#2196F3', 'demo-academy'),
('subject-science', '과학', '#4CAF50', 'demo-academy'),
('subject-korean', '국어', '#9C27B0', 'demo-academy')
ON CONFLICT (id) DO NOTHING;

-- 5. 강사 프로필 데이터
INSERT INTO instructors (id, user_id, academy_id, specialties, bio) VALUES 
('instructor-1', 'user-instructor-1', 'demo-academy', '["중학수학", "고1수학", "고2수학"]', '10년 경력의 수학 전문 강사입니다.'),
('instructor-2', 'user-instructor-2', 'demo-academy', '["중학영어", "고등영어", "TOEFL"]', '영어 전문 강사로 토플 고득점 전문가입니다.'),
('instructor-3', 'user-instructor-3', 'demo-academy', '["물리", "화학", "생명과학"]', '과학 전 영역 담당하는 베테랑 강사입니다.')
ON CONFLICT (user_id) DO NOTHING;

-- 6. 강의실 데이터
INSERT INTO classrooms (id, name, capacity, floor, location, academy_id) VALUES 
('classroom-1', '수학실 A', 20, 2, '201호', 'demo-academy'),
('classroom-2', '영어실 B', 15, 2, '202호', 'demo-academy'),
('classroom-3', '과학실 C', 18, 3, '301호', 'demo-academy'),
('classroom-4', '멀티미디어실', 25, 1, '101호', 'demo-academy')
ON CONFLICT (id) DO NOTHING;

-- 7. 수업 유형 데이터
INSERT INTO class_types (id, name, color, description, academy_id) VALUES 
('classtype-regular', '정규수업', '#1976D2', '주 2-3회 정규 진도 수업', 'demo-academy'),
('classtype-intensive', '집중특강', '#D32F2F', '시험 대비 집중 특강', 'demo-academy'),
('classtype-makeup', '보충수업', '#388E3C', '결석자 대상 보충 수업', 'demo-academy')
ON CONFLICT (id) DO NOTHING;

-- 8. 시간표 데이터
INSERT INTO schedules (id, title, description, day_of_week, start_time, end_time, max_students, academy_id, subject_id, instructor_id, classroom_id, class_type_id) VALUES 
-- 월요일
('schedule-1', '중1 수학 기초', '중학교 1학년 수학 기본 개념', 'MONDAY', '14:00', '15:30', 15, 'demo-academy', 'subject-math', 'instructor-1', 'classroom-1', 'classtype-regular'),
('schedule-2', '고2 영어 독해', '고등학교 2학년 영어 독해 집중', 'MONDAY', '16:00', '17:30', 12, 'demo-academy', 'subject-english', 'instructor-2', 'classroom-2', 'classtype-regular'),
-- 화요일
('schedule-3', '중3 과학 실험', '중학교 3학년 과학 실험 수업', 'TUESDAY', '15:00', '16:30', 10, 'demo-academy', 'subject-science', 'instructor-3', 'classroom-3', 'classtype-regular'),
('schedule-4', '고1 수학 심화', '고등학교 1학년 수학 심화 과정', 'TUESDAY', '17:00', '18:30', 18, 'demo-academy', 'subject-math', 'instructor-1', 'classroom-1', 'classtype-regular'),
-- 수요일
('schedule-5', '토플 집중반', 'TOEFL 점수 향상 집중 특강', 'WEDNESDAY', '19:00', '21:00', 8, 'demo-academy', 'subject-english', 'instructor-2', 'classroom-4', 'classtype-intensive'),
-- 목요일
('schedule-6', '중2 수학', '중학교 2학년 수학 정규수업', 'THURSDAY', '14:30', '16:00', 16, 'demo-academy', 'subject-math', 'instructor-1', 'classroom-1', 'classtype-regular'),
('schedule-7', '고1 물리', '고등학교 1학년 물리 기초', 'THURSDAY', '16:30', '18:00', 14, 'demo-academy', 'subject-science', 'instructor-3', 'classroom-3', 'classtype-regular'),
-- 금요일
('schedule-8', '고3 수학 특강', '수능 대비 수학 집중 특강', 'FRIDAY', '17:00', '19:00', 20, 'demo-academy', 'subject-math', 'instructor-1', 'classroom-4', 'classtype-intensive'),
-- 토요일
('schedule-9', '영어 보충수업', '결석자 대상 영어 보충', 'SATURDAY', '10:00', '11:30', 5, 'demo-academy', 'subject-english', 'instructor-2', 'classroom-2', 'classtype-makeup')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 데이터 검증 및 통계
-- ==========================================

-- 생성된 데이터 확인
DO $$
DECLARE
    academy_count INTEGER;
    user_count INTEGER;
    schedule_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO academy_count FROM academies;
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO schedule_count FROM schedules;
    
    RAISE NOTICE '샘플 데이터 생성 완료:';
    RAISE NOTICE '- 학원: % 개', academy_count;
    RAISE NOTICE '- 사용자: % 명', user_count;
    RAISE NOTICE '- 시간표: % 개', schedule_count;
END $$;

COMMIT;