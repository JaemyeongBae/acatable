// 마이페이지
// 목적: 비밀번호 인증 후 학원 정보 관리 및 설정 기능 제공

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PresetManager from '@/components/preset/PresetManager'

interface AcademyInfo {
  academyId: string
  academyName: string
  academyCode: string
  address?: string
  email?: string
  phone?: string
}

export default function MyPage() {
  const params = useParams()
  const router = useRouter()
  const academyCode = params.academyCode as string
  
  // 상태 관리
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [academyInfo, setAcademyInfo] = useState<AcademyInfo | null>(null)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPresetSettings, setShowPresetSettings] = useState(false)

  // 학원 정보 로딩
  useEffect(() => {
    const fetchAcademyInfo = async () => {
      try {
        const response = await fetch(`/api/academies/${academyCode}`)
        const data = await response.json()
        
        if (data.success) {
          setAcademyInfo({
            academyId: data.data.academyId,
            academyName: data.data.academyName,
            academyCode: data.data.academyCode,
            address: data.data.address,
            email: data.data.email,
            phone: data.data.phone
          })
        } else {
          setError('학원 정보를 찾을 수 없습니다.')
        }
      } catch (err) {
        setError('학원 정보를 불러오는 중 오류가 발생했습니다.')
      }
    }

    if (academyCode) {
      fetchAcademyInfo()
    }
  }, [academyCode])

  // 비밀번호 검증
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academyCode,
          password: password.trim()
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsAuthenticated(true)
        // 추가 학원 정보 업데이트
        if (data.data) {
          setAcademyInfo(prev => ({
            ...prev!,
            academyId: data.data.academyId,
            academyName: data.data.academyName
          }))
        }
      } else {
        setError(data.message || '비밀번호가 틀렸습니다.')
        setPassword('') // 비밀번호 입력 필드 초기화
      }
    } catch (err) {
      setError('인증 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 비밀번호 입력 화면
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* 헤더 */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">관리자 인증</h1>
              <p className="text-gray-600">
                {academyInfo?.academyName || academyCode} 마이페이지
              </p>
              <p className="text-sm text-gray-500 mt-2">
                관리자 비밀번호를 입력하세요
              </p>
            </div>

            {/* 비밀번호 입력 폼 */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  관리자 비밀번호
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="비밀번호 입력 (6자리 이상)"
                  disabled={isLoading}
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '인증 중...' : '확인'}
              </button>
            </form>

            {/* 돌아가기 링크 */}
            <div className="mt-6 text-center">
              <Link 
                href={`/${academyCode}`}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← 시간표 페이지로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 인증 성공 후 마이페이지 화면
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/${academyCode}`} className="text-green-600 hover:text-green-700 text-sm font-medium">
                ← 시간표 페이지로 돌아가기
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">
                {academyInfo?.academyName} 마이페이지
              </h1>
              <p className="text-gray-600 mt-1">
                학원 정보 관리 및 설정
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href={`/${academyCode}/edit`}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                시간표 수정
              </Link>
              <div className="bg-green-100 px-3 py-1 rounded-full">
                <span className="text-green-800 text-sm font-medium">관리자 모드</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 학원 정보 카드 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">학원 정보</h2>
                <span className="text-sm text-gray-500">기본 정보</span>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">학원명</h3>
                    <p className="text-lg text-gray-900">{academyInfo?.academyName}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">학원 ID</h3>
                    <p className="text-lg text-gray-900 font-mono">{academyInfo?.academyCode}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">시간표 URL</h3>
                  <p className="text-lg text-blue-600 font-mono">
                    table.acatools.co.kr/{academyInfo?.academyCode}
                  </p>
                </div>
                
                {academyInfo?.address && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">주소</h3>
                    <p className="text-lg text-gray-900">{academyInfo.address}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {academyInfo?.email && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">이메일</h3>
                      <p className="text-lg text-gray-900">{academyInfo.email}</p>
                    </div>
                  )}
                  {academyInfo?.phone && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">전화번호</h3>
                      <p className="text-lg text-gray-900">{academyInfo.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 관리 메뉴 */}
          <div className="space-y-6">
            {/* 빠른 실행 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">빠른 실행</h2>
              <div className="space-y-3">
                <Link
                  href={`/${academyCode}/edit`}
                  className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <span className="font-medium text-blue-900">시간표 수정</span>
                  </div>
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                
                <Link
                  href={`/${academyCode}`}
                  className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 0v8m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-medium text-green-900">시간표 보기</span>
                  </div>
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* 시스템 정보 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">시스템 정보</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">버전</span>
                  <span className="text-gray-900 font-medium">v1.3.4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">플랫폼</span>
                  <span className="text-gray-900 font-medium">AcaTools</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">상태</span>
                  <span className="text-green-600 font-medium">● 정상</span>
                </div>
              </div>
            </div>

            {/* 시간표 프리셋 설정 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">시간표 프리셋 설정</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setShowPresetSettings(true)}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="font-medium text-purple-900">프리셋 관리</span>
                  </div>
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <p className="text-sm text-gray-600 px-3">
                  과목, 강사, 강의실, 수업종류를 미리 설정하여 시간표 작성을 편리하게 하세요.
                </p>
              </div>
            </div>

            {/* 개발 중 기능 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">개발 중 기능</h2>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-1">🔧 정보 수정</h3>
                  <p className="text-sm text-gray-600">학원 정보 변경 기능</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-1">📊 사용량 통계</h3>
                  <p className="text-sm text-gray-600">시간표 조회 및 사용 통계</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-1">🎨 테마 설정</h3>
                  <p className="text-sm text-gray-600">시간표 색상 및 테마 관리</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 프리셋 설정 모달 */}
      {showPresetSettings && academyInfo && (
        <PresetManager
          academyId={academyInfo.academyId}
          onClose={() => setShowPresetSettings(false)}
        />
      )}
    </div>
  )
}