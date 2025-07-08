// 개별 시간표 API 엔드포인트 (GET, PUT, DELETE)
// 목적: 특정 시간표 조회/수정/삭제 with 완화된 충돌 검증

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 특정 시간표 조회 (GET /api/schedules/[id])
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    console.log('시간표 상세 조회 요청:', { id })

    const { data: schedule, error } = await supabase
      .from('schedules')
      .select(`
        *,
        academies:academy_id (name),
        subjects:subject_id (id, name, color),
        instructors:instructor_id (
          id, 
          specialties,
          bio,
          users:user_id (name, email, phone)
        ),
        classrooms:classroom_id (id, name, capacity, floor, location),
        class_types:class_type_id (id, name, color, description)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    console.log('시간표 상세 조회 결과:', { schedule, error })

    if (error || !schedule) {
      return NextResponse.json({
        success: false,
        message: '시간표를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 응답 데이터 변환
    const responseData = {
      id: schedule.id,
      title: schedule.title,
      description: schedule.description,
      dayOfWeek: schedule.day_of_week,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      maxStudents: schedule.max_students,
      currentStudents: schedule.current_students || 0,
      color: schedule.color,
      academy: schedule.academies,
      subject: schedule.subjects,
      instructor: schedule.instructors ? {
        id: schedule.instructors.id,
        name: schedule.instructors.users?.name || '강사 미정',
        email: schedule.instructors.users?.email || '',
        phone: schedule.instructors.users?.phone || '',
        specialties: schedule.instructors.specialties || '',
        bio: schedule.instructors.bio || ''
      } : null,
      classroom: schedule.classrooms,
      classType: schedule.class_types,
      createdAt: schedule.created_at,
      updatedAt: schedule.updated_at
    }

    return NextResponse.json({
      success: true,
      message: '시간표를 성공적으로 조회했습니다.',
      data: responseData
    })

  } catch (error) {
    console.error('시간표 조회 중 오류:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

/**
 * 시간표 수정 (PUT /api/schedules/[id])
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const data = await request.json()
    console.log('시간표 수정 요청:', { id, data })

    // 시간표 존재 확인
    const { data: existingSchedule, error: checkError } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (checkError || !existingSchedule) {
      return NextResponse.json({
        success: false,
        message: '수정할 시간표를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 시간 형식 검증
    if (data.startTime || data.endTime) {
      const validateTimeFormat = (timeStr: string): boolean => {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        return timeRegex.test(timeStr)
      }

      if (data.startTime && !validateTimeFormat(data.startTime)) {
        return NextResponse.json({
          success: false,
          message: '시작 시간 형식이 올바르지 않습니다. (HH:MM 형식 필요)'
        }, { status: 400 })
      }

      if (data.endTime && !validateTimeFormat(data.endTime)) {
        return NextResponse.json({
          success: false,
          message: '종료 시간 형식이 올바르지 않습니다. (HH:MM 형식 필요)'
        }, { status: 400 })
      }
    }

    // 업데이트 데이터 준비
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.dayOfWeek !== undefined) updateData.day_of_week = data.dayOfWeek
    if (data.startTime !== undefined) updateData.start_time = data.startTime
    if (data.endTime !== undefined) updateData.end_time = data.endTime
    if (data.subjectId !== undefined) updateData.subject_id = data.subjectId
    if (data.instructorId !== undefined) updateData.instructor_id = data.instructorId
    if (data.classroomId !== undefined) updateData.classroom_id = data.classroomId
    if (data.classTypeId !== undefined) updateData.class_type_id = data.classTypeId
    if (data.maxStudents !== undefined) updateData.max_students = data.maxStudents
    if (data.color !== undefined) updateData.color = data.color

    updateData.updated_at = new Date().toISOString()

    // 시간표 업데이트
    const { data: updatedSchedule, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    console.log('시간표 수정 결과:', { updatedSchedule, error })

    if (error) {
      console.error('시간표 수정 오류:', error)
      return NextResponse.json({
        success: false,
        message: '시간표 수정 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '시간표가 성공적으로 수정되었습니다.',
      data: {
        id: updatedSchedule.id,
        title: updatedSchedule.title,
        description: updatedSchedule.description,
        dayOfWeek: updatedSchedule.day_of_week,
        startTime: updatedSchedule.start_time,
        endTime: updatedSchedule.end_time,
        maxStudents: updatedSchedule.max_students,
        color: updatedSchedule.color,
        updatedAt: updatedSchedule.updated_at
      }
    })

  } catch (error) {
    console.error('시간표 수정 중 오류:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

/**
 * 시간표 삭제 (DELETE /api/schedules/[id])
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    console.log('시간표 삭제 요청:', { id })

    // 시간표 존재 확인
    const { data: existingSchedule, error: checkError } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (checkError || !existingSchedule) {
      return NextResponse.json({
        success: false,
        message: '삭제할 시간표를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 소프트 삭제 (is_active를 false로 변경)
    const { error } = await supabase
      .from('schedules')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    console.log('시간표 삭제 결과:', { error })

    if (error) {
      console.error('시간표 삭제 오류:', error)
      return NextResponse.json({
        success: false,
        message: '시간표 삭제 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '시간표가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('시간표 삭제 중 오류:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

/**
 * 지원하지 않는 HTTP 메서드 처리
 */
export async function POST() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed. Use GET, PUT, or DELETE.'
  }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed. Use GET, PUT, or DELETE.'
  }, { status: 405 })
}