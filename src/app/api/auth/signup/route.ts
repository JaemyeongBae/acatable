// 학원 회원가입 API
// 목적: 새로운 학원 계정 생성 (accounts + academies + 관리자 user 생성)

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 회원가입 요청 타입 정의
interface SignupRequest {
  academyName: string
  academyCode: string
  password: string
  adminEmail: string
  adminPhone: string
  address?: string
}

// 응답 타입 정의
interface SignupResponse {
  success: boolean
  message: string
  data?: {
    academyId: string
    academyCode: string
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<SignupResponse>> {
  try {
    // 디버그 정보 출력
    console.log('회원가입 API 호출됨')
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    
    const body: SignupRequest = await request.json()
    console.log('요청 데이터:', { ...body, password: '[HIDDEN]' })
    console.log('요청 데이터 타입 확인:', {
      academyName: typeof body.academyName,
      academyCode: typeof body.academyCode,
      password: typeof body.password,
      adminEmail: typeof body.adminEmail,
      adminPhone: typeof body.adminPhone
    })
    
    // 입력 데이터 검증
    const { academyName, academyCode, password, adminEmail, adminPhone, address } = body
    
    // 필수 필드 검증
    if (!academyName || !academyCode || !password || !adminEmail || !adminPhone) {
      return NextResponse.json(
        {
          success: false,
          message: '모든 필수 필드를 입력해주세요.'
        },
        { status: 400 }
      )
    }
    
    // 학원 코드 형식 검증 (영문 소문자, 숫자만 허용)
    const codeRegex = /^[a-z0-9]+$/
    if (!codeRegex.test(academyCode)) {
      return NextResponse.json(
        {
          success: false,
          message: '학원 ID는 영문 소문자와 숫자만 사용할 수 있습니다.'
        },
        { status: 400 }
      )
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(adminEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: '올바른 이메일 형식을 입력해주세요.'
        },
        { status: 400 }
      )
    }
    
    // 비밀번호 길이 검증
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: '비밀번호는 최소 6자 이상이어야 합니다.'
        },
        { status: 400 }
      )
    }
    
    // Supabase 함수 호출로 회원가입 처리
    console.log('Supabase 함수 호출 시작')
    const { data, error } = await supabase.rpc('create_academy_account', {
      p_academy_name: academyName,
      p_academy_code: academyCode,
      p_password: password,
      p_admin_email: adminEmail,
      p_admin_phone: adminPhone,
      p_address: address || null
    })
    
    console.log('Supabase 응답:', { data, error })
    
    if (error) {
      console.error('회원가입 오류 상세:', error)
      console.error('오류 코드:', error.code)
      console.error('오류 메시지:', error.message)
      console.error('오류 상세:', error.details)
      return NextResponse.json(
        {
          success: false,
          message: '회원가입 중 오류가 발생했습니다.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      )
    }
    
    // 함수 결과 확인
    const result = data?.[0]
    if (!result?.success) {
      return NextResponse.json(
        {
          success: false,
          message: result?.message || '회원가입에 실패했습니다.'
        },
        { status: 400 }
      )
    }
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: {
        academyId: result.academy_id,
        academyCode: academyCode
      }
    })
    
  } catch (error) {
    console.error('회원가입 처리 오류:', error)
    console.error('오류 스택:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}