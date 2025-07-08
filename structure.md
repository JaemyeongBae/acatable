-----

## 개발 계획 통합 보고서: Next.js App Router 기반 학원 관리 시스템

-----

### 1\. 프로젝트 개요 및 목표

본 프로젝트는 **학원 정보 관리 및 시간표 조회/수정 기능을 제공하는 웹 서비스**를 구축하는 것을 목표로 합니다.
Next.js App Router를 사용하여 프론트엔드와 백엔드를 구현하며, 데이터는 관계형 데이터베이스에 저장합니다.

**배포 URL**: `table.acatools.co.kr/`

-----

### 2\. 페이지 구조 및 URL 설계 (Next.js App Router 기반)

Next.js의 **파일 시스템 기반 라우팅**을 활용하여 다음과 같은 페이지 구조와 URL을 설계합니다.

```
app/
├── page.tsx                           // 메인 페이지 (table.acatools.co.kr/)
│                                      //   - 학원 이름 검색 (현재 사용자가 입력한 학원명과 유사한 DB 등록 학원 리스트 노출 및 선택 시 해당 학원 페이지 이동)
│                                      //   - 학원 회원가입 버튼 (클릭 시 가입 페이지로 이동)
├── signin/
│   └── page.tsx                       // 학원 회원가입 페이지 (table.acatools.co.kr/signin)
│                                      //   - 입력 필드: 학원명, 학원ID(URL에 사용됨), 비밀번호(관리자 수정용), 이메일, 전화번호
└── [academyId]/                       // 동적 학원 페이지 (예: table.acatools.co.kr/wisescience)
    ├── page.tsx                       // 학원 시간표 조회 페이지 (table.acatools.co.kr/학원ID)
    │                                  //   - 해당 학원명 표시
    │                                  //   - 해당 학원의 시간표 조회 기능 제공
    │                                  //   - 시간표 수정 버튼 (클릭 시 비밀번호 입력 화면으로 이동)
    ├── edit/
    │   └── page.tsx                   // 학원 시간표 수정 페이지 (table.acatools.co.kr/학원ID/edit)
    │                                  //   - 비밀번호 입력 후 접근 가능한 관리자용 페이지
    │                                  //   - 시간표 내용 수정 기능 제공 (CRUD)
    └── mypage/
        └── page.tsx                   // 마이페이지 (table.acatools.co.kr/학원ID/mypage)
                                       //   - 비밀번호, 이메일 등 학원 개인정보 변경
                                       //   - 학원의 카테고리별 항목 설정 (요일, 강사, 강의실, 과목) - DB 표 형태로 직관적 입력
```

**URL 규칙**:

  * 메인 도메인: `table.acatools.co.kr/`
  * 하위 학원 페이지: `table.acatools.co.kr/{academy_id}` (예: `table.acatools.co.kr/wisescience`)

-----

### 3\. 데이터베이스 스키마 정의

데이터베이스는 \*\*관계형 데이터베이스(RDB)\*\*를 사용하며, 다음 세 가지 테이블을 정의합니다.

#### 3.1. 학원 정보 스키마 (`Academies` Table)

학원의 기본 정보와 관리자 계정 정보를 저장합니다.

```
Table: Academies
----------------------------------------------------------------------------------
| Field          | Type        | Constraints      | Description                  |
----------------------------------------------------------------------------------
| academy_id     | VARCHAR(50) | PRIMARY KEY, UNIQUE, NOT NULL | 학원 고유 ID (URL에 사용, 영소문자/숫자) |
| academy_name   | VARCHAR(100)| NOT NULL         | 학원 정식 명칭               |
| password_hash  | VARCHAR(255)| NOT NULL         | 학원 관리자 비밀번호 (해시값)    |
| salt           | VARCHAR(255)| NOT NULL         | 비밀번호 해싱에 사용된 솔트     |
| email          | VARCHAR(100)| UNIQUE           | 학원 대표 이메일 주소          |
| phone_number   | VARCHAR(20) |                  | 학원 대표 전화번호             |
| created_at     | DATETIME    | DEFAULT CURRENT_TIMESTAMP | 학원 정보 생성일시 (자동)     |
| updated_at     | DATETIME    | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 학원 정보 최종 수정일시 (자동) |
----------------------------------------------------------------------------------
```

**필드별 추가 요구사항:**

  * **`academy_id`**: URL에 사용될 고유한 학원 식별자로, **영문 소문자와 숫자**로만 구성되어야 합니다. (예: `wisescience`, `gangdongmath`). 생성 시 중복 확인이 필요합니다.
  * **`password_hash`**: 학원 관리자 비밀번호는 반드시 \*\*해싱(Hashing)\*\*하여 저장해야 합니다. 보안상 평문 저장은 절대 금지입니다. **bcrypt** 또는 **Argon2** 사용을 권장합니다.
  * **`salt`**: 비밀번호 해싱 시 사용되는 **고유한 솔트(Salt)** 값을 저장해야 합니다. `password_hash`와 1:1로 매핑됩니다.
  * **`email`**: 유니크(Unique) 제약 조건이 필요하며, 유효성 검사가 필요합니다.

#### 3.2. 학원 시간표 정보 스키마 (`Schedules` Table)

각 학원의 시간표 항목을 저장합니다.

```
Table: Schedules
----------------------------------------------------------------------------------
| Field          | Type        | Constraints      | Description                  |
----------------------------------------------------------------------------------
| schedule_id    | INT         | PRIMARY KEY, AUTO_INCREMENT | 시간표 항목 고유 ID          |
| academy_id     | VARCHAR(50) | FOREIGN KEY (Academies.academy_id), NOT NULL | 해당 시간표가 속한 학원의 ID |
| day_of_week    | VARCHAR(10) | NOT NULL         | 요일 (예: '월', '화', '수')      |
| instructor_id  | INT         | FOREIGN KEY (AcademySettings.setting_id) | 강사 ID (AcademySettings 참조) |
| classroom_id   | INT         | FOREIGN KEY (AcademySettings.setting_id) | 강의실 ID (AcademySettings 참조) |
| subject_id     | INT         | FOREIGN KEY (AcademySettings.setting_id) | 과목 ID (AcademySettings 참조) |
| start_time     | TIME        | NOT NULL         | 수업 시작 시간 (HH:MM)         |
| end_time       | TIME        | NOT NULL         | 수업 종료 시간 (HH:MM)         |
| created_at     | DATETIME    | DEFAULT CURRENT_TIMESTAMP | 시간표 항목 생성일시         |
| updated_at     | DATETIME    | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 시간표 항목 최종 수정일시      |
----------------------------------------------------------------------------------
```

**필드별 추가 요구사항:**

  * **`academy_id`**: `Academies` 테이블의 `academy_id`를 참조하는 \*\*외래 키(Foreign Key)\*\*입니다.
  * **`instructor_id`, `classroom_id`, `subject_id`**: 이 필드들은 `AcademySettings` 테이블을 참조하는 **외래 키**입니다. 마이페이지에서 학원 관리자가 사전에 정의한 카테고리 항목들을 통해 입력될 수 있도록 구현해야 합니다.
  * **`start_time`, `end_time`**: 시간 형식은 **`HH:MM`** (예: `09:30`)으로 저장됩니다.

#### 3.3. 학원 카테고리 설정 스키마 (`AcademySettings` Table)

마이페이지에서 학원 관리자가 설정할 수 있는 "요일", "강사", "강의실", "과목"과 같은 카테고리 항목들을 저장합니다.

```
Table: AcademySettings
----------------------------------------------------------------------------------
| Field          | Type        | Constraints      | Description                  |
----------------------------------------------------------------------------------
| setting_id     | INT         | PRIMARY KEY, AUTO_INCREMENT | 설정 항목 고유 ID            |
| academy_id     | VARCHAR(50) | FOREIGN KEY (Academies.academy_id), NOT NULL | 해당 설정이 속한 학원의 ID |
| category_type  | VARCHAR(20) | NOT NULL         | 카테고리 종류 (예: 'day', 'instructor', 'classroom', 'subject') |
| setting_value  | VARCHAR(100)| NOT NULL         | 설정 값 (예: '월', '김선생', 'A-101', '미적분') |
| created_at     | DATETIME    | DEFAULT CURRENT_TIMESTAMP | 설정 항목 생성일시           |
| updated_at     | DATETIME    | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 설정 항목 최종 수정일시        |
----------------------------------------------------------------------------------
```

**필드별 추가 요구사항:**

  * **`academy_id`**: `Academies` 테이블의 `academy_id`를 참조하는 \*\*외래 키(Foreign Key)\*\*입니다.
  * **`category_type`**: 해당 설정이 어떤 카테고리에 속하는지 명확히 구분할 수 있는 문자열 값(예: `'day'`, `'instructor'`, `'classroom'`, `'subject'`)만 허용합니다.

-----

### 4\. 기타 고려사항 및 추가 정보

  * **배포 환경**: 최종 배포 URL은 `table.acatools.co.kr/` 입니다.
  * **백엔드/프론트엔드**: Next.js의 App Router를 사용하여 **Full Stack (통합)** 개발 방식으로 진행합니다. API 엔드포인트는 Next.js의 Route Handlers를 활용하여 구현됩니다.
  * **데이터베이스 시스템**: **MySQL**을 사용합니다.
  * **비밀번호 찾기/재설정 기능**: 초기 구현 범위에는 포함되지 않지만, 추후 확장성을 고려하여 설계가 가능하면 좋습니다.
  * **오류 처리**:
      * **사용자 입력 유효성 검사**: 모든 사용자 입력 필드에 대해 강력한 유효성 검사를 수행해야 합니다. (예: 빈 필드, 유효한 이메일 형식, `academy_id` 중복 확인 및 영소문자/숫자 형식, 비밀번호 복잡성 등)
      * **친화적인 오류 메시지**: 오류 발생 시 사용자에게 명확하고 이해하기 쉬운 메시지를 제공하여 사용성을 높입니다.
      * **API 에러 처리**: 백엔드 API 호출 시 발생하는 오류에 대한 적절한 에러 핸들링 및 클라이언트로의 에러 메시지 전달 로직이 필요합니다.
  * **학원 검색 기능**: 메인 페이지에서 학원 이름 입력 시, 부분 일치 검색(예: '와이즈' 입력 시 '와이즈수학학원', '와이즈과학학원' 등)으로 데이터베이스에 등록된 학원 리스트를 실시간으로 보여주는 기능을 구현합니다.
  * **시간표 수정 권한**: 학원 시간표 수정 페이지(`/{academyId}/edit`)는 비밀번호를 입력해야만 접근 가능하도록 보호되어야 합니다. 마이페이지(`/{academyId}/mypage`) 또한 마찬가지로 접근 권한 확인이 필요합니다.

-----

이 보고서가 AI 코드 에디터에게 필요한 모든 정보를 제공하여 효율적인 코드 개발에 기여하기를 바랍니다.