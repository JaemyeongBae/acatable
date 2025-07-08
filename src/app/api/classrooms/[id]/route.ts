// 강의실 개별 관리 API
// 목적: 특정 강의실의 수정, 삭제 작업을 위한 엔드포인트

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 강의실 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classroomId } = await params
    const body = await request.json()
    const { academyId, name, capacity, equipment, floor, location } = body

    // 필수 필드 검증
    if (!academyId || !name?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'academyId와 강의실명은 필수입니다.'
      }, { status: 400 })
    }

    // 강의실 존재 및 권한 확인
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .select('*')
      .eq('id', classroomId)
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .single()

    if (classroomError || !classroom) {
      return NextResponse.json({
        success: false,
        message: '강의실을 찾을 수 없거나 권한이 없습니다.'
      }, { status: 404 })
    }

    // 중복 검사 (같은 학원 내 다른 강의실과 이름 중복 방지)
    const { data: existingClassroom } = await supabase
      .from('classrooms')
      .select('id')
      .eq('academy_id', academyId)
      .eq('name', name.trim())
      .neq('id', classroomId)
      .eq('is_active', true)
      .single()

    if (existingClassroom) {
      return NextResponse.json({
        success: false,
        message: '이미 존재하는 강의실명입니다.'
      }, { status: 400 })
    }

    // 강의실 정보 업데이트
    const { data: updatedClassroom, error: updateError } = await supabase
      .from('classrooms')
      .update({
        name: name.trim(),
        capacity: capacity ? parseInt(capacity) : null,
        equipment: equipment?.trim() || null,
        floor: floor ? parseInt(floor) : null,
        location: location?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', classroomId)
      .select()
      .single()

    if (updateError) {
      console.error('강의실 업데이트 오류:', updateError)
      return NextResponse.json({
        success: false,
        message: '강의실 정보 수정 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '강의실 정보가 성공적으로 수정되었습니다.',
      data: {
        id: updatedClassroom.id,
        name: updatedClassroom.name,
        capacity: updatedClassroom.capacity,
        equipment: updatedClassroom.equipment,
        floor: updatedClassroom.floor,
        location: updatedClassroom.location
      }
    })

  } catch (error) {
    console.error('강의실 수정 실패:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// 강의실 삭제 (소프트 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classroomId } = await params
    const { searchParams } = new URL(request.url)
    const academyId = searchParams.get('academyId')

    if (!academyId) {
      return NextResponse.json({
        success: false,
        message: 'academyId가 필요합니다.'
      }, { status: 400 })
    }

    // 강의실 존재 및 권한 확인
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .select('id, name')
      .eq('id', classroomId)
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .single()

    if (classroomError || !classroom) {
      return NextResponse.json({
        success: false,
        message: '강의실을 찾을 수 없거나 권한이 없습니다.'
      }, { status: 404 })
    }

    // 강의실이 사용 중인 시간표 확인
    const { data: schedules } = await supabase
      .from('schedules')
      .select('id')
      .eq('classroom_id', classroomId)
      .eq('is_active', true)

    if (schedules && schedules.length > 0) {
      return NextResponse.json({
        success: false,
        message: '이 강의실이 사용 중인 시간표가 있어 삭제할 수 없습니다. 먼저 시간표를 수정해주세요.'
      }, { status: 400 })
    }

    // 소프트 삭제 실행
    const { error: deleteError } = await supabase
      .from('classrooms')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', classroomId)

    if (deleteError) {
      console.error('강의실 삭제 오류:', deleteError)
      return NextResponse.json({
        success: false,
        message: '강의실 삭제 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '강의실이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('강의실 삭제 실패:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}