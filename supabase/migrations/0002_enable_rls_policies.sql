-- Migration: 0002_enable_rls_policies.sql
-- Description: Row Level Security (RLS) 정책 설정
-- Created at: 2025-01-07

BEGIN;

-- ==========================================
-- RLS 활성화
-- ==========================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_history ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS 정책 생성
-- ==========================================

-- 1. accounts 테이블 정책
-- 사용자는 자신의 계정만 조회/수정 가능
CREATE POLICY "Users can view their own account" ON accounts
    FOR SELECT USING (username = current_user);

CREATE POLICY "Users can update their own account" ON accounts
    FOR UPDATE USING (username = current_user);

-- 새 계정 생성은 인증되지 않은 사용자도 가능 (회원가입)
CREATE POLICY "Anyone can create account" ON accounts
    FOR INSERT WITH CHECK (true);

-- 2. academies 테이블 정책
-- 모든 사용자가 학원 정보 조회 가능 (검색 기능용)
CREATE POLICY "Anyone can view academies" ON academies
    FOR SELECT USING (true);

-- 학원 정보 수정은 해당 학원의 소유자만 가능
CREATE POLICY "Academy owners can update their academy" ON academies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.academy_id = academies.id 
            AND users.email = current_user 
            AND users.role = 'OWNER'
        )
    );

-- 3. users 테이블 정책
-- 같은 학원 내 사용자들끼리만 조회 가능
CREATE POLICY "Academy members can view academy users" ON users
    FOR SELECT USING (
        academy_id IN (
            SELECT academy_id FROM users 
            WHERE email = current_user
        )
    );

-- 사용자 정보 수정은 본인 또는 학원 관리자만 가능
CREATE POLICY "Users can update their own info or academy admins can update" ON users
    FOR UPDATE USING (
        email = current_user 
        OR academy_id IN (
            SELECT academy_id FROM users 
            WHERE email = current_user 
            AND role IN ('OWNER', 'ADMIN')
        )
    );

-- 4. subjects 테이블 정책
-- 같은 학원 사용자들만 과목 조회 가능
CREATE POLICY "Academy members can view subjects" ON subjects
    FOR SELECT USING (
        academy_id IN (
            SELECT academy_id FROM users 
            WHERE email = current_user
        )
    );

-- 과목 생성/수정은 관리자급만 가능
CREATE POLICY "Academy admins can manage subjects" ON subjects
    FOR ALL USING (
        academy_id IN (
            SELECT academy_id FROM users 
            WHERE email = current_user 
            AND role IN ('OWNER', 'ADMIN')
        )
    );

-- 5. instructors 테이블 정책
-- 같은 학원 사용자들만 강사 정보 조회 가능
CREATE POLICY "Academy members can view instructors" ON instructors
    FOR SELECT USING (
        academy_id IN (
            SELECT academy_id FROM users 
            WHERE email = current_user
        )
    );

-- 강사 정보 수정은 본인 또는 관리자만 가능
CREATE POLICY "Instructors can update their own info or admins can update" ON instructors
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users 
            WHERE email = current_user
        )
        OR academy_id IN (
            SELECT academy_id FROM users 
            WHERE email = current_user 
            AND role IN ('OWNER', 'ADMIN')
        )
    );

-- 6. classrooms 테이블 정책
-- 같은 학원 사용자들만 강의실 조회 가능
CREATE POLICY "Academy members can view classrooms" ON classrooms
    FOR SELECT USING (
        academy_id IN (
            SELECT academy_id FROM users 
            WHERE email = current_user
        )
    );

-- 강의실 관리는 관리자급만 가능
CREATE POLICY "Academy admins can manage classrooms" ON classrooms
    FOR ALL USING (
        academy_id IN (
            SELECT academy_id FROM users 
            WHERE email = current_user 
            AND role IN ('OWNER', 'ADMIN')
        )
    );

-- 7. class_types 테이블 정책
-- 같은 학원 사용자들만 수업 유형 조회 가능
CREATE POLICY "Academy members can view class types" ON class_types
    FOR SELECT USING (
        academy_id IN (
            SELECT academy_id FROM users 
            WHERE email = current_user
        )
    );

-- 수업 유형 관리는 관리자급만 가능
CREATE POLICY "Academy admins can manage class types" ON class_types
    FOR ALL USING (
        academy_id IN (
            SELECT academy_id FROM users 
            WHERE email = current_user 
            AND role IN ('OWNER', 'ADMIN')
        )
    );

-- 8. schedules 테이블 정책
-- 같은 학원 사용자들만 시간표 조회 가능
CREATE POLICY "Academy members can view schedules" ON schedules
    FOR SELECT USING (
        academy_id IN (
            SELECT academy_id FROM users 
            WHERE email = current_user
        )
    );

-- 시간표 수정: 관리자 또는 해당 강사만 가능
CREATE POLICY "Academy admins and instructors can manage schedules" ON schedules
    FOR ALL USING (
        academy_id IN (
            SELECT academy_id FROM users 
            WHERE email = current_user 
            AND (
                role IN ('OWNER', 'ADMIN') 
                OR (
                    role = 'INSTRUCTOR' 
                    AND id IN (
                        SELECT user_id FROM instructors 
                        WHERE instructors.id = schedules.instructor_id
                    )
                )
            )
        )
    );

-- 9. student_schedules 테이블 정책
-- 학생은 자신의 수강 정보만 조회 가능, 관리자는 모든 수강 정보 조회 가능
CREATE POLICY "Students can view their own schedules, admins can view all" ON student_schedules
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE email = current_user
        )
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE email = current_user 
            AND role IN ('OWNER', 'ADMIN')
            AND academy_id IN (
                SELECT academy_id FROM users u2 
                WHERE u2.id = student_schedules.user_id
            )
        )
    );

-- 수강 신청/취소는 학생 본인 또는 관리자만 가능
CREATE POLICY "Students can manage their own enrollments or admins can manage" ON student_schedules
    FOR ALL USING (
        user_id IN (
            SELECT id FROM users 
            WHERE email = current_user
        )
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE email = current_user 
            AND role IN ('OWNER', 'ADMIN')
            AND academy_id IN (
                SELECT academy_id FROM users u2 
                WHERE u2.id = student_schedules.user_id
            )
        )
    );

-- 10. schedule_history 테이블 정책
-- 관리자급만 이력 조회 가능
CREATE POLICY "Academy admins can view schedule history" ON schedule_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM schedules s
            JOIN users u ON u.academy_id = s.academy_id
            WHERE s.id = schedule_history.schedule_id
            AND u.email = current_user
            AND u.role IN ('OWNER', 'ADMIN')
        )
    );

-- 이력 생성은 시스템에서 자동으로 처리 (트리거)
CREATE POLICY "System can create history records" ON schedule_history
    FOR INSERT WITH CHECK (true);

COMMIT;