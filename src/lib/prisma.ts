// Prisma 클라이언트 설정 및 싱글톤 패턴 구현
// 목적: 데이터베이스 연결 최적화 및 Next.js 환경에서의 안정적인 DB 접근

import { PrismaClient } from '@prisma/client'

// 전역 타입 선언 (Next.js 개발 환경에서 Hot Reload 시 중복 연결 방지)
declare global {
  var prisma: PrismaClient | undefined
}

// Prisma 클라이언트 싱글톤 인스턴스
const prisma = globalThis.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'], // 개발 환경에서 쿼리 로깅
})

// 개발 환경에서만 global에 할당하여 Hot Reload 시 중복 생성 방지
if (process.env.NODE_ENV === 'development') {
  globalThis.prisma = prisma
}

export default prisma

// ==========================================
// 데이터베이스 연결 헬퍼 함수들
// ==========================================

/**
 * 데이터베이스 연결 상태 확인
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

/**
 * Prisma 클라이언트 정리 (앱 종료 시 호출)
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}

// ==========================================
// 트랜잭션 헬퍼 함수들
// ==========================================

/**
 * 트랜잭션 실행 헬퍼
 * @param callback 트랜잭션 내에서 실행할 함수
 * @returns 트랜잭션 결과
 */
export async function executeTransaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback)
}

// ==========================================
// 쿼리 최적화 헬퍼들
// ==========================================

/**
 * 기본 포함 관계 설정 (성능 최적화)
 */
export const defaultScheduleInclude = {
  academy: true,
  subject: true,
  instructor: {
    include: {
      user: true
    }
  },
  classroom: true,
  classType: true,
  studentSchedules: {
    include: {
      user: true
    }
  }
} as const

/**
 * 사용자별 포함 관계 설정
 */
export const userWithProfileInclude = {
  academy: true,
  instructorProfile: true
} as const 