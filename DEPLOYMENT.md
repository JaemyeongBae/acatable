# 배포 가이드

## 환경변수 설정

### 필수 환경변수

배포 시 다음 환경변수들을 반드시 설정해야 합니다:

#### Supabase 설정
```bash
SUPABASE_URL="https://[PROJECT_ID].supabase.co"
SUPABASE_ANON_KEY="[ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_KEY]"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON_KEY]"
```

#### Admin 마스터 비밀번호
```bash
ADMIN_MASTER_PASSWORD="your_strong_admin_password"
```

**⚠️ 보안 주의사항:**
- `ADMIN_MASTER_PASSWORD`는 반드시 강력한 비밀번호로 설정하세요
- 16자 이상, 영문+숫자+특수문자 조합 권장
- 예: `Adm1n!2024$Secure#Pass`

## 플랫폼별 배포 방법

### Vercel
1. Vercel 대시보드에서 프로젝트 선택
2. Settings → Environment Variables
3. 위의 환경변수들을 추가
4. Redeploy

```bash
# CLI로 환경변수 추가
vercel env add ADMIN_MASTER_PASSWORD
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... 기타 환경변수들
```

### Netlify
1. Site settings → Environment variables
2. 위의 환경변수들을 추가
3. Redeploy

### Railway
1. 프로젝트 → Variables 탭
2. 위의 환경변수들을 추가

### Docker
```dockerfile
# Dockerfile에서
ENV ADMIN_MASTER_PASSWORD="your_strong_admin_password"
ENV SUPABASE_URL="https://[PROJECT_ID].supabase.co"
# ... 기타 환경변수들
```

## Admin 기능 사용법

### Admin 로그인
1. `/admin/login` 페이지 접속
2. `ADMIN_MASTER_PASSWORD`에 설정한 비밀번호 입력
3. Admin 대시보드에서 전체 학원 관리

### 마스터 키 사용
- 모든 학원의 마이페이지(`/[academyCode]/mypage`)에서 Admin 마스터 비밀번호로 접근 가능
- 모든 학원의 수정페이지(`/[academyCode]/edit`)에서 Admin 마스터 비밀번호로 접근 가능

## 보안 체크리스트

- [ ] `ADMIN_MASTER_PASSWORD`를 강력한 비밀번호로 설정
- [ ] 모든 Supabase 키가 올바르게 설정됨
- [ ] `.env.local` 파일이 `.gitignore`에 포함됨
- [ ] 프로덕션에서 개발용 비밀번호 사용하지 않음
- [ ] 정기적으로 Admin 비밀번호 변경

## 문제 해결

### Admin 로그인이 안 되는 경우
1. 환경변수 `ADMIN_MASTER_PASSWORD`가 설정되어 있는지 확인
2. 서버 로그에서 오류 메시지 확인
3. 배포 플랫폼에서 환경변수가 올바르게 설정되었는지 확인

### 학원 목록이 로드되지 않는 경우
1. Supabase 환경변수들이 올바르게 설정되어 있는지 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. RLS(Row Level Security) 정책 확인