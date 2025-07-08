-- Supabase SQL Editor용 테스트 계정 일괄 삭제 스크립트
-- 사용법: Supabase SQL Editor에서 바로 실행

DO $$
DECLARE
    academy_codes TEXT[] := ARRAY['testaca', 'newtest', 'demo001'];
    academy_code TEXT;
    target_academy_id TEXT;
    deleted_count INTEGER := 0;
    total_data_count INTEGER := 0;
    total_deleted_history INTEGER := 0;
    total_deleted_student_schedules INTEGER := 0;
    total_deleted_schedules INTEGER := 0;
    total_deleted_instructors INTEGER := 0;
    total_deleted_subjects INTEGER := 0;
    total_deleted_classrooms INTEGER := 0;
    total_deleted_class_types INTEGER := 0;
    total_deleted_users INTEGER := 0;
    total_deleted_accounts INTEGER := 0;
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
    RAISE NOTICE '=== 테스트 계정 일괄 삭제 시작 ===';
    RAISE NOTICE '삭제 대상: %', array_to_string(academy_codes, ', ');
    
    -- 삭제 전 전체 현황 확인
    FOREACH academy_code IN ARRAY academy_codes
    LOOP
        SELECT id INTO target_academy_id FROM academies WHERE code = academy_code;
        
        IF target_academy_id IS NOT NULL THEN
            SELECT 
                (SELECT COUNT(*) FROM users WHERE academy_id = target_academy_id) +
                (SELECT COUNT(*) FROM schedules WHERE academy_id = target_academy_id) +
                (SELECT COUNT(*) FROM instructors WHERE academy_id = target_academy_id) +
                (SELECT COUNT(*) FROM subjects WHERE academy_id = target_academy_id) +
                (SELECT COUNT(*) FROM classrooms WHERE academy_id = target_academy_id) +
                (SELECT COUNT(*) FROM class_types WHERE academy_id = target_academy_id) +
                (SELECT COUNT(*) FROM accounts WHERE academy_id = target_academy_id) +
                (SELECT COUNT(*) FROM schedule_history sh 
                 JOIN schedules s ON sh.schedule_id = s.id 
                 WHERE s.academy_id = target_academy_id) +
                (SELECT COUNT(*) FROM student_schedules ss 
                 JOIN schedules s ON ss.schedule_id = s.id 
                 WHERE s.academy_id = target_academy_id)
            INTO total_data_count;
            
            RAISE NOTICE '학원 "%": % 개의 관련 데이터', academy_code, total_data_count;
        ELSE
            RAISE NOTICE '학원 "%": 존재하지 않음', academy_code;
        END IF;
    END LOOP;
    
    RAISE NOTICE '=== 트리거 비활성화 및 일괄 삭제 실행 ===';
    
    -- 전체 삭제 과정에서 트리거 비활성화
    ALTER TABLE schedules DISABLE TRIGGER schedules_history_trigger;
    ALTER TABLE student_schedules DISABLE TRIGGER student_schedules_count_trigger;
    RAISE NOTICE '✅ 트리거 비활성화 완료';
    
    -- 각 학원별로 삭제 (트리거 비활성화 상태)
    FOREACH academy_code IN ARRAY academy_codes
    LOOP
        SELECT id INTO target_academy_id FROM academies WHERE code = academy_code;
        
        IF target_academy_id IS NOT NULL THEN
            RAISE NOTICE '--- 학원 "%" 삭제 시작 ---', academy_code;
            
            -- 1. schedule_history 먼저 삭제
            DELETE FROM schedule_history 
            WHERE schedule_id IN (
                SELECT id FROM schedules WHERE academy_id = target_academy_id
            );
            GET DIAGNOSTICS deleted_history = ROW_COUNT;
            total_deleted_history := total_deleted_history + deleted_history;
            
            -- 2. student_schedules 삭제
            DELETE FROM student_schedules 
            WHERE schedule_id IN (
                SELECT id FROM schedules WHERE academy_id = target_academy_id
            );
            GET DIAGNOSTICS deleted_student_schedules = ROW_COUNT;
            total_deleted_student_schedules := total_deleted_student_schedules + deleted_student_schedules;
            
            -- 3. schedules 삭제 (트리거 비활성화 상태)
            DELETE FROM schedules WHERE academy_id = target_academy_id;
            GET DIAGNOSTICS deleted_schedules = ROW_COUNT;
            total_deleted_schedules := total_deleted_schedules + deleted_schedules;
            
            -- 4. instructors 삭제
            DELETE FROM instructors WHERE academy_id = target_academy_id;
            GET DIAGNOSTICS deleted_instructors = ROW_COUNT;
            total_deleted_instructors := total_deleted_instructors + deleted_instructors;
            
            -- 5. subjects 삭제
            DELETE FROM subjects WHERE academy_id = target_academy_id;
            GET DIAGNOSTICS deleted_subjects = ROW_COUNT;
            total_deleted_subjects := total_deleted_subjects + deleted_subjects;
            
            -- 6. classrooms 삭제
            DELETE FROM classrooms WHERE academy_id = target_academy_id;
            GET DIAGNOSTICS deleted_classrooms = ROW_COUNT;
            total_deleted_classrooms := total_deleted_classrooms + deleted_classrooms;
            
            -- 7. class_types 삭제
            DELETE FROM class_types WHERE academy_id = target_academy_id;
            GET DIAGNOSTICS deleted_class_types = ROW_COUNT;
            total_deleted_class_types := total_deleted_class_types + deleted_class_types;
            
            -- 8. users 삭제
            DELETE FROM users WHERE academy_id = target_academy_id;
            GET DIAGNOSTICS deleted_users = ROW_COUNT;
            total_deleted_users := total_deleted_users + deleted_users;
            
            -- 9. accounts 삭제
            DELETE FROM accounts WHERE academy_id = target_academy_id;
            GET DIAGNOSTICS deleted_accounts = ROW_COUNT;
            total_deleted_accounts := total_deleted_accounts + deleted_accounts;
            
            -- 10. 마지막으로 academies 삭제
            DELETE FROM academies WHERE id = target_academy_id;
            
            deleted_count := deleted_count + 1;
            RAISE NOTICE '✅ "%"(ID: %) 삭제 완료 - 이력:%, 학생수강:%, 시간표:%, 강사:%, 과목:%, 강의실:%, 수업유형:%, 사용자:%, 계정:%', 
                         academy_code, target_academy_id, deleted_history, deleted_student_schedules, deleted_schedules, 
                         deleted_instructors, deleted_subjects, deleted_classrooms, deleted_class_types, deleted_users, deleted_accounts;
        ELSE
            RAISE NOTICE '⚠️ "%": 이미 삭제됨 또는 존재하지 않음', academy_code;
        END IF;
    END LOOP;
    
    -- 트리거 재활성화
    ALTER TABLE schedules ENABLE TRIGGER schedules_history_trigger;
    ALTER TABLE student_schedules ENABLE TRIGGER student_schedules_count_trigger;
    RAISE NOTICE '✅ 트리거 재활성화 완료';
    
    RAISE NOTICE '=== 삭제 완료 ===';
    RAISE NOTICE '총 % 개의 테스트 학원이 안전하게 삭제되었습니다.', deleted_count;
    RAISE NOTICE '전체 삭제 통계:';
    RAISE NOTICE '- 시간표 이력: % 개', total_deleted_history;
    RAISE NOTICE '- 학생 수강: % 개', total_deleted_student_schedules;
    RAISE NOTICE '- 시간표: % 개', total_deleted_schedules;
    RAISE NOTICE '- 강사: % 개', total_deleted_instructors;
    RAISE NOTICE '- 과목: % 개', total_deleted_subjects;
    RAISE NOTICE '- 강의실: % 개', total_deleted_classrooms;
    RAISE NOTICE '- 수업유형: % 개', total_deleted_class_types;
    RAISE NOTICE '- 사용자: % 개', total_deleted_users;
    RAISE NOTICE '- 계정: % 개', total_deleted_accounts;
    RAISE NOTICE '트리거 비활성화/재활성화로 문제가 완전히 해결되었습니다.';
    
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