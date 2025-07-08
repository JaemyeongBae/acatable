// 인증 관련 유틸리티 함수
// 목적: 세션 관리 및 인증 검증

import { cookies } from 'next/headers'

// 세션 데이터 타입 정의
export interface SessionData {
  accountId: string
  academyId: string
  academyName: string
  academyCode: string
  loginTime: number
}

// 세션 쿠키에서 데이터 가져오기
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('academy_session')
    
    if (!sessionCookie?.value) {
      return null
    }
    
    const sessionData: SessionData = JSON.parse(sessionCookie.value)
    
    // 세션 유효성 검사 (7일 후 만료)
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7일 (밀리초)
    if (Date.now() - sessionData.loginTime > maxAge) {
      return null
    }
    
    return sessionData
  } catch (error) {
    console.error('세션 데이터 파싱 오류:', error)
    return null
  }
}

// 로그인 상태 확인
export async function isAuthenticated(): Promise<boolean> {
  return (await getSession()) !== null
}

// 특정 학원에 대한 권한 확인
export async function hasAcademyAccess(academyCode: string): Promise<boolean> {
  const session = await getSession()
  return session?.academyCode === academyCode
}

// 세션에서 학원 정보 가져오기
export async function getAcademyFromSession(): Promise<{ academyId: string; academyCode: string; academyName: string } | null> {
  const session = await getSession()
  if (!session) return null
  
  return {
    academyId: session.academyId,
    academyCode: session.academyCode,
    academyName: session.academyName
  }
}

// 인증이 필요한 API에서 사용할 미들웨어 함수
export async function requireAuth(): Promise<SessionData> {
  const session = await getSession()
  if (!session) {
    throw new Error('인증이 필요합니다.')
  }
  return session
}

// 특정 학원 접근 권한 검증
export async function requireAcademyAccess(academyCode: string): Promise<SessionData> {
  const session = await requireAuth()
  if (session.academyCode !== academyCode) {
    throw new Error('해당 학원에 대한 접근 권한이 없습니다.')
  }
  return session
}