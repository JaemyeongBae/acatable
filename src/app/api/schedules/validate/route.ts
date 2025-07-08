// 시간표 충돌 검증 API 엔드포인트
// 목적: 실시간 시간표 충돌 검증 서비스

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ConflictValidationRequest {
  academyId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  instructorId: string
  classroomId: string
  excludeId?: string // 수정 시 현재 시간표 제외
}

/**
 * 시간표 충돌 검증 (POST /api/schedules/validate)
 * 강사 및 강의실 시간 충돌을 실시간으로 확인
 */
export async function POST(request: NextRequest) {
  try {
    const data: ConflictValidationRequest = await request.json()
    console.log('시간표 충돌 검증 요청:', data)

    const { academyId, dayOfWeek, startTime, endTime, instructorId, classroomId, excludeId } = data

    // 필수 필드 검증
    if (!academyId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json({
        success: false,
        message: '필수 필드가 누락되었습니다.'
      }, { status: 400 })
    }

    const conflicts: any[] = []

    // 강사 충돌 검증
    if (instructorId) {
      let query = supabase
        .from('schedules')
        .select('*')
        .eq('academy_id', academyId)
        .eq('day_of_week', dayOfWeek)
        .eq('instructor_id', instructorId)
        .eq('is_active', true)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data: instructorConflicts } = await query

      if (instructorConflicts && instructorConflicts.length > 0) {
        for (const conflict of instructorConflicts) {
          if (timesOverlap(startTime, endTime, conflict.start_time, conflict.end_time)) {
            conflicts.push({
              type: 'instructor',
              message: `강사 시간 충돌: ${conflict.start_time} - ${conflict.end_time}`,
              conflictingSchedule: conflict
            })
          }
        }
      }
    }

    // 강의실 충돌 검증
    if (classroomId) {
      let query = supabase
        .from('schedules')
        .select('*')
        .eq('academy_id', academyId)
        .eq('day_of_week', dayOfWeek)
        .eq('classroom_id', classroomId)
        .eq('is_active', true)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data: classroomConflicts } = await query

      if (classroomConflicts && classroomConflicts.length > 0) {
        for (const conflict of classroomConflicts) {
          if (timesOverlap(startTime, endTime, conflict.start_time, conflict.end_time)) {
            conflicts.push({
              type: 'classroom',
              message: `강의실 시간 충돌: ${conflict.start_time} - ${conflict.end_time}`,
              conflictingSchedule: conflict
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts: conflicts,
        message: conflicts.length > 0 ? '시간 충돌이 감지되었습니다.' : '충돌이 없습니다.'
      }
    })

  } catch (error) {
    console.error('시간표 충돌 검증 중 오류:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// 시간 겹침 확인 헬퍼 함수
function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const startTime1 = timeToMinutes(start1)
  const endTime1 = timeToMinutes(end1)
  const startTime2 = timeToMinutes(start2)
  const endTime2 = timeToMinutes(end2)

  return (startTime1 < endTime2) && (endTime1 > startTime2)
}

// 시간 문자열을 분으로 변환
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * 지원하지 않는 HTTP 메서드 처리
 */
export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed. Use POST.'
  }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed. Use POST.'
  }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed. Use POST.'
  }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed. Use POST.'
  }, { status: 405 })
}