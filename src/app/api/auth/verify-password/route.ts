// 비밀번호 검증 API
// 목적: 학원 관리자 비밀번호 검증 (수정 페이지, 마이페이지 접근용)

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// 비밀번호 검증 요청 타입
interface VerifyPasswordRequest {
  academyCode: string
  password: string
}

// 응답 타입
interface VerifyPasswordResponse {
  success: boolean
  message: string
  data?: {
    academyId: string
    academyName: string
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<VerifyPasswordResponse>> {
  try {
    console.log('비밀번호 검증 API 호출됨')
    
    const body: VerifyPasswordRequest = await request.json()
    const { academyCode, password } = body
    
    // 입력 데이터 검증
    if (!academyCode || !password) {
      return NextResponse.json(
        {
          success: false,
          message: '학원 코드와 비밀번호를 입력해주세요.'
        },
        { status: 400 }
      )
    }
    
    console.log('검증 요청:', { academyCode, password: '[HIDDEN]' })
    
    // Admin 마스터 비밀번호 확인
    const adminMasterPassword = process.env.ADMIN_MASTER_PASSWORD
    if (adminMasterPassword && password === adminMasterPassword) {
      // 마스터 키로 학원 정보 조회
      const { data: academyData, error: academyError } = await supabase
        .from('academies')
        .select('id, name')
        .eq('code', academyCode)
        .single()
      
      if (academyError || !academyData) {
        return NextResponse.json(
          {
            success: false,
            message: '학원을 찾을 수 없습니다.'
          },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Admin 마스터 인증이 완료되었습니다.',
        data: {
          academyId: academyData.id,
          academyName: academyData.name
        }
      })
    }
    
    // 학원 정보 조회
    const { data: academy, error: academyError } = await supabase
      .from('academies')
      .select('id, name')
      .eq('code', academyCode)
      .single()
    
    if (academyError || !academy) {
      console.error('학원 조회 오류:', academyError)
      return NextResponse.json(
        {
          success: false,
          message: '존재하지 않는 학원입니다.'
        },
        { status: 404 }
      )
    }
    
    // 계정 정보 조회 (accounts 테이블에서 실제 비밀번호 확인)
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, password')
      .eq('academy_id', academy.id)
      .single()
    
    if (accountError || !account) {
      console.error('계정 조회 오류:', accountError)
      return NextResponse.json(
        {
          success: false,
          message: '계정 정보를 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }
    
    // 비밀번호 검증
    let isPasswordValid = false
    
    if (!account.password) {
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
      console.log('bcrypt 방식 검증 중...')
      try {
        isPasswordValid = await bcrypt.compare(password, account.password)
        console.log('bcrypt 검증 결과:', { isPasswordValid })
      } catch (bcryptError) {
        console.error('bcrypt 검증 오류:', bcryptError)
        return NextResponse.json(
          {
            success: false,
            message: '비밀번호 검증 중 오류가 발생했습니다.'
          },
          { status: 500 }
        )
      }
    } else {
      console.log('crypt 방식 검증 - Supabase 함수 호출 중...')
      // 기존 crypt 방식은 Supabase 함수 사용
      const { data, error } = await supabase.rpc('authenticate_academy', {
        p_academy_code: academyCode,
        p_password: password
      })
      
      if (error) {
        console.error('Supabase 인증 오류:', error)
        return NextResponse.json(
          {
            success: false,
            message: '인증 중 오류가 발생했습니다.'
          },
          { status: 500 }
        )
      }
      
      const result = data?.[0]
      isPasswordValid = result?.success === true
      console.log('crypt 검증 결과:', { isPasswordValid })
    }
    
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: '비밀번호가 틀렸습니다.'
        },
        { status: 401 }
      )
    }
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '인증이 완료되었습니다.',
      data: {
        academyId: academy.id,
        academyName: academy.name
      }
    })
    
  } catch (error) {
    console.error('비밀번호 검증 처리 오류:', error)
    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}