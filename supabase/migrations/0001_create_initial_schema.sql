-- Migration: 0001_create_initial_schema.sql
-- Description: 학원 시간표 관리 시스템 초기 스키마 생성
-- Created at: 2025-01-07

BEGIN;

-- ==========================================
-- ENUMS 생성
-- ==========================================

-- 사용자 역할 열거형
CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'INSTRUCTOR', 'STUDENT');

-- 요일 열거형
CREATE TYPE day_of_week AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- ==========================================
-- TABLES 생성
-- ==========================================

-- 학원 정보 테이블
CREATE TABLE IF NOT EXISTS academies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 계정 테이블 (인증용)
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    academy_name TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    admin_phone TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 정보 테이블
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'STUDENT',
    academy_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_academy FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE
);

-- 과목 정보 테이블
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    academy_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subjects_academy FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
    CONSTRAINT uk_subjects_academy_name UNIQUE (academy_id, name)
);

-- 강사 정보 테이블
CREATE TABLE IF NOT EXISTS instructors (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    academy_id TEXT NOT NULL,
    specialties TEXT NOT NULL,
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_instructors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_instructors_academy FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE
);

-- 강의실 정보 테이블
CREATE TABLE IF NOT EXISTS classrooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INTEGER,
    equipment TEXT,
    floor INTEGER,
    location TEXT,
    academy_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_classrooms_academy FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
    CONSTRAINT uk_classrooms_academy_name UNIQUE (academy_id, name)
);

-- 수업 유형 테이블
CREATE TABLE IF NOT EXISTS class_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    description TEXT,
    academy_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_class_types_academy FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
    CONSTRAINT uk_class_types_academy_name UNIQUE (academy_id, name)
);

-- 메인 시간표 테이블
CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    day_of_week day_of_week NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    academy_id TEXT NOT NULL,
    subject_id TEXT,
    instructor_id TEXT,
    classroom_id TEXT,
    class_type_id TEXT,
    color TEXT DEFAULT '#BFDBFE',
    is_active BOOLEAN DEFAULT TRUE,
    max_students INTEGER,
    current_students INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_schedules_academy FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE,
    CONSTRAINT fk_schedules_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    CONSTRAINT fk_schedules_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL,
    CONSTRAINT fk_schedules_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
    CONSTRAINT fk_schedules_class_type FOREIGN KEY (class_type_id) REFERENCES class_types(id) ON DELETE SET NULL
);

-- 학생별 수강 시간표 연결 테이블
CREATE TABLE IF NOT EXISTS student_schedules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    schedule_id TEXT NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_student_schedules_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_schedules_schedule FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    CONSTRAINT uk_student_schedules_user_schedule UNIQUE (user_id, schedule_id)
);

-- 시간표 변경 이력 테이블
CREATE TABLE IF NOT EXISTS schedule_history (
    id TEXT PRIMARY KEY,
    schedule_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_data TEXT,
    new_data TEXT,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_schedule_history_schedule FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

-- ==========================================
-- INDEXES 생성
-- ==========================================

-- 기본 인덱스
CREATE INDEX IF NOT EXISTS idx_users_academy_id ON users(academy_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);
CREATE INDEX IF NOT EXISTS idx_accounts_academy_name ON accounts(academy_name);
CREATE INDEX IF NOT EXISTS idx_subjects_academy_id ON subjects(academy_id);
CREATE INDEX IF NOT EXISTS idx_instructors_academy_id ON instructors(academy_id);
CREATE INDEX IF NOT EXISTS idx_instructors_user_id ON instructors(user_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_academy_id ON classrooms(academy_id);
CREATE INDEX IF NOT EXISTS idx_class_types_academy_id ON class_types(academy_id);

-- 시간표 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_schedules_academy_id ON schedules(academy_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day_of_week ON schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedules_instructor_id ON schedules(instructor_id);
CREATE INDEX IF NOT EXISTS idx_schedules_classroom_id ON schedules(classroom_id);
CREATE INDEX IF NOT EXISTS idx_schedules_subject_id ON schedules(subject_id);

-- 복합 인덱스 (시간 충돌 검사용)
CREATE INDEX IF NOT EXISTS idx_schedules_classroom_time ON schedules(classroom_id, day_of_week, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_schedules_instructor_time ON schedules(instructor_id, day_of_week, start_time, end_time);

-- 학생 스케줄 인덱스
CREATE INDEX IF NOT EXISTS idx_student_schedules_user_id ON student_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_student_schedules_schedule_id ON student_schedules(schedule_id);

-- 이력 인덱스
CREATE INDEX IF NOT EXISTS idx_schedule_history_schedule_id ON schedule_history(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_history_changed_at ON schedule_history(changed_at);

COMMIT;