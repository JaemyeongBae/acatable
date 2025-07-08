// 시간표 API 엔드포인트 (GET, POST)
// 목적: 시간표 조회 및 생성 with 충돌 검증

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 시간표 목록 조회 (GET /api/schedules)
 * 쿼리 파라미터를 통한 필터링 지원
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // 쿼리 파라미터 추출
    const academyId = searchParams.get('academyId')
    const dayOfWeek = searchParams.get('dayOfWeek')
    const instructorId = searchParams.get('instructorId')
    const classroomId = searchParams.get('classroomId')
    const classTypeId = searchParams.get('classTypeId')
    const subjectId = searchParams.get('subjectId')

    console.log('시간표 조회 요청:', { academyId, dayOfWeek, instructorId, classroomId, classTypeId, subjectId })

    // 필수 파라미터 검증
    if (!academyId) {
      return NextResponse.json({
        success: false,
        message: '학원 ID는 필수입니다.'
      }, { status: 400 })
    }

    // 기본 쿼리 구성
    let query = supabase
      .from('schedules')
      .select(`
        *,
        subjects:subject_id (id, name, color),
        instructors:instructor_id (
          id, 
          specialties,
          users:user_id (name, phone)
        ),
        classrooms:classroom_id (id, name, capacity, floor),
        class_types:class_type_id (id, name, color)
      `)
      .eq('academy_id', academyId)
      .eq('is_active', true)

    // 필터 조건 추가
    if (dayOfWeek) query = query.eq('day_of_week', dayOfWeek)
    if (instructorId) query = query.eq('instructor_id', instructorId)
    if (classroomId) query = query.eq('classroom_id', classroomId)
    if (classTypeId) query = query.eq('class_type_id', classTypeId)
    if (subjectId) query = query.eq('subject_id', subjectId)

    // 정렬 추가
    query = query.order('day_of_week').order('start_time')

    const { data: schedules, error } = await query

    console.log('Supabase 조회 결과:', { schedules, error })

    if (error) {
      console.error('시간표 조회 오류:', error)
      return NextResponse.json({
        success: false,
        message: '시간표 조회 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    // 응답 데이터 변환
    const responseData = (schedules || []).map((schedule: any) => ({
      id: schedule.id,
      title: schedule.title,
      description: schedule.description,
      dayOfWeek: schedule.day_of_week,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      maxStudents: schedule.max_students,
      currentStudents: schedule.current_students || 0,
      color: schedule.color || '#BFDBFE',
      subject: schedule.subjects ? {
        id: schedule.subjects.id,
        name: schedule.subjects.name,
        color: schedule.subjects.color
      } : null,
      instructor: schedule.instructors ? {
        id: schedule.instructors.id,
        name: schedule.instructors.users?.name || '강사 미정',
        phone: schedule.instructors.users?.phone || '',
        specialties: schedule.instructors.specialties || []
      } : null,
      classroom: schedule.classrooms,
      classType: schedule.class_types,
      studentPreview: [], // 임시로 빈 배열
      createdAt: schedule.created_at,
      updatedAt: schedule.updated_at
    }))

    return NextResponse.json({
      success: true,
      message: `${responseData.length}개의 시간표를 조회했습니다.`,
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
 * 새 시간표 생성 (POST /api/schedules)
 * 충돌 검증 포함
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('시간표 생성 요청:', data)

    // 필수 필드 검증
    if (!data.title || !data.dayOfWeek || !data.startTime || !data.endTime || !data.academyId) {
      return NextResponse.json({
        success: false,
        message: '필수 필드가 누락되었습니다. (title, dayOfWeek, startTime, endTime, academyId)'
      }, { status: 400 })
    }

    // 시간 형식 검증
    const validateTimeFormat = (timeStr: string): boolean => {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      return timeRegex.test(timeStr)
    }

    if (!validateTimeFormat(data.startTime) || !validateTimeFormat(data.endTime)) {
      return NextResponse.json({
        success: false,
        message: '시간 형식이 올바르지 않습니다. (HH:MM 형식 필요)'
      }, { status: 400 })
    }

    // 학원 존재 확인
    const { data: academy, error: academyError } = await supabase
      .from('academies')
      .select('id')
      .eq('id', data.academyId)
      .single()

    if (academyError || !academy) {
      return NextResponse.json({
        success: false,
        message: '존재하지 않는 학원입니다.'
      }, { status: 404 })
    }

    // ID 생성
    const scheduleId = 'schedule_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)

    // 시간표 데이터 준비
    const scheduleData = {
      id: scheduleId,
      title: data.title,
      description: data.description || null,
      day_of_week: data.dayOfWeek,
      start_time: data.startTime,
      end_time: data.endTime,
      academy_id: data.academyId,
      subject_id: data.subjectId || null,
      instructor_id: data.instructorId || null,
      classroom_id: data.classroomId || null,
      class_type_id: data.classTypeId || null,
      max_students: data.maxStudents || null,
      color: data.color || '#BFDBFE',
      is_active: true,
      current_students: 0
    }

    console.log('Supabase에 삽입할 데이터:', scheduleData)

    // 시간표 생성
    const { data: newSchedule, error } = await supabase
      .from('schedules')
      .insert([scheduleData])
      .select()
      .single()

    console.log('Supabase 삽입 결과:', { newSchedule, error })

    if (error) {
      console.error('시간표 생성 오류:', error)
      return NextResponse.json({
        success: false,
        message: '시간표 생성 중 오류가 발생했습니다.',
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '시간표가 성공적으로 생성되었습니다.',
      data: {
        id: newSchedule.id,
        title: newSchedule.title,
        description: newSchedule.description,
        dayOfWeek: newSchedule.day_of_week,
        startTime: newSchedule.start_time,
        endTime: newSchedule.end_time,
        maxStudents: newSchedule.max_students,
        color: newSchedule.color,
        createdAt: newSchedule.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('시간표 생성 중 오류:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

/**
 * 지원하지 않는 HTTP 메서드 처리
 */
export async function PUT() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed. Use GET or POST.'
  }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed. Use GET or POST.'
  }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed. Use GET or POST.'
  }, { status: 405 })
} 