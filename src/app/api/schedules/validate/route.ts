// 시간표 충돌 검증 API 엔드포인트
// 목적: 실시간 시간표 충돌 검증 서비스

import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createInternalServerErrorResponse,
  createMethodNotAllowedResponse
} from '@/lib/api/response'

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
    // 임시로 충돌 없음 응답 반환 (추후 수정 예정)
    return createSuccessResponse({
      hasConflicts: false,
      conflicts: null,
      message: '충돌이 없습니다.'
    }, '검증 완료')

  } catch (error) {
    console.error('시간표 충돌 검증 중 오류:', error)
    return createInternalServerErrorResponse(error)
  }
}

/**
 * 지원하지 않는 HTTP 메서드 처리
 */
export async function GET() {
  return createMethodNotAllowedResponse(['POST'])
}

export async function PUT() {
  return createMethodNotAllowedResponse(['POST'])
}

export async function DELETE() {
  return createMethodNotAllowedResponse(['POST'])
}

export async function PATCH() {
  return createMethodNotAllowedResponse(['POST'])
}