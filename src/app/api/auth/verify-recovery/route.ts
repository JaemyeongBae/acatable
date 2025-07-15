import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface VerifyRecoveryRequest {
  academyCode: string
  email: string
  phone: string
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRecoveryRequest = await request.json()
    const { academyCode, email, phone } = body

    if (!academyCode || !email || !phone) {
      return NextResponse.json({ 
        success: false, 
        message: '학원 코드, 이메일, 전화번호는 필수입니다' 
      }, { status: 400 })
    }

    // 학원 정보 조회 및 이메일, 전화번호 확인
    const { data: academy, error: academyError } = await supabase
      .from('academies')
      .select('email, phone')
      .eq('code', academyCode)
      .single()

    if (academyError || !academy) {
      return NextResponse.json({ 
        success: false, 
        message: '존재하지 않는 학원입니다' 
      }, { status: 404 })
    }

    // 이메일과 전화번호 확인
    if (academy.email !== email || academy.phone !== phone) {
      return NextResponse.json({ 
        success: false, 
        message: '등록된 이메일 또는 전화번호가 일치하지 않습니다' 
      }, { status: 401 })
    }

    // 추후 이메일/SMS 인증 기능 추가 시 여기에 인증번호 발송 로직 구현

    return NextResponse.json({
      success: true,
      message: '정보 확인이 완료되었습니다. 새 비밀번호를 설정해주세요.'
    })

  } catch (error) {
    console.error('Verify recovery API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: '서버 오류가 발생했습니다' 
    }, { status: 500 })
  }
}