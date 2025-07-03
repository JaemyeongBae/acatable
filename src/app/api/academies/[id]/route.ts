// 학원 개별 조회 API
// 목적: 특정 학원의 상세 정보를 조회

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { apiResponse } from '@/lib/api/response'

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
      return NextResponse.json(
        apiResponse(false, null, '학원을 찾을 수 없습니다'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      apiResponse(true, academy, '학원 조회 성공')
    )

  } catch (error) {
    console.error('학원 조회 실패:', error)
    return NextResponse.json(
      apiResponse(false, null, '학원 조회 중 오류가 발생했습니다'),
      { status: 500 }
    )
  }
}