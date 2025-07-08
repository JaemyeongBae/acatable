// 메인 페이지 - 학원 검색 및 회원가입
// 목적: 학원 검색과 회원가입 진입점 제공

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// 학원 검색 결과 타입
interface AcademySearchResult {
  academyId: string
  academyName: string
  academyCode: string
  createdAt: string
}

export default function HomePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<AcademySearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResults, setShowResults] = useState(false)

  // 검색 함수
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('검색어를 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/academies/search?q=${encodeURIComponent(searchTerm.trim())}`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.data || [])
        setShowResults(true)
      } else {
        setError(data.message || '검색 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 엔터키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 학원 선택
  const handleAcademySelect = (academyCode: string) => {
    router.push(`/${academyCode}`)
  }

  // 검색어 변경 시 결과 숨기기
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setShowResults(false)
      setSearchResults([])
    }
  }, [searchTerm])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">우리학원시간표</h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            학원 시간표를 쉽고 빠르게
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            학원명을 검색하여 시간표를 확인하거나, 새로운 학원을 등록하세요
          </p>
        </div>

        {/* 검색 섹션 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="학원명을 검색하세요!"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '검색 중...' : '검색'}
            </button>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* 검색 결과 */}
          {showResults && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                검색 결과 ({searchResults.length}개)
              </h3>
              
              {searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">검색된 학원이 없습니다.</p>
                  <p className="text-sm text-gray-400">
                    새로운 학원을 등록해보세요!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((academy) => (
                    <div
                      key={academy.academyId}
                      onClick={() => handleAcademySelect(academy.academyCode)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {academy.academyName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            학원 ID: {academy.academyCode}
                          </p>
                        </div>
                        <div className="text-blue-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 회원가입 섹션 */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            새로운 학원 등록
          </h3>
          <p className="text-gray-600 mb-6">
            우리 학원의 시간표 관리를 시작해보세요
          </p>
          <Link
            href="/signin"
            className="inline-block px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            학원 회원가입
          </Link>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 우리학원시간표. All rights reserved.</p>
            <p className="mt-2">배포 URL: table.acatools.co.kr</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 