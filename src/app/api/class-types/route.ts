// 수업 유형 목록 조회 API
// 목적: 학원별 수업 유형 목록을 조회하는 엔드포인트

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

    // 수업 유형 목록 조회
    const classTypes = await prisma.classType.findMany({
      where: {
        academyId,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return createSuccessResponse(
      classTypes,
      `${classTypes.length}개의 수업 유형을 조회했습니다.`
    )

  } catch (error) {
    console.error('수업 유형 목록 조회 실패:', error)
    return createInternalServerErrorResponse(error)
  }
} 