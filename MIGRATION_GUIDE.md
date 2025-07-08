# 이메일 선택사항 마이그레이션 가이드

## 🎯 목적
사용자 테이블의 email 컬럼을 필수에서 선택사항으로 변경

## 📋 실행 방법

### 방법 1: Supabase Dashboard에서 실행 (권장)

1. **Supabase Dashboard 접속**
   - [supabase.com](https://supabase.com) 로그인
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 좌측 메뉴에서 "SQL Editor" 클릭
   - "New query" 클릭

3. **마이그레이션 SQL 실행**
   ```sql
   -- 이메일을 선택사항으로 변경
   BEGIN;
   
   -- NOT NULL 제약 조건 제거
   ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
   
   -- UNIQUE 제약 조건 재생성 (NULL 값 허용)
   CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique 
   ON users (email) 
   WHERE email IS NOT NULL;
   
   COMMIT;
   ```

4. **실행**
   - "Run" 버튼 클릭
   - 성공 메시지 확인

### 방법 2: 로컬에서 실행 (개발환경)

```bash
# 환경 변수 설정 후
npm run db:migrate
```

## ✅ 마이그레이션 후 확인

```sql
-- 테이블 구조 확인
\d users;

-- 또는
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'email';
```

## 🔄 롤백 방법 (필요시)

```sql
-- 이메일을 다시 필수로 만들기 (주의: 이메일이 NULL인 데이터가 있으면 실패)
BEGIN;

-- 먼저 NULL 값 정리 (필요시)
UPDATE users SET email = 'temp_' || id || '@example.com' WHERE email IS NULL;

-- NOT NULL 제약 조건 추가
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- 기존 인덱스 삭제
DROP INDEX IF EXISTS idx_users_email_unique;

COMMIT;
```

## 📌 주의사항

1. **백업 권장**: 마이그레이션 전 데이터 백업
2. **테스트 환경 우선**: 운영 환경 적용 전 테스트 환경에서 실행
3. **기존 데이터**: 기존 사용자들의 이메일 데이터는 그대로 유지됨
4. **애플리케이션 호환성**: 이메일이 NULL일 수 있음을 고려한 로직 확인