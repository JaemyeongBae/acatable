// 시간표 충돌 검증 로직
// 목적: 강사/강의실 시간 충돌 방지 및 실시간 검증

import prisma from '@/lib/prisma'
import { DayOfWeek } from '@/types'

/**
 * 시간 충돌 검증 결과 타입
 */
export interface ConflictCheckResult {
  hasConflict: boolean
  conflictType?: 'INSTRUCTOR' | 'CLASSROOM' | 'BOTH'
  conflictingSchedules?: Array<{
    id: string
    title: string
    startTime: string
    endTime: string
    instructor?: { name: string }
    classroom?: { name: string }
  }>
  message?: string
}

/**
 * 시간 겹침 여부를 확인합니다
 * @param start1 첫 번째 시간 범위의 시작 시간
 * @param end1 첫 번째 시간 범위의 종료 시간
 * @param start2 두 번째 시간 범위의 시작 시간
 * @param end2 두 번째 시간 범위의 종료 시간
 */
function isTimeOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
  const startTime1 = new Date(`1970-01-01T${start1}:00`)
  const endTime1 = new Date(`1970-01-01T${end1}:00`)
  const startTime2 = new Date(`1970-01-01T${start2}:00`)
  const endTime2 = new Date(`1970-01-01T${end2}:00`)

  // 시간 겹침 조건: (start1 < end2) && (start2 < end1)
  return startTime1 < endTime2 && startTime2 < endTime1
}

/**
 * 강사 시간 충돌을 검사합니다
 * @param instructorId 강사 ID
 * @param dayOfWeek 요일
 * @param startTime 시작 시간
 * @param endTime 종료 시간
 * @param excludeScheduleId 제외할 스케줄 ID (수정 시 사용)
 */
export async function checkInstructorConflict(
  instructorId: string,
  dayOfWeek: DayOfWeek,
  startTime: string,
  endTime: string,
  excludeScheduleId?: string
): Promise<ConflictCheckResult> {
  try {
    // 같은 요일, 같은 강사의 기존 스케줄 조회
    const existingSchedules = await prisma.schedule.findMany({
      where: {
        instructorId,
        dayOfWeek,
        isActive: true,
        ...(excludeScheduleId && { id: { not: excludeScheduleId } })
      },
      include: {
        instructor: { select: { user: { select: { name: true } } } },
        classroom: { select: { name: true } }
      }
    })

    // 시간 겹침 확인
    const conflictingSchedules = existingSchedules.filter((schedule: any) => 
      isTimeOverlapping(startTime, endTime, schedule.startTime, schedule.endTime)
    )

    if (conflictingSchedules.length > 0) {
      return {
        hasConflict: true,
        conflictType: 'INSTRUCTOR',
        conflictingSchedules: conflictingSchedules.map((schedule: any) => ({
          id: schedule.id,
          title: schedule.title,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          instructor: { name: schedule.instructor.user.name },
          classroom: { name: schedule.classroom.name }
        })),
        message: `강사 시간이 겹칩니다. 충돌하는 강의: ${conflictingSchedules.map((s: any) => s.title).join(', ')}`
      }
    }

    return { hasConflict: false }
  } catch (error) {
    console.error('강사 충돌 검사 중 오류:', error)
    throw new Error('강사 충돌 검사 중 오류가 발생했습니다.')
  }
}

/**
 * 강의실 시간 충돌을 검사합니다
 * @param classroomId 강의실 ID
 * @param dayOfWeek 요일
 * @param startTime 시작 시간
 * @param endTime 종료 시간
 * @param excludeScheduleId 제외할 스케줄 ID (수정 시 사용)
 */
export async function checkClassroomConflict(
  classroomId: string,
  dayOfWeek: DayOfWeek,
  startTime: string,
  endTime: string,
  excludeScheduleId?: string
): Promise<ConflictCheckResult> {
  try {
    // 같은 요일, 같은 강의실의 기존 스케줄 조회
    const existingSchedules = await prisma.schedule.findMany({
      where: {
        classroomId,
        dayOfWeek,
        isActive: true,
        ...(excludeScheduleId && { id: { not: excludeScheduleId } })
      },
      include: {
        instructor: { select: { user: { select: { name: true } } } },
        classroom: { select: { name: true } }
      }
    })

    // 시간 겹침 확인
    const conflictingSchedules = existingSchedules.filter((schedule: any) => 
      isTimeOverlapping(startTime, endTime, schedule.startTime, schedule.endTime)
    )

    if (conflictingSchedules.length > 0) {
      return {
        hasConflict: true,
        conflictType: 'CLASSROOM',
        conflictingSchedules: conflictingSchedules.map((schedule: any) => ({
          id: schedule.id,
          title: schedule.title,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          instructor: { name: schedule.instructor.user.name },
          classroom: { name: schedule.classroom.name }
        })),
        message: `강의실 시간이 겹칩니다. 충돌하는 강의: ${conflictingSchedules.map((s: any) => s.title).join(', ')}`
      }
    }

    return { hasConflict: false }
  } catch (error) {
    console.error('강의실 충돌 검사 중 오류:', error)
    throw new Error('강의실 충돌 검사 중 오류가 발생했습니다.')
  }
}

/**
 * 종합적인 시간표 충돌을 검사합니다 (강사 + 강의실)
 * @param scheduleData 스케줄 데이터
 * @param excludeScheduleId 제외할 스케줄 ID (수정 시 사용)
 */
export async function checkScheduleConflict(
  scheduleData: {
    instructorId: string
    classroomId: string
    dayOfWeek: DayOfWeek
    startTime: string
    endTime: string
  },
  excludeScheduleId?: string
): Promise<ConflictCheckResult> {
  try {
    const { instructorId, classroomId, dayOfWeek, startTime, endTime } = scheduleData

    // 강사 충돌 검사
    const instructorConflict = await checkInstructorConflict(
      instructorId, dayOfWeek, startTime, endTime, excludeScheduleId
    )

    // 강의실 충돌 검사
    const classroomConflict = await checkClassroomConflict(
      classroomId, dayOfWeek, startTime, endTime, excludeScheduleId
    )

    // 충돌 결과 통합
    if (instructorConflict.hasConflict && classroomConflict.hasConflict) {
      return {
        hasConflict: true,
        conflictType: 'BOTH',
        conflictingSchedules: [
          ...(instructorConflict.conflictingSchedules || []),
          ...(classroomConflict.conflictingSchedules || [])
        ],
        message: '강사와 강의실 모두 시간이 겹칩니다.'
      }
    } else if (instructorConflict.hasConflict) {
      return instructorConflict
    } else if (classroomConflict.hasConflict) {
      return classroomConflict
    }

    return { hasConflict: false }
  } catch (error) {
    console.error('시간표 충돌 검사 중 오류:', error)
    throw new Error('시간표 충돌 검사 중 오류가 발생했습니다.')
  }
}

/**
 * 스케줄 수용인원 검증
 * @param classroomId 강의실 ID
 * @param maxStudents 수업 최대 인원
 */
export async function validateScheduleCapacity(
  classroomId: string,
  maxStudents?: number
): Promise<{ isValid: boolean; message?: string }> {
  try {
    if (!maxStudents) {
      return { isValid: true }
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { capacity: true, name: true }
    })

    if (!classroom) {
      return { isValid: false, message: '존재하지 않는 강의실입니다.' }
    }

    if (classroom.capacity && maxStudents > classroom.capacity) {
      return {
        isValid: false,
        message: `강의실 수용인원(${classroom.capacity}명)을 초과했습니다. 최대 인원을 ${classroom.capacity}명 이하로 설정해주세요.`
      }
    }

    return { isValid: true }
  } catch (error) {
    console.error('수용인원 검증 중 오류:', error)
    return { isValid: false, message: '수용인원 검증 중 오류가 발생했습니다.' }
  }
}

/**
 * 시간표 생성/수정 전 종합 검증
 * @param scheduleData 스케줄 데이터
 * @param excludeScheduleId 제외할 스케줄 ID (수정 시 사용)
 */
export async function validateCompleteSchedule(
  scheduleData: {
    instructorId: string
    classroomId: string
    dayOfWeek: DayOfWeek
    startTime: string
    endTime: string
    maxStudents?: number
  },
  excludeScheduleId?: string
): Promise<{
  isValid: boolean
  conflicts?: ConflictCheckResult
  capacityError?: string
}> {
  try {
    // 시간 충돌 검사
    const conflicts = await checkScheduleConflict(scheduleData, excludeScheduleId)
    
    // 수용인원 검증
    const capacityCheck = await validateScheduleCapacity(scheduleData.classroomId, scheduleData.maxStudents)

    return {
      isValid: !conflicts.hasConflict && capacityCheck.isValid,
      ...(conflicts.hasConflict && { conflicts }),
      ...(capacityCheck.message && { capacityError: capacityCheck.message })
    }
  } catch (error) {
    console.error('종합 스케줄 검증 중 오류:', error)
    throw new Error('스케줄 검증 중 오류가 발생했습니다.')
  }
} 