// 학원 로그인 API
// 목적: 학원 관리자 인증 및 세션 생성

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

// 로그인 요청 타입 정의
interface LoginRequest {
  academyCode: string
  password: string
}

// 응답 타입 정의
interface LoginResponse {
  success: boolean
  message: string
  data?: {
    accountId: string
    academyId: string
    academyName: string
    academyCode: string
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
  try {
    const body: LoginRequest = await request.json()
    
    // 입력 데이터 검증
    const { academyCode, password } = body
    
    console.log('=== 로그인 API 시작 ===')
    console.log('로그인 시도:', { academyCode, passwordLength: password.length })
    
    // 필수 필드 검증
    if (!academyCode || !password) {
      console.log('❌ 필수 필드 누락')
      return NextResponse.json(
        {
          success: false,
          message: '학원 ID와 비밀번호를 입력해주세요.'
        },
        { status: 400 }
      )
    }
    
    // 학원 정보 조회
    console.log('1. 학원 정보 조회 중...')
    const { data: academy, error: academyError } = await supabase
      .from('academies')
      .select('*')
      .eq('code', academyCode)
      .single()
    
    if (academyError || !academy) {
      console.error('❌ 학원 조회 실패:', academyError?.message)
      return NextResponse.json(
        {
          success: false,
          message: '존재하지 않는 학원입니다.'
        },
        { status: 404 }
      )
    }
    
    console.log('✅ 학원 조회 성공:', { academyId: academy.id, academyName: academy.name })
    
    // 계정 정보 조회
    console.log('2. 계정 정보 조회 중...')
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('academy_id', academy.id)
      .eq('is_active', true)
      .single()
    
    if (accountError || !account) {
      console.error('❌ 계정 조회 실패:', accountError?.message)
      return NextResponse.json(
        {
          success: false,
          message: '활성화된 계정을 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }
    
    console.log('✅ 계정 조회 성공:', { 
      accountId: account.id, 
      hasPassword: !!account.password,
      passwordType: account.password?.startsWith('$2') ? 'bcrypt' : 'crypt'
    })
    
    // 비밀번호 검증
    console.log('3. 비밀번호 검증 중...')
    let isPasswordValid = false
    
    if (!account.password) {
      console.log('❌ 비밀번호가 설정되지 않음')
      return NextResponse.json(
        {
          success: false,
          message: '비밀번호가 설정되지 않았습니다.'
        },
        { status: 401 }
      )
    }
    
    // bcrypt 해시인지 확인 ($2a$, $2b$, $2y$로 시작)
    if (account.password.startsWith('$2')) {
      console.log('4. bcrypt 방식 검증 중...')
      try {
        isPasswordValid = await bcrypt.compare(password, account.password)
        console.log('✅ bcrypt 검증 완료:', { isPasswordValid })
      } catch (bcryptError) {
        console.error('❌ bcrypt 검증 오류:', bcryptError)
        return NextResponse.json(
          {
            success: false,
            message: '비밀번호 검증 중 오류가 발생했습니다.'
          },
          { status: 500 }
        )
      }
    } else {
      console.log('4. crypt 방식 검증 - Supabase 함수 호출 중...')
      // 기존 crypt 방식은 Supabase 함수 사용
      const { data, error } = await supabase.rpc('authenticate_academy', {
        p_academy_code: academyCode,
        p_password: password
      })
      
      if (error) {
        console.error('❌ Supabase 인증 오류:', error)
        return NextResponse.json(
          {
            success: false,
            message: '로그인 중 오류가 발생했습니다.'
          },
          { status: 500 }
        )
      }
      
      const result = data?.[0]
      isPasswordValid = result?.success === true
      console.log('✅ crypt 검증 완료:', { isPasswordValid })
    }
    
    // 인증 실패 처리
    if (!isPasswordValid) {
      console.log('❌ 비밀번호 불일치')
      return NextResponse.json(
        {
          success: false,
          message: '비밀번호가 틀렸습니다.'
        },
        { status: 401 }
      )
    }
    
    // 세션 쿠키 설정
    console.log('5. 세션 쿠키 설정 중...')
    const cookieStore = await cookies()
    const sessionData = {
      accountId: account.id,
      academyId: academy.id,
      academyName: academy.name,
      academyCode: academyCode,
      loginTime: Date.now()
    }
    
    // 세션 쿠키 생성 (7일 유효)
    cookieStore.set('academy_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7일
    })
    
    console.log('✅ 로그인 성공')
    console.log('=== 로그인 API 완료 ===')
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '로그인이 완료되었습니다.',
      data: {
        accountId: account.id,
        academyId: academy.id,
        academyName: academy.name,
        academyCode: academyCode
      }
    })
    
  } catch (error) {
    console.error('❌ 로그인 처리 오류:', error)
    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}

// 로그아웃 처리
export async function DELETE(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies()
    
    // 세션 쿠키 삭제
    cookieStore.set('academy_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // 즉시 만료
    })
    
    return NextResponse.json({
      success: true,
      message: '로그아웃이 완료되었습니다.'
    })
    
  } catch (error) {
    console.error('로그아웃 처리 오류:', error)
    return NextResponse.json(
      {
        success: false,
        message: '로그아웃 중 오류가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}