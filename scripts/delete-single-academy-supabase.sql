-- Supabase SQL Editor용 학원 삭제 스크립트
-- 사용법: 아래 academy_code 값을 변경하고 Supabase SQL Editor에서 실행

-- 트리거 비활성화
ALTER TABLE schedules DISABLE TRIGGER schedules_history_trigger;
ALTER TABLE student_schedules DISABLE TRIGGER student_schedules_count_trigger;

-- ==========================================
-- 🔧 설정: 삭제할 학원 코드를 여기서 변경하세요
-- ==========================================

DO $$
DECLARE
    target_academy_code TEXT := 'testaca';  -- 여기서 학원 코드 변경
    target_academy_id TEXT;
    deleted_counts RECORD;
    deleted_history INTEGER;
    deleted_student_schedules INTEGER;
    deleted_schedules INTEGER;
    deleted_instructors INTEGER;
    deleted_subjects INTEGER;
    deleted_classrooms INTEGER;
    deleted_class_types INTEGER;
    deleted_users INTEGER;
    deleted_accounts INTEGER;
BEGIN
    RAISE NOTICE '=== 학원 삭제 프로세스 시작 ===';
    RAISE NOTICE '대상 학원 코드: %', target_academy_code;
    
    -- 1. 학원 ID 조회
    SELECT id INTO target_academy_id 
    FROM academies 
    WHERE code = target_academy_code;
    
    -- 학원이 존재하지 않는 경우
    IF target_academy_id IS NULL THEN
        RAISE NOTICE '❌ 오류: 학원 코드 "%"를 찾을 수 없습니다.', target_academy_code;
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ 학원 ID 확인: %', target_academy_id;
    
    -- 2. 삭제 전 데이터 개수 확인
    SELECT 
        (SELECT COUNT(*) FROM users WHERE academy_id = target_academy_id) as users_count,
        (SELECT COUNT(*) FROM schedules WHERE academy_id = target_academy_id) as schedules_count,
        (SELECT COUNT(*) FROM instructors WHERE academy_id = target_academy_id) as instructors_count,
        (SELECT COUNT(*) FROM subjects WHERE academy_id = target_academy_id) as subjects_count,
        (SELECT COUNT(*) FROM classrooms WHERE academy_id = target_academy_id) as classrooms_count,
        (SELECT COUNT(*) FROM class_types WHERE academy_id = target_academy_id) as class_types_count,
        (SELECT COUNT(*) FROM accounts WHERE academy_id = target_academy_id) as accounts_count,
        (SELECT COUNT(*) FROM schedule_history sh 
         JOIN schedules s ON sh.schedule_id = s.id 
         WHERE s.academy_id = target_academy_id) as history_count,
        (SELECT COUNT(*) FROM student_schedules ss 
         JOIN schedules s ON ss.schedule_id = s.id 
         WHERE s.academy_id = target_academy_id) as student_schedules_count
    INTO deleted_counts;
    
    RAISE NOTICE '=== 삭제 대상 데이터 현황 ===';
    RAISE NOTICE '사용자: % 개', deleted_counts.users_count;
    RAISE NOTICE '시간표: % 개', deleted_counts.schedules_count;
    RAISE NOTICE '강사: % 개', deleted_counts.instructors_count;
    RAISE NOTICE '과목: % 개', deleted_counts.subjects_count;
    RAISE NOTICE '강의실: % 개', deleted_counts.classrooms_count;
    RAISE NOTICE '수업유형: % 개', deleted_counts.class_types_count;
    RAISE NOTICE '계정: % 개', deleted_counts.accounts_count;
    RAISE NOTICE '시간표 이력: % 개', deleted_counts.history_count;
    RAISE NOTICE '학생 수강: % 개', deleted_counts.student_schedules_count;
    
    -- 3. 트리거 비활성화 및 삭제 실행
    RAISE NOTICE '=== 트리거 비활성화 및 삭제 실행 ===';
    
    -- 3-1. 문제 트리거 일시 비활성화
    ALTER TABLE schedules DISABLE TRIGGER schedules_history_trigger;
    ALTER TABLE student_schedules DISABLE TRIGGER student_schedules_count_trigger;
    RAISE NOTICE '✅ 트리거 비활성화 완료';
    
    -- 3-2. schedule_history 먼저 삭제
    DELETE FROM schedule_history 
    WHERE schedule_id IN (
        SELECT id FROM schedules WHERE academy_id = target_academy_id
    );
    GET DIAGNOSTICS deleted_history = ROW_COUNT;
    RAISE NOTICE '✅ 시간표 이력: % 개 삭제', deleted_history;
    
    -- 3-3. student_schedules 삭제
    DELETE FROM student_schedules 
    WHERE schedule_id IN (
        SELECT id FROM schedules WHERE academy_id = target_academy_id
    );
    GET DIAGNOSTICS deleted_student_schedules = ROW_COUNT;
    RAISE NOTICE '✅ 학생 수강 정보: % 개 삭제', deleted_student_schedules;
    
    -- 3-4. schedules 삭제 (트리거 비활성화 상태)
    DELETE FROM schedules WHERE academy_id = target_academy_id;
    GET DIAGNOSTICS deleted_schedules = ROW_COUNT;
    RAISE NOTICE '✅ 시간표: % 개 삭제', deleted_schedules;
    
    -- 3-5. 트리거 재활성화
    ALTER TABLE schedules ENABLE TRIGGER schedules_history_trigger;
    ALTER TABLE student_schedules ENABLE TRIGGER student_schedules_count_trigger;
    RAISE NOTICE '✅ 트리거 재활성화 완료';
    
    -- 3-6. 나머지 테이블들 삭제
    DELETE FROM instructors WHERE academy_id = target_academy_id;
    GET DIAGNOSTICS deleted_instructors = ROW_COUNT;
    RAISE NOTICE '✅ 강사: % 개 삭제', deleted_instructors;
    
    DELETE FROM subjects WHERE academy_id = target_academy_id;
    GET DIAGNOSTICS deleted_subjects = ROW_COUNT;
    RAISE NOTICE '✅ 과목: % 개 삭제', deleted_subjects;
    
    DELETE FROM classrooms WHERE academy_id = target_academy_id;
    GET DIAGNOSTICS deleted_classrooms = ROW_COUNT;
    RAISE NOTICE '✅ 강의실: % 개 삭제', deleted_classrooms;
    
    DELETE FROM class_types WHERE academy_id = target_academy_id;
    GET DIAGNOSTICS deleted_class_types = ROW_COUNT;
    RAISE NOTICE '✅ 수업유형: % 개 삭제', deleted_class_types;
    
    DELETE FROM users WHERE academy_id = target_academy_id;
    GET DIAGNOSTICS deleted_users = ROW_COUNT;
    RAISE NOTICE '✅ 사용자: % 개 삭제', deleted_users;
    
    DELETE FROM accounts WHERE academy_id = target_academy_id;
    GET DIAGNOSTICS deleted_accounts = ROW_COUNT;
    RAISE NOTICE '✅ 계정: % 개 삭제', deleted_accounts;
    
    -- 3-7. 마지막으로 academies 삭제
    DELETE FROM academies WHERE id = target_academy_id;
    RAISE NOTICE '✅ 학원 정보 삭제 완료';
    
    RAISE NOTICE '=== 삭제 완료 ===';
    RAISE NOTICE '학원 "%"(ID: %) 및 모든 관련 데이터가 안전하게 삭제되었습니다.', target_academy_code, target_academy_id;
    RAISE NOTICE '총 삭제된 데이터: 시간표이력(%), 학생수강(%), 시간표(%), 강사(%), 과목(%), 강의실(%), 수업유형(%), 사용자(%), 계정(%)', 
                 deleted_history, deleted_student_schedules, deleted_schedules, deleted_instructors, 
                 deleted_subjects, deleted_classrooms, deleted_class_types, deleted_users, deleted_accounts;
    
EXCEPTION
    WHEN OTHERS THEN
        -- 오류 발생 시 트리거 재활성화
        BEGIN
            ALTER TABLE schedules ENABLE TRIGGER schedules_history_trigger;
            ALTER TABLE student_schedules ENABLE TRIGGER student_schedules_count_trigger;
            RAISE NOTICE '⚠️ 오류 발생으로 트리거 재활성화 완료';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️ 트리거 재활성화 실패';
        END;
        
        RAISE NOTICE '❌ 삭제 중 오류 발생: %', SQLERRM;
        RAISE EXCEPTION '삭제 실패: %', SQLERRM;
END;
$$; 

-- 트리거 재활성화
ALTER TABLE schedules ENABLE TRIGGER schedules_history_trigger;
ALTER TABLE student_schedules ENABLE TRIGGER student_schedules_count_trigger;