// 과목 API 엔드포인트 (GET, POST)
// 목적: 학원별 과목 조회 및 생성

import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { validateSubject, validateData } from '@/lib/validation/schemas'
import {
  createSuccessResponse,
  createCreatedResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createInternalServerErrorResponse,
  createMethodNotAllowedResponse
} from '@/lib/api/response'

/**
 * 과목 목록 조회 (GET /api/subjects)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const academyId = searchParams.get('academyId')

    if (!academyId) {
      return createErrorResponse('학원 ID는 필수입니다.', 400)
    }

    const subjects = await prisma.subject.findMany({
      where: { 
        academyId,
        isActive: true
      },
      orderBy: { name: 'asc' }
    })

    return createSuccessResponse(subjects, `${subjects.length}개의 과목을 조회했습니다.`)

  } catch (error) {
    console.error('과목 조회 중 오류:', error)
    return createInternalServerErrorResponse(error)
  }
}

/**
 * 새 과목 생성 (POST /api/subjects)
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // 입력 데이터 유효성 검증
    const validation = validateData(data, validateSubject)
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

    // 같은 학원 내 과목명 중복 확인
    const existingSubject = await prisma.subject.findFirst({
      where: {
        academyId: data.academyId,
        name: data.name,
        isActive: true
      }
    })

    if (existingSubject) {
      return createErrorResponse('이미 존재하는 과목명입니다.', 409)
    }

    // 과목 생성
    const newSubject = await prisma.subject.create({
      data: {
        name: data.name,
        color: data.color || '#3B82F6', // 기본 파란색
        academyId: data.academyId
      }
    })

    return createCreatedResponse(newSubject, '과목이 성공적으로 생성되었습니다.')

  } catch (error) {
    console.error('과목 생성 중 오류:', error)
    return createInternalServerErrorResponse(error)
  }
}

export async function PUT() {
  return createMethodNotAllowedResponse(['GET', 'POST'])
}

export async function DELETE() {
  return createMethodNotAllowedResponse(['GET', 'POST'])
} 