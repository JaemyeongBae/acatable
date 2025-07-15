-- Migration: 0005_connect_accounts_academies_fixed.sql
-- Description: accounts와 academies 테이블 연결 및 회원가입 기능 지원 (수정됨)
-- Created at: 2025-01-07

BEGIN;

-- ==========================================
-- accounts 테이블 구조 개선
-- ==========================================

-- academy_id 컬럼 추가 (academies 테이블과 연결)
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS academy_id TEXT;

-- 외래키 제약 조건 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_accounts_academy'
    ) THEN
        ALTER TABLE accounts 
        ADD CONSTRAINT fk_accounts_academy 
        FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_accounts_academy_id ON accounts(academy_id);

-- ==========================================
-- 회원가입 지원 함수 생성
-- ==========================================

-- 학원 회원가입 함수 (accounts + academies 동시 생성)
CREATE OR REPLACE FUNCTION create_academy_account(
    p_academy_name TEXT,
    p_academy_code TEXT,
    p_password TEXT,
    p_admin_email TEXT,
    p_admin_phone TEXT,
    p_address TEXT DEFAULT NULL
)
RETURNS TABLE(
    academy_id TEXT,
    account_id TEXT,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    new_academy_id TEXT;
    new_account_id TEXT;
    password_hash TEXT;
BEGIN
    -- ID 생성
    new_academy_id := 'academy_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8);
    new_account_id := 'account_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8);
    
    -- 비밀번호 해싱
    password_hash := crypt(p_password, gen_salt('bf'));
    
    -- 학원 코드 중복 체크
    IF EXISTS (SELECT 1 FROM academies WHERE code = p_academy_code) THEN
        RETURN QUERY SELECT NULL::TEXT, NULL::TEXT, FALSE, '이미 사용 중인 학원 ID입니다.';
        RETURN;
    END IF;
    
    -- 이메일 중복 체크
    IF EXISTS (SELECT 1 FROM accounts WHERE admin_email = p_admin_email) THEN
        RETURN QUERY SELECT NULL::TEXT, NULL::TEXT, FALSE, '이미 사용 중인 이메일입니다.';
        RETURN;
    END IF;
    
    -- 데이터 삽입 (트랜잭션은 자동으로 함수 전체에 적용됨)
    BEGIN
        -- 1. 학원 정보 생성
        INSERT INTO academies (
            id, name, code, address, email, phone
        ) VALUES (
            new_academy_id, p_academy_name, p_academy_code, p_address, p_admin_email, p_admin_phone
        );
        
        -- 2. 계정 정보 생성
        INSERT INTO accounts (
            id, username, password, academy_name, admin_email, admin_phone, academy_id
        ) VALUES (
            new_account_id, p_academy_code, password_hash, p_academy_name, p_admin_email, p_admin_phone, new_academy_id
        );
        
        -- 3. 관리자 사용자 생성
        INSERT INTO users (
            id, email, name, phone, role, academy_id
        ) VALUES (
            'user_admin_' || new_academy_id, p_admin_email, '관리자', p_admin_phone, 'OWNER', new_academy_id
        );
        
        -- 성공 반환
        RETURN QUERY SELECT new_academy_id, new_account_id, TRUE, '회원가입이 완료되었습니다.';
        
    EXCEPTION
        WHEN OTHERS THEN
            -- 오류 발생 시 함수가 자동으로 롤백됨
            RETURN QUERY SELECT NULL::TEXT, NULL::TEXT, FALSE, '회원가입 중 오류가 발생했습니다: ' || SQLERRM;
    END;
    
END;
$$ language 'plpgsql';

-- ==========================================
-- 학원 검색 함수
-- ==========================================

-- 학원명으로 검색하는 함수 (부분 일치)
CREATE OR REPLACE FUNCTION search_academies(p_search_term TEXT)
RETURNS TABLE(
    academy_id TEXT,
    academy_name TEXT,
    academy_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.code,
        a.created_at
    FROM academies a
    WHERE a.name ILIKE '%' || p_search_term || '%'
    ORDER BY a.name ASC
    LIMIT 20;
END;
$$ language 'plpgsql';

-- ==========================================
-- 인증 관련 함수
-- ==========================================

-- 학원 로그인 인증 함수
CREATE OR REPLACE FUNCTION authenticate_academy(
    p_academy_code TEXT,
    p_password TEXT
)
RETURNS TABLE(
    account_id TEXT,
    academy_id TEXT,
    academy_name TEXT,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    account_record RECORD;
BEGIN
    -- 학원 코드로 계정 정보 조회
    SELECT acc.id, acc.password, acc.academy_id, acc.academy_name
    INTO account_record
    FROM accounts acc
    JOIN academies a ON acc.academy_id = a.id
    WHERE a.code = p_academy_code AND acc.is_active = TRUE;
    
    -- 계정이 존재하지 않는 경우
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::TEXT, NULL::TEXT, NULL::TEXT, FALSE, '존재하지 않는 학원입니다.';
        RETURN;
    END IF;
    
    -- 비밀번호 검증 (bcrypt와 crypt 방식 모두 지원)
    -- bcrypt 해시는 $2b$로 시작하므로 이를 기준으로 구분
    IF account_record.password IS NULL THEN
        RETURN QUERY SELECT NULL::TEXT, NULL::TEXT, NULL::TEXT, FALSE, '비밀번호가 설정되지 않았습니다.';
    ELSIF LEFT(account_record.password, 4) = '$2b$' OR LEFT(account_record.password, 4) = '$2a$' THEN
        -- bcrypt 해시인 경우: JavaScript에서 검증해야 하므로 성공으로 처리
        -- 실제 bcrypt 검증은 Node.js API에서 수행
        RETURN QUERY SELECT 
            account_record.id, 
            account_record.academy_id, 
            account_record.academy_name, 
            TRUE, 
            'bcrypt_verification_needed';
    ELSE
        -- 기존 crypt 방식 검증
        IF crypt(p_password, account_record.password) = account_record.password THEN
            RETURN QUERY SELECT 
                account_record.id, 
                account_record.academy_id, 
                account_record.academy_name, 
                TRUE, 
                '로그인 성공';
        ELSE
            RETURN QUERY SELECT NULL::TEXT, NULL::TEXT, NULL::TEXT, FALSE, '비밀번호가 틀렸습니다.';
        END IF;
    END IF;
END;
$$ language 'plpgsql';

-- ==========================================
-- RLS 정책 업데이트
-- ==========================================

-- accounts 테이블에 academy_id 기반 정책 추가
DROP POLICY IF EXISTS "Academy owners can manage their accounts" ON accounts;
CREATE POLICY "Academy owners can manage their accounts" ON accounts
    FOR ALL USING (
        academy_id IN (
            SELECT academy_id FROM users 
            WHERE email = current_user 
            AND role IN ('OWNER', 'ADMIN')
        )
    );

-- ==========================================
-- 유틸리티 뷰 생성
-- ==========================================

-- 학원 정보와 계정 정보를 조인한 뷰
CREATE OR REPLACE VIEW academy_accounts AS
SELECT 
    a.id as academy_id,
    a.name as academy_name,
    a.code as academy_code,
    a.address,
    a.email as academy_email,
    a.phone as academy_phone,
    a.created_at as academy_created_at,
    acc.id as account_id,
    acc.username,
    acc.admin_email,
    acc.admin_phone,
    acc.is_active,
    acc.created_at as account_created_at
FROM academies a
LEFT JOIN accounts acc ON a.id = acc.academy_id;

COMMIT;