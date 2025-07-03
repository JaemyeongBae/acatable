// 학원 개별 조회 API
// 목적: 특정 학원의 상세 정보를 조회

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createSuccessResponse, createNotFoundResponse, createInternalServerErrorResponse } from '@/lib/api/response'

/**
 * 학원 개별 조회
 * GET /api/academies/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 학원 조회
    const academy = await prisma.academy.findUnique({
      where: {
        id: id
      },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        phone: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!academy) {
      return createNotFoundResponse('학원')
    }

    return createSuccessResponse(academy, '학원 조회 성공')

  } catch (error) {
    console.error('학원 조회 실패:', error)
    return createInternalServerErrorResponse(error)
  }
}