# 우리학원시간표 (Academy Schedule)

학원 시간표를 한눈에 확인하고 관리할 수 있는 웹 서비스입니다.

## 🎯 주요 기능

- **시간표 관리**: 과목, 강사, 강의실, 수업종류별 시간표 생성 및 관리
- **다중 필터링**: 요일별, 강사별, 강의실별, 수업종류별 필터링
- **권한 관리**: 원장, 행정실장, 강사, 학생별 차등 권한
- **실시간 충돌 감지**: 강사/강의실 시간 충돌 자동 검증
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 대응

## 🛠 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Deployment**: Vercel (예정)

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
# .env 파일 생성 후 다음 내용 추가
DATABASE_URL="postgresql://username:password@localhost:5432/acatable?schema=public"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. 데이터베이스 마이그레이션
```bash
# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 마이그레이션 실행
npm run db:migrate
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속

## 📚 데이터베이스 스키마

### 주요 테이블
- **Academy**: 학원 정보
- **User**: 사용자 (원장, 행정실장, 강사, 학생)
- **Subject**: 과목 정보
- **Instructor**: 강사 프로필
- **Classroom**: 강의실 정보
- **ClassType**: 수업 유형
- **Schedule**: 시간표 (메인 테이블)
- **StudentSchedule**: 학생 수강 신청

### 권한 체계
- **OWNER**: 원장 - 전체 권한
- **ADMIN**: 행정실장 - 편집 권한
- **INSTRUCTOR**: 강사 - 본인 강의 조회/편집
- **STUDENT**: 학생 - 조회만 가능

## 🎨 UI/UX 특징

- **직관적인 시간표 그리드**: 주간 뷰로 한눈에 확인
- **스마트 필터링**: 체크박스로 다중 선택 가능
- **모바일 최적화**: 터치 친화적 인터페이스
- **실시간 검증**: 입력 시 즉시 충돌 체크

## 🔧 개발 도구

```bash
# Prisma Studio (데이터베이스 GUI)
npm run db:studio

# 코드 검사
npm run lint

# 빌드
npm run build
```

## 📄 라이선스

ISC License

---

**개발진**: 우리학원시간표 Development Team  
**문의**: [이메일 주소] 