// 과목 개별 관리 API
// 목적: 특정 과목의 수정, 삭제 작업을 위한 엔드포인트

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 과목 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subjectId } = await params
    const body = await request.json()
    const { academyId, name, color } = body

    // 필수 필드 검증
    if (!academyId || !name?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'academyId와 과목명은 필수입니다.'
      }, { status: 400 })
    }

    // 과목 존재 및 권한 확인
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', subjectId)
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .single()

    if (subjectError || !subject) {
      return NextResponse.json({
        success: false,
        message: '과목을 찾을 수 없거나 권한이 없습니다.'
      }, { status: 404 })
    }

    // 중복 검사 (같은 학원 내 다른 과목과 이름 중복 방지)
    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('academy_id', academyId)
      .eq('name', name.trim())
      .neq('id', subjectId)
      .eq('is_active', true)
      .single()

    if (existingSubject) {
      return NextResponse.json({
        success: false,
        message: '이미 등록된 과목명입니다.'
      }, { status: 400 })
    }

    // 과목 정보 업데이트
    const { data: updatedSubject, error: updateError } = await supabase
      .from('subjects')
      .update({
        name: name.trim(),
        color: color || '#3B82F6',
        updated_at: new Date().toISOString()
      })
      .eq('id', subjectId)
      .select()
      .single()

    if (updateError) {
      console.error('과목 업데이트 오류:', updateError)
      return NextResponse.json({
        success: false,
        message: '과목 정보 수정 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '과목 정보가 성공적으로 수정되었습니다.',
      data: {
        id: updatedSubject.id,
        name: updatedSubject.name,
        color: updatedSubject.color
      }
    })

  } catch (error) {
    console.error('과목 수정 실패:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// 과목 삭제 (소프트 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subjectId } = await params
    const { searchParams } = new URL(request.url)
    const academyId = searchParams.get('academyId')

    if (!academyId) {
      return NextResponse.json({
        success: false,
        message: 'academyId가 필요합니다.'
      }, { status: 400 })
    }

    // 과목 존재 및 권한 확인
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('id', subjectId)
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .single()

    if (subjectError || !subject) {
      return NextResponse.json({
        success: false,
        message: '과목을 찾을 수 없거나 권한이 없습니다.'
      }, { status: 404 })
    }

    // 과목이 사용 중인 시간표 확인
    const { data: schedules } = await supabase
      .from('schedules')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('is_active', true)

    if (schedules && schedules.length > 0) {
      return NextResponse.json({
        success: false,
        message: '이 과목이 사용 중인 시간표가 있어 삭제할 수 없습니다. 먼저 시간표를 수정해주세요.'
      }, { status: 400 })
    }

    // 소프트 삭제 실행
    const { error: deleteError } = await supabase
      .from('subjects')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', subjectId)

    if (deleteError) {
      console.error('과목 삭제 오류:', deleteError)
      return NextResponse.json({
        success: false,
        message: '과목 삭제 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '과목이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('과목 삭제 실패:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}