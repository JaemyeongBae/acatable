# 데이터베이스 학원 삭제 가이드

## 🚨 중요 사항
**학원 삭제는 관련된 모든 데이터가 함께 삭제되므로 신중하게 진행해야 합니다.**

## 💡 CASCADE 삭제 자동화
**좋은 소식**: 데이터베이스에 `ON DELETE CASCADE` 제약조건이 설정되어 있어서 `academies` 테이블만 삭제하면 관련된 모든 테이블의 데이터가 자동으로 삭제됩니다!

### 자동 삭제되는 테이블들:
- ✅ `accounts` (계정 정보)
- ✅ `users` (사용자 정보)  
- ✅ `instructors` (강사 정보)
- ✅ `subjects` (과목 정보)
- ✅ `classrooms` (강의실 정보)
- ✅ `class_types` (수업 유형)
- ✅ `schedules` (시간표)
- ✅ `student_schedules` (학생 수강 정보)
- ✅ `schedule_history` (시간표 이력)

## 🛠️ Supabase SQL Editor 전용 스크립트 (권장)

### 📁 scripts/delete-single-academy-supabase.sql
**단일 학원 삭제용** - Supabase에서 바로 사용 가능
```sql
-- 사용법: 학원 코드만 변경하고 실행
target_academy_code TEXT := 'testaca';  -- 여기만 수정
```

### 📁 scripts/delete-test-academies-supabase.sql  
**테스트 계정 일괄 삭제용** - Supabase에서 바로 실행
- testaca, newtest, demo001 계정을 한 번에 삭제
- 바로 실행 가능 (수정 불필요)

## 🎯 권장 사용법

### 1️⃣ **Supabase SQL Editor 사용 (가장 간편)**
1. Supabase Dashboard → SQL Editor 접속
2. `scripts/delete-single-academy-supabase.sql` 내용 복사
3. 학원 코드 수정: `target_academy_code TEXT := '삭제할코드';`
4. 실행 버튼 클릭

### 2️⃣ **psql 클라이언트 사용**
1. `scripts/delete-single-academy.sql` 사용
2. `\set academy_code '삭제할코드'` 수정
3. psql에서 실행

## ❌ 오류 해결

### 문제: `syntax error at or near "\"`
**원인**: Supabase SQL Editor는 `\set` 명령어를 지원하지 않음  
**해결**: `-supabase.sql` 버전 사용

### 문제: `insert or update on table "schedule_history" violates foreign key constraint`
**원인**: `schedule_history` 트리거가 삭제 시에도 이력을 생성하려고 하는데, CASCADE 삭제 과정에서 `schedules` 테이블이 먼저 삭제되어 외래키 제약조건 위반 발생  
**해결**: 트리거 일시 비활성화 방법 적용

#### 🔧 트리거 문제 해결 방법:
1. **트리거 비활성화**: `schedules_history_trigger`, `student_schedules_count_trigger` 일시 중지
2. **schedule_history** 먼저 삭제 (안전한 상태)
3. **student_schedules** 삭제
4. **schedules** 삭제 (트리거 비활성화 상태에서 안전)
5. **트리거 재활성화**: 정상 작동 복구
6. 나머지 테이블들 순차 삭제
7. **academies** 마지막 삭제

#### 💡 트리거 제어 명령어:
```sql
-- 트리거 비활성화
ALTER TABLE schedules DISABLE TRIGGER schedules_history_trigger;
ALTER TABLE student_schedules DISABLE TRIGGER student_schedules_count_trigger;

-- 안전한 삭제 작업 수행...

-- 트리거 재활성화
ALTER TABLE schedules ENABLE TRIGGER schedules_history_trigger;
ALTER TABLE student_schedules ENABLE TRIGGER student_schedules_count_trigger;
```

### 문제: 테이블 관계 복잡성
**해결됨**: 수동 삭제 순서로 안전하게 처리  
**결과**: 트리거 문제 없이 모든 관련 데이터 완전 삭제

## 방법 1: academyCode 기반 삭제 (권장 - 개선됨)

### 🎯 간편한 학원 코드 기반 삭제

```sql
-- psql 내장 변수 설정 (학원 코드만 수정하면 됨)
\set academy_code 'demo001'

BEGIN;

-- 학원 ID 조회 (한 번만)
WITH academy_info AS (
  SELECT id as academy_id FROM academies WHERE code = :'academy_code'
)

-- 1. 학생 수강 정보 삭제
DELETE FROM student_schedules
WHERE schedule_id IN (
  SELECT s.id FROM schedules s, academy_info ai
  WHERE s.academy_id = ai.academy_id
);

-- 2. 시간표 이력 삭제  
DELETE FROM schedule_history
WHERE schedule_id IN (
  SELECT s.id FROM schedules s, academy_info ai
  WHERE s.academy_id = ai.academy_id
);

-- 3. 시간표 삭제
DELETE FROM schedules
WHERE academy_id = (SELECT id FROM academies WHERE code = :'academy_code');

-- 4. 강사 정보 삭제
DELETE FROM instructors
WHERE academy_id = (SELECT id FROM academies WHERE code = :'academy_code');

-- 5. 과목 삭제
DELETE FROM subjects
WHERE academy_id = (SELECT id FROM academies WHERE code = :'academy_code');

-- 6. 강의실 삭제
DELETE FROM classrooms
WHERE academy_id = (SELECT id FROM academies WHERE code = :'academy_code');

-- 7. 수업 유형 삭제
DELETE FROM class_types
WHERE academy_id = (SELECT id FROM academies WHERE code = :'academy_code');

-- 8. 사용자 삭제
DELETE FROM users
WHERE academy_id = (SELECT id FROM academies WHERE code = :'academy_code');

-- 9. 계정 정보 삭제 (추가됨)
DELETE FROM accounts
WHERE academy_id = (SELECT id FROM academies WHERE code = :'academy_code');

-- 10. 마지막으로 학원 삭제
DELETE FROM academies
WHERE code = :'academy_code';

COMMIT;
```

### 📝 사용자 코드 개선사항

### ✅ 원래 코드의 장점
- `academyCode` 기반 접근 방식 ✨
- psql 변수 사용으로 재사용성 확보
- 트랜잭션 사용으로 안전성 보장

### 🔧 개선된 부분
1. **accounts 테이블 삭제 추가**: 누락되었던 계정 정보 삭제
2. **삭제 순서 최적화**: 외래 키 제약 조건 고려
3. **에러 처리 강화**: 존재하지 않는 학원 코드 처리
4. **상세 로깅**: 삭제 진행 상황 실시간 확인
5. **삭제 전후 확인**: 데이터 상태 검증

### 🎯 최종 권장 방법

**간단한 삭제**:
```sql
\set academy_code 'your_academy_code'
-- scripts/delete-single-academy.sql 사용
```

**원본 코드 스타일 (개선됨)**:
```sql
\set academy_code 'demo001'

BEGIN;

DELETE FROM student_schedules
WHERE schedule_id IN (
  SELECT id FROM schedules 
  WHERE academy_id = (SELECT id FROM academies WHERE code = :'academy_code')
);

DELETE FROM schedule_history
WHERE schedule_id IN (
  SELECT id FROM schedules 
  WHERE academy_id = (SELECT id FROM academies WHERE code = :'academy_code')
);

DELETE FROM schedules
WHERE academy_id = (SELECT id FROM academies WHERE code = :'academy_code');

DELETE FROM instructors
WHERE academy_id = (SELECT id FROM academies WHERE code = :'academy_code');

DELETE FROM subjects
WHERE academy_id = (SELECT id FROM academies WHERE code = :'academy_code');

DELETE FROM classrooms
WHERE academy_id = (SELECT id FROM academies WHERE code = :'academy_code');

DELETE FROM class_types
WHERE academy_id = (SELECT id FROM academies WHERE code = :'academy_code');

DELETE FROM users
WHERE academy_id = (SELECT id FROM academies WHERE code = :'academy_code');

-- 🆕 추가: 계정 정보 삭제
DELETE FROM accounts
WHERE academy_id = (SELECT id FROM academies WHERE code = :'academy_code');

DELETE FROM academies
WHERE code = :'academy_code';

COMMIT;
```

### 📝 사용법
1. 위 SQL에서 `\set academy_code 'demo001'` 부분의 `demo001`을 삭제하고 싶은 학원 코드로 변경
2. Supabase SQL Editor에서 실행

### 🔥 한 줄 버전 (빠른 삭제)
```sql
-- 학원 코드만 변경하세요
\set academy_code 'demo001'

DO $$
DECLARE
    target_academy_id TEXT;
BEGIN
    -- 학원 ID 조회
    SELECT id INTO target_academy_id FROM academies WHERE code = :'academy_code';
    
    IF target_academy_id IS NULL THEN
        RAISE NOTICE '학원 코드 % 를 찾을 수 없습니다.', :'academy_code';
        RETURN;
    END IF;
    
    RAISE NOTICE '학원 삭제 시작: % (ID: %)', :'academy_code', target_academy_id;
    
    -- 순서대로 삭제
    DELETE FROM student_schedules WHERE schedule_id IN (SELECT id FROM schedules WHERE academy_id = target_academy_id);
    DELETE FROM schedule_history WHERE schedule_id IN (SELECT id FROM schedules WHERE academy_id = target_academy_id);
    DELETE FROM schedules WHERE academy_id = target_academy_id;
    DELETE FROM instructors WHERE academy_id = target_academy_id;
    DELETE FROM subjects WHERE academy_id = target_academy_id;
    DELETE FROM classrooms WHERE academy_id = target_academy_id;
    DELETE FROM class_types WHERE academy_id = target_academy_id;
    DELETE FROM users WHERE academy_id = target_academy_id;
    DELETE FROM accounts WHERE academy_id = target_academy_id;
    DELETE FROM academies WHERE id = target_academy_id;
    
    RAISE NOTICE '학원 삭제 완료: %', :'academy_code';
END $$;
```

## 방법 2: 기존 academy_id 기반 삭제

### 단계별 삭제 순서 (중요!)

1. **관련 데이터 먼저 삭제** (외래 키 제약 조건 때문)
   ```sql
   -- 1. 학생 수강 정보 삭제
   DELETE FROM student_schedules WHERE schedule_id IN (
     SELECT id FROM schedules WHERE academy_id = 'YOUR_ACADEMY_ID'
   );
   
   -- 2. 시간표 이력 삭제
   DELETE FROM schedule_history WHERE schedule_id IN (
     SELECT id FROM schedules WHERE academy_id = 'YOUR_ACADEMY_ID'
   );
   
   -- 3. 시간표 삭제
   DELETE FROM schedules WHERE academy_id = 'YOUR_ACADEMY_ID';
   
   -- 4. 강사 정보 삭제
   DELETE FROM instructors WHERE academy_id = 'YOUR_ACADEMY_ID';
   
   -- 5. 과목 삭제
   DELETE FROM subjects WHERE academy_id = 'YOUR_ACADEMY_ID';
   
   -- 6. 강의실 삭제  
   DELETE FROM classrooms WHERE academy_id = 'YOUR_ACADEMY_ID';
   
   -- 7. 수업 유형 삭제
   DELETE FROM class_types WHERE academy_id = 'YOUR_ACADEMY_ID';
   
   -- 8. 사용자 삭제
   DELETE FROM users WHERE academy_id = 'YOUR_ACADEMY_ID';
   
   -- 9. 계정 정보 삭제
   DELETE FROM accounts WHERE academy_id = 'YOUR_ACADEMY_ID';
   
   -- 10. 마지막으로 학원 삭제
   DELETE FROM academies WHERE id = 'YOUR_ACADEMY_ID';
   ```

## 방법 3: 소프트 삭제 (안전한 방법)

데이터를 완전히 삭제하지 않고 비활성화만 하는 방법:

```sql
-- 학원과 관련된 모든 데이터를 비활성화
UPDATE academies SET is_active = false WHERE id = 'YOUR_ACADEMY_ID';
UPDATE users SET is_active = false WHERE academy_id = 'YOUR_ACADEMY_ID';
UPDATE instructors SET is_active = false WHERE academy_id = 'YOUR_ACADEMY_ID';
UPDATE subjects SET is_active = false WHERE academy_id = 'YOUR_ACADEMY_ID';
UPDATE classrooms SET is_active = false WHERE academy_id = 'YOUR_ACADEMY_ID';
UPDATE class_types SET is_active = false WHERE academy_id = 'YOUR_ACADEMY_ID';
UPDATE schedules SET is_active = false WHERE academy_id = 'YOUR_ACADEMY_ID';
```

## 방법 4: 개발용 스크립트 작성

```typescript
// scripts/delete-academy.ts
import { supabase } from '@/lib/supabase'

async function deleteAcademy(academyId: string) {
  console.log(`학원 삭제 시작: ${academyId}`)
  
  try {
    // 순서대로 삭제
    await supabase.from('student_schedules').delete().in('schedule_id', 
      supabase.from('schedules').select('id').eq('academy_id', academyId)
    )
    
    await supabase.from('schedule_history').delete().in('schedule_id',
      supabase.from('schedules').select('id').eq('academy_id', academyId)
    )
    
    await supabase.from('schedules').delete().eq('academy_id', academyId)
    await supabase.from('instructors').delete().eq('academy_id', academyId)
    await supabase.from('subjects').delete().eq('academy_id', academyId)
    await supabase.from('classrooms').delete().eq('academy_id', academyId)
    await supabase.from('class_types').delete().eq('academy_id', academyId)
    await supabase.from('users').delete().eq('academy_id', academyId)
    await supabase.from('academies').delete().eq('id', academyId)
    
    console.log('학원 삭제 완료!')
  } catch (error) {
    console.error('삭제 중 오류:', error)
  }
}

// 사용법: deleteAcademy('academy_id_here')
```

## 🔍 학원 ID 찾는 방법

```sql
-- 모든 학원 조회
SELECT id, name, code FROM academies;

-- 특정 학원 코드로 찾기
SELECT id, name, code FROM academies WHERE code = 'YOUR_ACADEMY_CODE';
```

## ⚠️ 주의사항

1. **백업 권장**: 삭제 전 데이터 백업
2. **테스트 환경에서 먼저 실행**: 운영 환경 적용 전 테스트
3. **외래 키 제약 조건**: 순서를 지켜서 삭제해야 함
4. **복구 불가능**: 완전 삭제 시 데이터 복구 불가
5. **소프트 삭제 권장**: 가능하면 is_active = false로 비활성화

## 🛡️ 안전한 삭제를 위한 체크리스트

- [ ] 올바른 학원 ID 확인
- [ ] 삭제할 데이터 범위 확인  
- [ ] 백업 생성 (필요시)
- [ ] 테스트 환경에서 실행
- [ ] 삭제 순서 준수
- [ ] 삭제 후 확인

## 복구 방법

소프트 삭제한 경우에만 복구 가능:

```sql
-- 학원 및 관련 데이터 복구
UPDATE academies SET is_active = true WHERE id = 'YOUR_ACADEMY_ID';
UPDATE users SET is_active = true WHERE academy_id = 'YOUR_ACADEMY_ID';
-- ... 다른 테이블도 동일하게
```