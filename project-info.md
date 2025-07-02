# 프로젝트 NZ79 - 우리학원시간표

## 프로젝트 정보
- **이름**: acatable (Academy Schedule)
- **목적**: 학원 시간표 관리 시스템
- **기술스택**: Next.js 14 + TypeScript + Tailwind CSS + Prisma ORM + SQLite

## 개발 명령어
```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 린팅
npm run lint

# 데이터베이스
npm run db:generate     # Prisma 클라이언트 생성
npm run db:push         # 스키마 푸시
npm run db:migrate      # 마이그레이션 실행
npm run db:studio       # Prisma Studio 실행
npm run db:seed         # 샘플 데이터 생성
npm run db:seed:clean   # 데이터 초기화 후 샘플 데이터 생성
```

## 완료된 작업 (Tasks)

### ✅ T-003: 시간표 입력/관리 페이지(관리자) HTML 구조 및 반응형 마크업 구현
- 주간 그리드 컴포넌트 구조 설계
- 시간표 입력 폼 컴포넌트 구현
- 반응형 레이아웃 적용 (PC/태블릿/모바일)
- ARIA 및 접근성 기능 구현
- 키보드 내비게이션 지원

### ✅ T-004: 시간표 입력/관리 UI의 인터랙션 및 상태 관리 구현(관리자)
- 입력 폼 상태 및 리스트 상태 관리 개선
- 실시간 입력값 검증 (중복/충돌 감지)
- 저장/수정/삭제 이벤트 핸들러 구현
- 에러 및 경고 메시지 처리
- UX 개선 및 로딩 상태 처리

## 현재 프로젝트 구조

### 주요 컴포넌트
```
src/
├── app/
│   ├── admin/schedule/page.tsx     # 관리자 시간표 관리 페이지
│   ├── api/schedules/              # 시간표 API 라우트
│   └── layout.tsx                  # 메인 레이아웃
├── components/
│   ├── schedule/
│   │   ├── ScheduleGrid.tsx        # 시간표 그리드 뷰
│   │   └── ScheduleForm.tsx        # 시간표 입력/수정 폼
│   └── ui/
│       ├── Button.tsx              # 버튼 컴포넌트
│       └── Card.tsx                # 카드 컴포넌트
└── lib/
    ├── prisma.ts                   # Prisma 클라이언트
    └── utils/schedule-conflict.ts  # 시간표 충돌 검증
```

### 주요 기능
1. **시간표 CRUD**: 생성, 조회, 수정, 삭제
2. **실시간 충돌 감지**: 강사/강의실 시간 중복 검증
3. **반응형 UI**: 데스크톱/태블릿/모바일 대응
4. **필터링**: 요일, 강사, 강의실, 과목별 필터
5. **접근성**: ARIA, 키보드 내비게이션, 스크린리더 지원

## 진행 중인 작업

### 🔄 인증 시스템
- 현재 academyId가 하드코딩됨 (`demo-academy`)
- NextAuth.js 구현 필요
- 사용자 역할별 권한 관리 필요

### 🔄 API 완성
- 미완성 API 라우트: academies, auth, class-types, instructors
- 실제 데이터 연동 (현재 TODO 주석 처리됨)

### 🔄 추가 기능
- 시간표 충돌 검증 API (`/api/schedules/validate`) 구현 필요
- 사용자 ID 추적 (현재 'system'으로 하드코딩됨)

## 데이터베이스 스키마
- **Academy**: 학원 정보
- **User**: 사용자 (원장/행정실장/강사/학생)
- **Subject**: 과목
- **Instructor**: 강사 프로필
- **Classroom**: 강의실
- **ClassType**: 수업 유형
- **Schedule**: 시간표 (메인)
- **StudentSchedule**: 학생 수강 신청
- **ScheduleHistory**: 변경 이력

## 개발 시 주의사항
1. **academyId**: 현재 'demo-academy'로 하드코딩됨
2. **충돌 검증**: 실시간 API 호출하므로 디바운스 적용됨 (500ms)
3. **반응형**: lg(1024px) / md(768px) / sm(640px) 브레이크포인트 사용
4. **접근성**: 모든 인터랙티브 요소에 적절한 ARIA 속성 적용

## 다음 우선순위
1. 시간표 충돌 검증 API 구현
2. 실제 강사/강의실/과목 데이터 연동
3. 인증 시스템 구현
4. 사용자 권한별 UI 분기