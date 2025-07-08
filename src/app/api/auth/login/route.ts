// 학원 로그인 API
// 목적: 학원 관리자 인증 및 세션 생성

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

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
    
    // 필수 필드 검증
    if (!academyCode || !password) {
      return NextResponse.json(
        {
          success: false,
          message: '학원 ID와 비밀번호를 입력해주세요.'
        },
        { status: 400 }
      )
    }
    
    // Supabase 함수 호출로 인증 처리
    const { data, error } = await supabase.rpc('authenticate_academy', {
      p_academy_code: academyCode,
      p_password: password
    })
    
    if (error) {
      console.error('로그인 오류:', error)
      return NextResponse.json(
        {
          success: false,
          message: '로그인 중 오류가 발생했습니다.'
        },
        { status: 500 }
      )
    }
    
    // 인증 결과 확인
    const result = data?.[0]
    if (!result?.success) {
      return NextResponse.json(
        {
          success: false,
          message: result?.message || '로그인에 실패했습니다.'
        },
        { status: 401 }
      )
    }
    
    // 세션 쿠키 설정
    const cookieStore = await cookies()
    const sessionData = {
      accountId: result.account_id,
      academyId: result.academy_id,
      academyName: result.academy_name,
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
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '로그인이 완료되었습니다.',
      data: {
        accountId: result.account_id,
        academyId: result.academy_id,
        academyName: result.academy_name,
        academyCode: academyCode
      }
    })
    
  } catch (error) {
    console.error('로그인 처리 오류:', error)
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