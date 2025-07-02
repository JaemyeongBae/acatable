// API 응답 표준화 헬퍼 함수들
// 목적: 일관된 API 응답 형식 및 에러 처리

import { NextResponse } from 'next/server'
import { ApiResponse, ValidationError } from '@/types'

/**
 * 성공 응답을 생성합니다
 * @param data 응답 데이터
 * @param message 성공 메시지 (선택사항)
 * @param status HTTP 상태 코드 (기본: 200)
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  )
}

/**
 * 생성 성공 응답을 생성합니다 (201 Created)
 * @param data 생성된 데이터
 * @param message 성공 메시지
 */
export function createCreatedResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return createSuccessResponse(data, message, 201)
}

/**
 * 에러 응답을 생성합니다
 * @param error 에러 메시지
 * @param status HTTP 상태 코드 (기본: 400)
 * @param details 추가 에러 정보
 */
export function createErrorResponse(
  error: string,
  status: number = 400,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status }
  )
}

/**
 * 유효성 검증 에러 응답을 생성합니다
 * @param errors 유효성 검증 에러 배열
 */
export function createValidationErrorResponse(
  errors: ValidationError[]
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: '입력 데이터가 올바르지 않습니다.',
      details: { validationErrors: errors },
    },
    { status: 422 }
  )
}

/**
 * 인증되지 않은 사용자 에러 응답
 */
export function createUnauthorizedResponse(): NextResponse<ApiResponse> {
  return createErrorResponse('인증이 필요합니다.', 401)
}

/**
 * 권한 없음 에러 응답
 */
export function createForbiddenResponse(): NextResponse<ApiResponse> {
  return createErrorResponse('접근 권한이 없습니다.', 403)
}

/**
 * 리소스를 찾을 수 없음 에러 응답
 * @param resource 리소스 명
 */
export function createNotFoundResponse(resource: string = '리소스'): NextResponse<ApiResponse> {
  return createErrorResponse(`${resource}를 찾을 수 없습니다.`, 404)
}

/**
 * 서버 내부 에러 응답
 * @param error 에러 객체 (개발 환경에서만 노출)
 */
export function createInternalServerErrorResponse(error?: any): NextResponse<ApiResponse> {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return NextResponse.json(
    {
      success: false,
      error: '서버 내부 오류가 발생했습니다.',
      ...(isDevelopment && error && { details: { error: error.message } }),
    },
    { status: 500 }
  )
}

/**
 * HTTP 메서드가 허용되지 않음 응답
 * @param allowedMethods 허용된 HTTP 메서드들
 */
export function createMethodNotAllowedResponse(allowedMethods: string[]): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: `허용되지 않은 HTTP 메서드입니다. 허용된 메서드: ${allowedMethods.join(', ')}`,
    },
    { 
      status: 405,
      headers: {
        'Allow': allowedMethods.join(', ')
      }
    }
  )
} 