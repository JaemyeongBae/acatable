// 강사 목록 조회 API
// 목적: 학원별 강사 목록을 조회하는 엔드포인트

import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import {
  createSuccessResponse,
  createErrorResponse,
  createInternalServerErrorResponse
} from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const academyId = searchParams.get('academyId')

    if (!academyId) {
      return createErrorResponse('academyId가 필요합니다.', 400)
    }

    // 강사 목록 조회
    const instructors = await prisma.instructor.findMany({
      where: {
        academyId,
        isActive: true
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // 응답 데이터 변환
    const responseData = instructors.map((instructor: any) => ({
      id: instructor.id,
      name: instructor.user.name,
      email: instructor.user.email,
      specialties: instructor.specialties ? JSON.parse(instructor.specialties) : [],
      bio: instructor.bio,
      academyId: instructor.academyId,
      isActive: instructor.isActive,
      createdAt: instructor.createdAt,
      updatedAt: instructor.updatedAt
    }))

    return createSuccessResponse(
      responseData,
      `${responseData.length}명의 강사를 조회했습니다.`
    )

  } catch (error) {
    console.error('강사 목록 조회 실패:', error)
    return createInternalServerErrorResponse(error)
  }
} 