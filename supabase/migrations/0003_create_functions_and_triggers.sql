-- Migration: 0003_create_functions_and_triggers.sql
-- Description: updated_at 자동 업데이트 함수 및 트리거 생성
-- Created at: 2025-01-07

BEGIN;

-- ==========================================
-- FUNCTIONS 생성
-- ==========================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 시간표 변경 이력 자동 생성 함수
CREATE OR REPLACE FUNCTION create_schedule_history()
RETURNS TRIGGER AS $$
DECLARE
    action_type TEXT;
    old_data_json TEXT := NULL;
    new_data_json TEXT := NULL;
    current_user_id TEXT;
BEGIN
    -- 현재 사용자 ID 가져오기 (이메일 기반)
    SELECT id INTO current_user_id 
    FROM users 
    WHERE email = current_user 
    LIMIT 1;
    
    -- 사용자 ID가 없으면 시스템 사용자로 기록
    IF current_user_id IS NULL THEN
        current_user_id := 'system';
    END IF;

    -- 액션 타입 결정
    IF TG_OP = 'DELETE' THEN
        action_type := 'DELETE';
        old_data_json := row_to_json(OLD)::TEXT;
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'UPDATE';
        old_data_json := row_to_json(OLD)::TEXT;
        new_data_json := row_to_json(NEW)::TEXT;
    ELSIF TG_OP = 'INSERT' THEN
        action_type := 'CREATE';
        new_data_json := row_to_json(NEW)::TEXT;
    END IF;

    -- 이력 레코드 생성
    INSERT INTO schedule_history (
        id,
        schedule_id,
        action,
        old_data,
        new_data,
        changed_by,
        changed_at
    ) VALUES (
        'hist_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8),
        COALESCE(NEW.id, OLD.id),
        action_type,
        old_data_json,
        new_data_json,
        current_user_id,
        CURRENT_TIMESTAMP
    );

    -- 적절한 행 반환
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

-- 학생 수강 신청 시 현재 수강 인원 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_current_students_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_active = TRUE THEN
        -- 수강 신청 시 현재 수강 인원 증가
        UPDATE schedules 
        SET current_students = current_students + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.schedule_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- 수강 상태 변경 시
        IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
            -- 수강 취소
            UPDATE schedules 
            SET current_students = current_students - 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.schedule_id;
        ELSIF OLD.is_active = FALSE AND NEW.is_active = TRUE THEN
            -- 수강 재신청
            UPDATE schedules 
            SET current_students = current_students + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.schedule_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.is_active = TRUE THEN
        -- 수강 신청 삭제 시 현재 수강 인원 감소
        UPDATE schedules 
        SET current_students = current_students - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.schedule_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

-- ==========================================
-- TRIGGERS 생성
-- ==========================================

-- updated_at 자동 업데이트 트리거들
CREATE TRIGGER update_academies_updated_at
    BEFORE UPDATE ON academies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructors_updated_at
    BEFORE UPDATE ON instructors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classrooms_updated_at
    BEFORE UPDATE ON classrooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_types_updated_at
    BEFORE UPDATE ON class_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 시간표 변경 이력 자동 생성 트리거
CREATE TRIGGER schedules_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON schedules
    FOR EACH ROW EXECUTE FUNCTION create_schedule_history();

-- 학생 수강 신청 시 현재 수강 인원 자동 업데이트 트리거
CREATE TRIGGER student_schedules_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON student_schedules
    FOR EACH ROW EXECUTE FUNCTION update_current_students_count();

-- ==========================================
-- 유틸리티 함수들
-- ==========================================

-- 시간 충돌 검사 함수
CREATE OR REPLACE FUNCTION check_time_conflict(
    p_academy_id TEXT,
    p_day_of_week day_of_week,
    p_start_time TEXT,
    p_end_time TEXT,
    p_instructor_id TEXT DEFAULT NULL,
    p_classroom_id TEXT DEFAULT NULL,
    p_exclude_schedule_id TEXT DEFAULT NULL
)
RETURNS TABLE(
    conflict_type TEXT,
    conflict_schedule_id TEXT,
    conflict_title TEXT
) AS $$
BEGIN
    -- 강사 시간 충돌 검사
    IF p_instructor_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            'instructor'::TEXT,
            s.id,
            s.title
        FROM schedules s
        WHERE s.academy_id = p_academy_id
        AND s.instructor_id = p_instructor_id
        AND s.day_of_week = p_day_of_week
        AND s.is_active = TRUE
        AND (p_exclude_schedule_id IS NULL OR s.id != p_exclude_schedule_id)
        AND (
            (p_start_time >= s.start_time AND p_start_time < s.end_time) OR
            (p_end_time > s.start_time AND p_end_time <= s.end_time) OR
            (p_start_time <= s.start_time AND p_end_time >= s.end_time)
        );
    END IF;

    -- 강의실 시간 충돌 검사
    IF p_classroom_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            'classroom'::TEXT,
            s.id,
            s.title
        FROM schedules s
        WHERE s.academy_id = p_academy_id
        AND s.classroom_id = p_classroom_id
        AND s.day_of_week = p_day_of_week
        AND s.is_active = TRUE
        AND (p_exclude_schedule_id IS NULL OR s.id != p_exclude_schedule_id)
        AND (
            (p_start_time >= s.start_time AND p_start_time < s.end_time) OR
            (p_end_time > s.start_time AND p_end_time <= s.end_time) OR
            (p_start_time <= s.start_time AND p_end_time >= s.end_time)
        );
    END IF;
END;
$$ language 'plpgsql';

-- 학원별 통계 조회 함수
CREATE OR REPLACE FUNCTION get_academy_stats(p_academy_id TEXT)
RETURNS TABLE(
    total_schedules BIGINT,
    total_students BIGINT,
    total_instructors BIGINT,
    total_subjects BIGINT,
    total_classrooms BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM schedules WHERE academy_id = p_academy_id AND is_active = TRUE),
        (SELECT COUNT(*) FROM users WHERE academy_id = p_academy_id AND role = 'STUDENT' AND is_active = TRUE),
        (SELECT COUNT(*) FROM instructors WHERE academy_id = p_academy_id AND is_active = TRUE),
        (SELECT COUNT(*) FROM subjects WHERE academy_id = p_academy_id AND is_active = TRUE),
        (SELECT COUNT(*) FROM classrooms WHERE academy_id = p_academy_id AND is_active = TRUE);
END;
$$ language 'plpgsql';

COMMIT;