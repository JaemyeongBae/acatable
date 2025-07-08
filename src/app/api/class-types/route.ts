// 수업 유형 관리 API
// 목적: 학원별 수업 유형 CRUD 작업을 위한 엔드포인트

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 수업 유형 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const academyId = searchParams.get('academyId')

    if (!academyId) {
      return NextResponse.json({
        success: false,
        message: 'academyId가 필요합니다.'
      }, { status: 400 })
    }

    // 수업 유형 목록 조회
    const { data: classTypes, error } = await supabase
      .from('class_types')
      .select('*')
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('수업 유형 조회 오류:', error)
      return NextResponse.json({
        success: false,
        message: '수업 유형 조회 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    // 응답 데이터 변환
    const responseData = (classTypes || []).map((classType: any) => ({
      id: classType.id,
      name: classType.name,
      color: classType.color,
      description: classType.description,
      isActive: classType.is_active,
      createdAt: classType.created_at,
      updatedAt: classType.updated_at
    }))

    return NextResponse.json({
      success: true,
      message: `${responseData.length}개의 수업 유형을 조회했습니다.`,
      data: responseData
    })

  } catch (error) {
    console.error('수업 유형 목록 조회 실패:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// 새 수업 유형 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { academyId, name, color, description } = body

    // 필수 필드 검증
    if (!academyId || !name?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'academyId와 수업 유형명은 필수입니다.'
      }, { status: 400 })
    }

    // 학원 존재 확인
    const { data: academy, error: academyError } = await supabase
      .from('academies')
      .select('id')
      .eq('id', academyId)
      .single()

    if (academyError || !academy) {
      return NextResponse.json({
        success: false,
        message: '존재하지 않는 학원입니다.'
      }, { status: 404 })
    }

    // 중복 검사 (같은 학원 내 수업 유형명 중복 방지)
    const { data: existingClassType } = await supabase
      .from('class_types')
      .select('id')
      .eq('academy_id', academyId)
      .eq('name', name.trim())
      .eq('is_active', true)
      .single()

    if (existingClassType) {
      return NextResponse.json({
        success: false,
        message: '이미 등록된 수업 유형명입니다.'
      }, { status: 400 })
    }

    // ID 생성
    const classTypeId = 'classtype_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)

    // 수업 유형 생성
    const { data: newClassType, error } = await supabase
      .from('class_types')
      .insert({
        id: classTypeId,
        name: name.trim(),
        color: color || '#8B5CF6',
        description: description?.trim() || null,
        academy_id: academyId,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('수업 유형 생성 오류:', error)
      return NextResponse.json({
        success: false,
        message: '수업 유형 등록 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '수업 유형이 성공적으로 등록되었습니다.',
      data: {
        id: newClassType.id,
        name: newClassType.name,
        color: newClassType.color,
        description: newClassType.description
      }
    }, { status: 201 })

  } catch (error) {
    console.error('수업 유형 추가 실패:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
} 