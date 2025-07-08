// 학원 정보 조회 API
// 목적: 학원 코드로 특정 학원 상세 정보 조회

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 학원 정보 타입 정의
interface AcademyInfo {
  academyId: string
  academyName: string
  academyCode: string
  address?: string
  email?: string
  phone?: string
  createdAt: string
}

// 응답 타입 정의
interface AcademyResponse {
  success: boolean
  message: string
  data?: AcademyInfo
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
): Promise<NextResponse<AcademyResponse>> {
  try {
    const { code: academyCode } = await params
    
    // 학원 코드 검증
    if (!academyCode || academyCode.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: '학원 코드가 필요합니다.'
        },
        { status: 400 }
      )
    }
    
    // 학원 정보 조회
    const { data, error } = await supabase
      .from('academies')
      .select('id, name, code, address, email, phone, created_at')
      .eq('code', academyCode)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // 데이터를 찾을 수 없음
        return NextResponse.json(
          {
            success: false,
            message: '존재하지 않는 학원입니다.'
          },
          { status: 404 }
        )
      }
      
      console.error('학원 정보 조회 오류:', error)
      return NextResponse.json(
        {
          success: false,
          message: '학원 정보 조회 중 오류가 발생했습니다.'
        },
        { status: 500 }
      )
    }
    
    // 응답 데이터 변환
    const academyInfo: AcademyInfo = {
      academyId: data.id,
      academyName: data.name,
      academyCode: data.code,
      address: data.address,
      email: data.email,
      phone: data.phone,
      createdAt: data.created_at
    }
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '학원 정보를 성공적으로 조회했습니다.',
      data: academyInfo
    })
    
  } catch (error) {
    console.error('학원 정보 조회 처리 오류:', error)
    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}