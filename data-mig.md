# 📊 데이터베이스 구조 및 Supabase 마이그레이션 종합 검토 보고서

> **작성일**: 2024년 12월  
> **프로젝트**: 우리학원시간표 (Acatable)  
> **버전**: v1.3.6  

## 🔍 현재 데이터베이스 구조 분석

### **현재 상황**
- **데이터베이스**: SQLite (개발용)
- **ORM**: Prisma 6.1.0
- **스키마 상태**: 잘 설계된 관계형 구조
- **마이그레이션 파일**: 없음 (SQLite 기반)

### **데이터베이스 스키마 구조**

#### 📋 **핵심 테이블 (9개)**
1. **Academy** - 학원 정보 (루트 엔티티)
2. **User** - 사용자 정보 (4가지 역할)
3. **Subject** - 과목 정보
4. **Instructor** - 강사 프로필
5. **Classroom** - 강의실 정보
6. **ClassType** - 수업 유형
7. **Schedule** - 메인 시간표 (핵심)
8. **StudentSchedule** - 학생 수강 신청
9. **ScheduleHistory** - 변경 이력

#### 🔗 **관계 설계 평가**
- ✅ **우수한 정규화**: 적절한 1:N, N:M 관계 설계
- ✅ **CASCADE 삭제**: 데이터 무결성 보장
- ✅ **인덱스 최적화**: 성능을 위한 복합 인덱스 설정
- ✅ **권한 체계**: RBAC (Role-Based Access Control) 구현

#### 📊 **데이터 타입 분석**
```sql
-- 시간 데이터: String (HH:MM) - PostgreSQL TIME으로 변환 가능
startTime   String    -- "14:00"
endTime     String    -- "16:30"

-- JSON 데이터: String - PostgreSQL JSONB로 최적화 가능
specialties String    -- JSON 문자열
equipment   String    -- JSON 문자열

-- 열거형: 적절히 설계됨
enum UserRole { OWNER, ADMIN, INSTRUCTOR, STUDENT }
enum DayOfWeek { MONDAY, TUESDAY, ... }
```

#### 🏗️ **현재 스키마 구조도**
```
Academy (루트)
├── User (사용자 관리)
│   ├── Instructor (강사 프로필)
│   └── StudentSchedule (수강 신청)
├── Subject (과목)
├── Classroom (강의실)
├── ClassType (수업 유형)
└── Schedule (시간표 - 중심)
    ├── StudentSchedule (N:M 관계)
    └── ScheduleHistory (변경 이력)
```

---

## 🚀 Supabase 마이그레이션 필요성 평가

### **✅ 마이그레이션이 필요한 이유**

#### 1. **프로덕션 준비성**
- **현재**: SQLite (단일 파일, 개발용)
- **필요**: PostgreSQL (다중 사용자, 확장성)

#### 2. **Supabase 장점 활용**
- **실시간 기능**: 시간표 변경 시 즉시 반영
- **Row Level Security**: 학원별 데이터 격리
- **자동 API**: REST/GraphQL 자동 생성
- **인증 통합**: Supabase Auth 활용 가능
- **백업/복구**: 자동 백업 및 Point-in-Time Recovery

#### 3. **성능 및 확장성**
- **동시 접속**: 현재 제한적 → 수천 명 지원
- **인덱스 최적화**: PostgreSQL 고급 인덱스 활용
- **쿼리 성능**: 복잡한 JOIN 쿼리 최적화

#### 4. **운영 효율성**
- **관리 부담 감소**: 인프라 관리 자동화
- **모니터링**: 실시간 성능 모니터링
- **확장성**: 트래픽 증가에 따른 자동 스케일링

---

## 📋 마이그레이션 실행 계획

### **Phase 1: 준비 단계 (1-2일)**

#### 1.1 Supabase 프로젝트 설정
```bash
# Supabase CLI 설치
npm install -g supabase

# Supabase 프로젝트 생성
supabase projects create acatable

# 로컬 개발 환경 설정
npm install @supabase/supabase-js
```

#### 1.2 스키마 변환 작업
```prisma
// prisma/schema.prisma 수정

// 현재 SQLite 설정
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

// 변경될 PostgreSQL 설정
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### 1.3 데이터 타입 최적화 검토
```prisma
// 개선 가능한 부분들 (선택사항)
model Schedule {
  // 현재: String 타입
  startTime   String    // "14:00"
  endTime     String    // "16:30"
  
  // 개선안: Time 타입 (PostgreSQL 최적화)
  // startTime   DateTime  @db.Time
  // endTime     DateTime  @db.Time
}

model Instructor {
  // 현재: String 타입 (JSON 문자열)
  specialties String
  
  // 개선안: Json 타입
  // specialties Json
}
```

### **Phase 2: 스키마 마이그레이션 (1일)**

#### 2.1 Prisma 마이그레이션 생성
```bash
# 환경 변수 설정
export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# 새로운 마이그레이션 생성
npx prisma migrate dev --name init_supabase

# Supabase에 스키마 푸시
npx prisma db push

# Prisma 클라이언트 재생성
npx prisma generate
```

#### 2.2 Row Level Security 설정 (선택사항)
```sql
-- 학원별 데이터 격리
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their academy schedules" ON schedules
  FOR SELECT USING (academy_id = current_setting('app.current_academy_id'));

-- 사용자별 권한 설정
CREATE POLICY "Instructors can edit their schedules" ON schedules
  FOR UPDATE USING (instructor_id = current_setting('app.current_user_id'));
```

### **Phase 3: 데이터 마이그레이션 (1일)**

#### 3.1 기존 데이터 백업 및 내보내기
```bash
# SQLite 데이터 백업
cp prisma/dev.db prisma/dev_backup.db

# 데이터 덤프 (참고용)
sqlite3 prisma/dev.db ".dump" > data_dump.sql
```

#### 3.2 Supabase로 데이터 이전 방법

**방법 1: Supabase Migration Tool (권장)**
```bash
# Google Colab 사용
# 1. Supabase Migration Tool 접속
# 2. SQLite 소스 설정
# 3. Supabase 대상 설정
# 4. 마이그레이션 실행
```

**방법 2: 커스텀 스크립트**
```javascript
// scripts/migrate-to-supabase.js
const { PrismaClient: SQLitePrisma } = require('@prisma/client')
const { PrismaClient: PostgresPrisma } = require('@prisma/client')

const sqliteDb = new SQLitePrisma({
  datasources: { db: { url: 'file:./dev.db' } }
})

const postgresDb = new PostgresPrisma({
  datasources: { db: { url: process.env.DATABASE_URL } }
})

async function migrateData() {
  // 1. Academy 데이터 마이그레이션
  // 2. User 데이터 마이그레이션  
  // 3. 관련 테이블 순차 마이그레이션
}
```

### **Phase 4: 애플리케이션 업데이트 (1일)**

#### 4.1 환경 변수 설정
```bash
# .env 파일 업데이트
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
SUPABASE_URL="https://[PROJECT_ID].supabase.co"
SUPABASE_ANON_KEY="[ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_KEY]"
```

#### 4.2 애플리케이션 코드 업데이트
```typescript
// src/lib/supabase.ts (새로 생성)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

#### 4.3 Prisma 클라이언트 재생성 및 테스트
```bash
# Prisma 클라이언트 재생성
npx prisma generate

# 연결 테스트
npm run dev
```

---

## ⚠️ 마이그레이션 리스크 및 대응방안

### **높은 우선순위 리스크**

#### 1. **시간 데이터 형식 호환성**
- **리스크**: `String` 형식 시간 데이터 PostgreSQL 호환성
- **현재**: `"14:00"`, `"16:30"` 문자열 형식
- **대응**: 현재 형식 유지 (PostgreSQL에서도 정상 동작)
- **검증**: 마이그레이션 후 시간 계산 로직 테스트

#### 2. **JSON 데이터 호환성**
- **리스크**: `specialties`, `equipment` JSON 파싱 오류
- **대응**: 
  ```javascript
  // 안전한 JSON 파싱 유틸리티 추가
  function safeParseJSON(jsonString, defaultValue = []) {
    try {
      return JSON.parse(jsonString || '[]')
    } catch {
      return defaultValue
    }
  }
  ```

#### 3. **인덱스 성능 차이**
- **리스크**: SQLite vs PostgreSQL 인덱스 성능 차이
- **대응**: 
  - 복합 인덱스 성능 모니터링
  - 필요시 PostgreSQL 최적화된 인덱스 추가

### **중간 우선순위 리스크**

#### 4. **애플리케이션 다운타임**
- **리스크**: 마이그레이션 중 서비스 중단
- **대응**: 
  - 새벽 시간대 마이그레이션 실행
  - Blue-Green 배포 고려
  - 롤백 계획 준비

#### 5. **데이터 일관성**
- **리스크**: 마이그레이션 중 데이터 불일치
- **대응**: 
  - 트랜잭션 기반 마이그레이션
  - 마이그레이션 후 데이터 검증 스크립트 실행

#### 6. **연결 문자열 변경**
- **리스크**: 환경별 DATABASE_URL 설정 실수
- **대응**: 
  - 환경별 설정 파일 분리
  - CI/CD 파이프라인에서 자동 검증

---

## 💰 비용 및 리소스 분석

### **Supabase 요금 구조**
- **Free Tier**: 
  - 최대 500MB 데이터베이스
  - 2개 프로젝트
  - 50,000 월간 활성 사용자
  - 500MB 스토리지
  
- **Pro Tier ($25/월)**:
  - 8GB 데이터베이스 (확장 가능)
  - 무제한 프로젝트
  - 100,000 월간 활성 사용자
  - 100GB 스토리지
  - 일일 백업
  
- **Team Tier ($599/월)**:
  - 엔터프라이즈 기능
  - SSO, 감사 로그
  - 우선 지원

### **권장 설정**
- **개발/테스트**: Free Tier (충분)
- **프로덕션**: Pro Tier (확장성 고려)
- **예상 비용**: 월 $25 (초기 단계)

### **비용 절약 방안**
- 개발 환경은 Free Tier 활용
- 프로덕션만 Pro Tier 사용
- 사용량 모니터링으로 비용 최적화

---

## 📊 성능 비교 예상

### **현재 (SQLite) vs 마이그레이션 후 (PostgreSQL)**

| 항목 | SQLite | PostgreSQL + Supabase |
|------|--------|----------------------|
| 동시 연결 | 제한적 (1 writer) | 수천 개 |
| 백업 | 수동 파일 복사 | 자동 백업 |
| 확장성 | 단일 서버 | 클라우드 스케일링 |
| 실시간 기능 | 없음 | WebSocket 지원 |
| API | 수동 구현 | 자동 생성 |
| 보안 | 파일 레벨 | Row Level Security |
| 모니터링 | 제한적 | 실시간 대시보드 |

---

## 🎯 최종 권장사항

### **✅ 마이그레이션 강력 권장**

#### **즉시 실행 이유**
1. **프로덕션 준비**: SQLite는 프로덕션 부적합
2. **확장성**: 다중 사용자 지원 필수
3. **실시간 기능**: 시간표 실시간 업데이트 요구사항
4. **데이터 안정성**: 백업, 복구, 고가용성
5. **개발 효율성**: 자동 API, 실시간 기능

#### **마이그레이션 순서**
1. **1단계**: Supabase 프로젝트 설정 및 스키마 변환
2. **2단계**: 테스트 환경에서 마이그레이션 검증
3. **3단계**: 프로덕션 마이그레이션 실행
4. **4단계**: 성능 모니터링 및 최적화

#### **예상 소요 시간**
- **전체**: 4-5일 (설정, 테스트, 배포 포함)
- **실제 마이그레이션**: 1-2시간 (데이터 크기에 따라)
- **검증 및 테스트**: 1-2일

### **🚨 주의사항**
- 마이그레이션 전 **전체 백업** 필수
- **점진적 테스트**를 통한 검증
- **롤백 계획** 사전 준비
- **팀 내 공유** 및 일정 조율

### **📝 체크리스트**

#### **마이그레이션 전**
- [ ] Supabase 프로젝트 생성
- [ ] 환경 변수 설정 준비
- [ ] 기존 데이터 백업
- [ ] 팀 내 일정 공유

#### **마이그레이션 중**
- [ ] 스키마 마이그레이션 실행
- [ ] 데이터 마이그레이션 실행
- [ ] 연결 테스트
- [ ] 기능 검증

#### **마이그레이션 후**
- [ ] 성능 모니터링
- [ ] 사용자 테스트
- [ ] 백업 설정 확인
- [ ] 문서 업데이트

---

## 📞 지원 및 문의

### **Supabase 공식 리소스**
- **문서**: https://supabase.com/docs
- **마이그레이션 가이드**: https://supabase.com/docs/guides/platform/migrating-to-supabase
- **커뮤니티**: https://github.com/supabase/supabase/discussions

### **추가 지원 필요 시**
- Supabase 지원팀 문의
- 커뮤니티 포럼 활용
- 공식 Discord 채널 참여

---

**결론**: 현재 데이터베이스 구조는 잘 설계되어 있어 Supabase 마이그레이션에 최적화되어 있습니다. 프로덕션 서비스를 위해 **즉시 마이그레이션을 진행하는 것을 강력히 권장**합니다.

---

*마지막 업데이트: 2024년 12월*  
*문서 버전: 1.0* 