// 강의실 API 엔드포인트 (GET, POST)
// 목적: 학원별 강의실 조회 및 생성

import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { validateClassroom, validateData } from '@/lib/validation/schemas'
import {
  createSuccessResponse,
  createCreatedResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createInternalServerErrorResponse,
  createMethodNotAllowedResponse
} from '@/lib/api/response'

/**
 * 강의실 목록 조회 (GET /api/classrooms)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const academyId = searchParams.get('academyId')

    if (!academyId) {
      return createErrorResponse('학원 ID는 필수입니다.', 400)
    }

    const classrooms = await prisma.classroom.findMany({
      where: { 
        academyId,
        isActive: true
      },
      orderBy: [
        { floor: 'asc' },
        { name: 'asc' }
      ]
    })

    return createSuccessResponse(classrooms, `${classrooms.length}개의 강의실을 조회했습니다.`)

  } catch (error) {
    console.error('강의실 조회 중 오류:', error)
    return createInternalServerErrorResponse(error)
  }
}

/**
 * 새 강의실 생성 (POST /api/classrooms)
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // 입력 데이터 유효성 검증
    const validation = validateData(data, validateClassroom)
    if (!validation.isValid) {
      return createValidationErrorResponse(validation.errors)
    }

    // 학원 존재 확인
    const academy = await prisma.academy.findUnique({
      where: { id: data.academyId }
    })

    if (!academy) {
      return createErrorResponse('존재하지 않는 학원입니다.', 404)
    }

    // 같은 학원 내 강의실명 중복 확인
    const existingClassroom = await prisma.classroom.findFirst({
      where: {
        academyId: data.academyId,
        name: data.name,
        isActive: true
      }
    })

    if (existingClassroom) {
      return createErrorResponse('이미 존재하는 강의실명입니다.', 409)
    }

    // 강의실 생성
    const newClassroom = await prisma.classroom.create({
      data: {
        name: data.name,
        capacity: data.capacity || null,
        floor: data.floor || null,
        location: data.location || null,
        academyId: data.academyId
      }
    })

    return createCreatedResponse(newClassroom, '강의실이 성공적으로 생성되었습니다.')

  } catch (error) {
    console.error('강의실 생성 중 오류:', error)
    return createInternalServerErrorResponse(error)
  }
}

export async function PUT() {
  return createMethodNotAllowedResponse(['GET', 'POST'])
}

export async function DELETE() {
  return createMethodNotAllowedResponse(['GET', 'POST'])
} 