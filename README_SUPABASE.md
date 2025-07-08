# 🚀 Supabase 마이그레이션 가이드

## 📋 개요

이 문서는 학원 시간표 관리 시스템을 Supabase로 마이그레이션하는 과정을 안내합니다.

## 🗂 마이그레이션 파일 구조

```
supabase/
├── config.toml                           # Supabase 로컬 설정
└── migrations/
    ├── 0001_create_initial_schema.sql     # 기본 스키마 및 테이블 생성
    ├── 0002_enable_rls_policies.sql       # Row Level Security 정책
    ├── 0003_create_functions_and_triggers.sql # 함수 및 트리거
    └── 0004_seed_sample_data.sql          # 샘플 데이터 (옵션)
```

## 🏗 마이그레이션 실행 순서

### 1단계: Supabase 프로젝트 생성

1. **Supabase 대시보드에서 새 프로젝트 생성**
   - [https://app.supabase.com](https://app.supabase.com) 접속
   - "New Project" 클릭
   - 프로젝트명: `acatable` (또는 원하는 이름)
   - 데이터베이스 비밀번호 설정

2. **연결 정보 확인**
   ```
   Project URL: https://your-project-id.supabase.co
   API Key (anon): your-anon-key
   API Key (service_role): your-service-role-key
   Database URL: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```

### 2단계: 환경 변수 설정

1. `.env` 파일 생성 (`.env.example` 참고)
   ```bash
   cp .env.example .env
   ```

2. `.env` 파일에 실제 값 입력
   ```bash
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
   SUPABASE_URL="https://[PROJECT_ID].supabase.co"
   SUPABASE_ANON_KEY="[ANON_KEY]"
   SUPABASE_SERVICE_ROLE_KEY="[SERVICE_KEY]"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

### 3단계: 마이그레이션 실행

#### Option A: Supabase CLI 사용 (권장)

1. **Supabase CLI 설치**
   ```bash
   npm install -g supabase
   ```

2. **로그인 및 프로젝트 연결**
   ```bash
   supabase login
   supabase link --project-ref your-project-id
   ```

3. **마이그레이션 실행**
   ```bash
   supabase db push
   ```

#### Option B: SQL 직접 실행

1. **Supabase 대시보드 > SQL Editor**에서 순서대로 실행:
   - `0001_create_initial_schema.sql`
   - `0002_enable_rls_policies.sql`
   - `0003_create_functions_and_triggers.sql`
   - `0004_seed_sample_data.sql` (선택사항)

### 4단계: Prisma 클라이언트 업데이트

```bash
# Prisma 클라이언트 재생성
npx prisma generate

# 데이터베이스 연결 확인
npx prisma db push
```

### 5단계: 애플리케이션 테스트

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000 접속하여 확인
```

## 🔒 보안 기능

### Row Level Security (RLS)

- **학원별 데이터 격리**: 각 학원은 자신의 데이터만 접근 가능
- **역할 기반 접근 제어**: OWNER, ADMIN, INSTRUCTOR, STUDENT별 권한 차등
- **세밀한 권한 제어**: 테이블별, 작업별 세부 권한 설정

### 주요 정책

1. **accounts**: 사용자는 자신의 계정만 관리
2. **academies**: 모든 사용자 조회 가능, 소유자만 수정
3. **users**: 같은 학원 내 사용자만 조회
4. **schedules**: 관리자 및 해당 강사만 수정
5. **student_schedules**: 학생 본인 또는 관리자만 관리

## 🛠 자동화 기능

### 트리거 및 함수

1. **updated_at 자동 업데이트**: 모든 테이블의 수정 시간 자동 관리
2. **시간표 변경 이력**: 시간표 변경 사항 자동 기록
3. **수강 인원 자동 계산**: 학생 등록/탈퇴 시 자동 업데이트
4. **시간 충돌 검사**: 강사/강의실 시간 중복 검증
5. **학원 통계**: 실시간 통계 정보 제공

## 📊 샘플 데이터

### 포함된 샘플 데이터

- **학원**: 와이즈과학학원
- **사용자**: 원장 1명, 강사 3명
- **과목**: 수학, 영어, 과학, 국어
- **강의실**: 4개 강의실
- **시간표**: 9개 수업 일정

### 샘플 데이터 제거

프로덕션 환경에서는 다음 SQL로 샘플 데이터 제거:

```sql
-- 샘플 데이터 삭제 (순서 중요)
DELETE FROM schedule_history WHERE schedule_id LIKE 'schedule-%';
DELETE FROM student_schedules WHERE schedule_id LIKE 'schedule-%';
DELETE FROM schedules WHERE id LIKE 'schedule-%';
DELETE FROM class_types WHERE id LIKE 'classtype-%';
DELETE FROM classrooms WHERE id LIKE 'classroom-%';
DELETE FROM instructors WHERE id LIKE 'instructor-%';
DELETE FROM subjects WHERE id LIKE 'subject-%';
DELETE FROM users WHERE id LIKE 'user-%';
DELETE FROM accounts WHERE id LIKE 'account-%';
DELETE FROM academies WHERE id = 'demo-academy';
```

## 🚨 중요 사항

### 보안

- **비밀번호**: 반드시 bcrypt 등으로 해싱하여 저장
- **환경 변수**: `.env` 파일을 Git에 커밋하지 말 것
- **API 키**: 클라이언트에서는 anon key만 사용

### 성능

- **인덱스**: 자주 조회하는 컬럼에 적절한 인덱스 설정됨
- **RLS**: 성능에 영향을 줄 수 있으므로 쿼리 최적화 필요
- **연결 풀링**: 프로덕션에서는 연결 풀링 고려

### 백업

- **자동 백업**: Supabase Pro 플랜에서 자동 백업 제공
- **Point-in-Time Recovery**: 특정 시점으로 복구 가능
- **수동 백업**: 중요한 변경 전 수동 백업 권장

## 📞 지원

### 문제 해결

1. **연결 오류**: DATABASE_URL 및 Supabase 설정 확인
2. **권한 오류**: RLS 정책 및 사용자 역할 확인
3. **마이그레이션 실패**: SQL 파일 순서 및 문법 확인

### 유용한 명령어

```bash
# Supabase 상태 확인
supabase status

# 로컬 개발 환경 시작
supabase start

# 마이그레이션 상태 확인
supabase migration list

# 새 마이그레이션 생성
supabase migration new migration_name
```

---

**성공적인 마이그레이션을 위해 단계별로 신중히 진행하세요!** 🎉