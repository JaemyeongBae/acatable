// 수업 유형 개별 관리 API
// 목적: 특정 수업 유형의 수정, 삭제 작업을 위한 엔드포인트

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 수업 유형 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classTypeId } = await params
    const body = await request.json()
    const { academyId, name, color, description } = body

    // 필수 필드 검증
    if (!academyId || !name?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'academyId와 수업 유형명은 필수입니다.'
      }, { status: 400 })
    }

    // 수업 유형 존재 및 권한 확인
    const { data: classType, error: classTypeError } = await supabase
      .from('class_types')
      .select('*')
      .eq('id', classTypeId)
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .single()

    if (classTypeError || !classType) {
      return NextResponse.json({
        success: false,
        message: '수업 유형을 찾을 수 없거나 권한이 없습니다.'
      }, { status: 404 })
    }

    // 중복 검사 (같은 학원 내 다른 수업 유형과 이름 중복 방지)
    const { data: existingClassType } = await supabase
      .from('class_types')
      .select('id')
      .eq('academy_id', academyId)
      .eq('name', name.trim())
      .neq('id', classTypeId)
      .eq('is_active', true)
      .single()

    if (existingClassType) {
      return NextResponse.json({
        success: false,
        message: '이미 등록된 수업 유형명입니다.'
      }, { status: 400 })
    }

    // 수업 유형 정보 업데이트
    const { data: updatedClassType, error: updateError } = await supabase
      .from('class_types')
      .update({
        name: name.trim(),
        color: color || '#8B5CF6',
        description: description?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', classTypeId)
      .select()
      .single()

    if (updateError) {
      console.error('수업 유형 업데이트 오류:', updateError)
      return NextResponse.json({
        success: false,
        message: '수업 유형 정보 수정 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '수업 유형 정보가 성공적으로 수정되었습니다.',
      data: {
        id: updatedClassType.id,
        name: updatedClassType.name,
        color: updatedClassType.color,
        description: updatedClassType.description
      }
    })

  } catch (error) {
    console.error('수업 유형 수정 실패:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// 수업 유형 삭제 (소프트 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classTypeId } = await params
    const { searchParams } = new URL(request.url)
    const academyId = searchParams.get('academyId')

    if (!academyId) {
      return NextResponse.json({
        success: false,
        message: 'academyId가 필요합니다.'
      }, { status: 400 })
    }

    // 수업 유형 존재 및 권한 확인
    const { data: classType, error: classTypeError } = await supabase
      .from('class_types')
      .select('id, name')
      .eq('id', classTypeId)
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .single()

    if (classTypeError || !classType) {
      return NextResponse.json({
        success: false,
        message: '수업 유형을 찾을 수 없거나 권한이 없습니다.'
      }, { status: 404 })
    }

    // 수업 유형이 사용 중인 시간표 확인
    const { data: schedules } = await supabase
      .from('schedules')
      .select('id')
      .eq('class_type_id', classTypeId)
      .eq('is_active', true)

    if (schedules && schedules.length > 0) {
      return NextResponse.json({
        success: false,
        message: '이 수업 유형이 사용 중인 시간표가 있어 삭제할 수 없습니다. 먼저 시간표를 수정해주세요.'
      }, { status: 400 })
    }

    // 소프트 삭제 실행
    const { error: deleteError } = await supabase
      .from('class_types')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', classTypeId)

    if (deleteError) {
      console.error('수업 유형 삭제 오류:', deleteError)
      return NextResponse.json({
        success: false,
        message: '수업 유형 삭제 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '수업 유형이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('수업 유형 삭제 실패:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}