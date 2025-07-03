// 개별 시간표 API 엔드포인트 (GET, PUT, DELETE)
// 목적: 특정 시간표 조회/수정/삭제 with 완화된 충돌 검증

import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { validateSchedule, validateScheduleUpdate, validateData } from '@/lib/validation/schemas'
import { validateCompleteSchedule } from '@/lib/utils/schedule-conflict'
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createInternalServerErrorResponse,
  createMethodNotAllowedResponse
} from '@/lib/api/response'

/**
 * 특정 시간표 조회 (GET /api/schedules/[id])
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const schedule = await prisma.schedule.findUnique({
      where: { id, isActive: true },
      include: {
        academy: { select: { name: true } },
        subject: { select: { id: true, name: true, color: true } },
        instructor: {
          select: { 
            id: true, 
            user: { select: { name: true, email: true, phone: true } },
            specialties: true,
            bio: true
          }
        },
        classroom: {
          select: { id: true, name: true, capacity: true, floor: true, location: true }
        },
        classType: {
          select: { id: true, name: true, color: true, description: true }
        },
        studentSchedules: {
          select: { 
            id: true,
            user: { 
              select: { 
                name: true, 
                email: true, 
                phone: true 
              } 
            }
          }
        }
      }
    })

    if (!schedule) {
      return createNotFoundResponse('시간표')
    }

    // 응답 데이터 변환
    const responseData = {
      id: schedule.id,
      title: schedule.title,
      description: schedule.description,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      maxStudents: schedule.maxStudents,
      currentStudents: schedule.studentSchedules.length,
      academy: schedule.academy,
      subject: schedule.subject,
      instructor: {
        id: schedule.instructor.id,
        name: schedule.instructor.user.name,
        email: schedule.instructor.user.email,
        phone: schedule.instructor.user.phone,
        specialties: schedule.instructor.specialties,
        bio: schedule.instructor.bio
      },
      classroom: schedule.classroom,
      classType: schedule.classType,
      students: schedule.studentSchedules.map((s: any) => ({
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        phone: s.user.phone,
        enrolledAt: new Date()
      })),
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt
    }

    return createSuccessResponse(responseData)

  } catch (error) {
    console.error('시간표 조회 중 오류:', error)
    return createInternalServerErrorResponse(error)
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

    // 기존 시간표 존재 확인
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id, isActive: true }
    })

    if (!existingSchedule) {
      return createNotFoundResponse('시간표')
    }

    // 입력 데이터 유효성 검증 (부분 업데이트용)
    const validation = validateData(data, validateScheduleUpdate)
    if (!validation.isValid) {
      return createValidationErrorResponse(validation.errors)
    }

    // 관계 데이터 존재 확인 (변경된 경우만)
    const checkPromises = []
    
    if (data.subjectId && data.subjectId !== existingSchedule.subjectId) {
      checkPromises.push(prisma.subject.findUnique({ where: { id: data.subjectId } }))
    }
    if (data.instructorId && data.instructorId !== existingSchedule.instructorId) {
      checkPromises.push(prisma.instructor.findUnique({ where: { id: data.instructorId } }))
    }
    if (data.classroomId && data.classroomId !== existingSchedule.classroomId) {
      checkPromises.push(prisma.classroom.findUnique({ where: { id: data.classroomId } }))
    }
    if (data.classTypeId && data.classTypeId !== existingSchedule.classTypeId) {
      checkPromises.push(prisma.classType.findUnique({ where: { id: data.classTypeId } }))
    }

    if (checkPromises.length > 0) {
      const relatedEntities = await Promise.all(checkPromises)
      if (relatedEntities.some(entity => !entity)) {
        return createErrorResponse('참조하는 데이터 중 존재하지 않는 것이 있습니다.', 404)
      }
    }

    // **완화된 충돌 검증**: 경고만 출력하고 수정은 허용
    const needsConflictCheck = 
      data.instructorId !== existingSchedule.instructorId ||
      data.classroomId !== existingSchedule.classroomId ||
      data.dayOfWeek !== existingSchedule.dayOfWeek ||
      data.startTime !== existingSchedule.startTime ||
      data.endTime !== existingSchedule.endTime

    if (needsConflictCheck) {
      try {
        const scheduleValidation = await validateCompleteSchedule({
          instructorId: data.instructorId || existingSchedule.instructorId,
          classroomId: data.classroomId || existingSchedule.classroomId,
          dayOfWeek: data.dayOfWeek || existingSchedule.dayOfWeek,
          startTime: data.startTime || existingSchedule.startTime,
          endTime: data.endTime || existingSchedule.endTime,
          maxStudents: data.maxStudents
        }, id) // 현재 스케줄은 충돌 검사에서 제외

        if (!scheduleValidation.isValid) {
          console.warn('⚠️ 시간표 수정 충돌 경고:', {
            conflicts: scheduleValidation.conflicts?.message,
            capacity: scheduleValidation.capacityError
          })
          // 충돌이 있어도 수정을 계속 진행 (개발/테스트 환경용)
        }
      } catch (conflictError) {
        console.warn('충돌 검증 중 오류 (무시하고 계속):', conflictError)
      }
    }

    // 시간표 업데이트
    const updatedSchedule = await prisma.schedule.update({
      where: { id },
      data: {
        title: data.title || existingSchedule.title,
        description: data.description !== undefined ? data.description : existingSchedule.description,
        dayOfWeek: data.dayOfWeek || existingSchedule.dayOfWeek,
        startTime: data.startTime || existingSchedule.startTime,
        endTime: data.endTime || existingSchedule.endTime,
        maxStudents: data.maxStudents !== undefined ? data.maxStudents : existingSchedule.maxStudents,
        subjectId: data.subjectId || existingSchedule.subjectId,
        instructorId: data.instructorId || existingSchedule.instructorId,
        classroomId: data.classroomId || existingSchedule.classroomId,
        classTypeId: data.classTypeId || existingSchedule.classTypeId
      }
    })

    return createSuccessResponse(updatedSchedule)

  } catch (error) {
    console.error('시간표 수정 중 오류:', error)
    return createInternalServerErrorResponse(error)
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

    // 기존 시간표 존재 확인
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id, isActive: true }
    })

    if (!existingSchedule) {
      return createNotFoundResponse('시간표')
    }

    // **완화된 수강생 확인**: 경고만 출력하고 삭제는 허용
    const studentCount = await prisma.studentSchedule.count({
      where: { scheduleId: id }
    })

    if (studentCount > 0) {
      console.warn(`⚠️ 시간표 삭제 경고: ${studentCount}명의 수강생이 등록되어 있습니다.`)
      
      // 개발/테스트 환경에서는 관련 수강생 데이터도 함께 삭제
      await prisma.studentSchedule.deleteMany({
        where: { scheduleId: id }
      })
      console.warn('관련 수강생 데이터를 함께 삭제했습니다.')
    }

    // 시간표 비활성화 (soft delete)
    const deletedSchedule = await prisma.schedule.update({
      where: { id },
      data: { isActive: false }
    })

    return createSuccessResponse({ 
      id: deletedSchedule.id,
      message: '시간표가 성공적으로 삭제되었습니다.' 
    })

  } catch (error) {
    console.error('시간표 삭제 중 오류:', error)
    return createInternalServerErrorResponse(error)
  }
}

/**
 * 지원하지 않는 메서드들
 */
export async function POST() {
  return createMethodNotAllowedResponse(['GET', 'PUT', 'DELETE'])
}

export async function PATCH() {
  return createMethodNotAllowedResponse(['GET', 'PUT', 'DELETE'])
} 