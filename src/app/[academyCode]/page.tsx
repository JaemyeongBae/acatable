// 학원별 시간표 조회 페이지
// 목적: 특정 학원의 시간표를 조회하고 관리 기능 제공

'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CalendarView from '@/components/schedule/CalendarView'
import ScheduleGridView from '@/components/schedule/ScheduleGridView'
import ScheduleDetailModal from '@/components/schedule/ScheduleDetailModal'
import Button from '@/components/ui/Button'
import { DayOfWeek } from '@/types'

interface FilterOptions {
  instructors: { id: string; name: string }[]
  classrooms: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
}

interface AcademyInfo {
  academyId: string
  academyName: string
  academyCode: string
  address?: string
  email?: string
  phone?: string
}

export default function AcademyPage() {
  const params = useParams()
  const router = useRouter()
  const academyCode = params.academyCode as string
  
  // 상태 관리
  const [academyInfo, setAcademyInfo] = useState<AcademyInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // 시간표 뷰 관련 상태
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'grid'>('grid')
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY')
  const [isMobile, setIsMobile] = useState(false)
  
  // 필터 관련 상태
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<{
    dayOfWeek?: DayOfWeek[]
    instructorIds?: string[]
    classroomIds?: string[]
    subjectIds?: string[]
  }>({})
  
  // 모달 관련 상태
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // 클라이언트 사이드 체크 (hydration 에러 방지)
  const [isClient, setIsClient] = useState(false)
  
  // 필터 옵션
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    instructors: [],
    classrooms: [],
    subjects: []
  })

  // 클라이언트 사이드 확인
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 모바일 감지 및 현재 요일 설정
  useEffect(() => {
    if (!isClient) return
    
    const checkMobileAndSetDay = () => {
      // 모바일 기기 감지
      const isMobileDevice = window.innerWidth <= 768
      setIsMobile(isMobileDevice)
      
      // 현재 요일 계산
      const today = new Date()
      const dayOfWeek = today.getDay() // 0 = 일요일, 1 = 월요일, ..., 6 = 토요일
      const dayMapping: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
      const currentDay = dayMapping[dayOfWeek]
      
      // 모바일에서는 그리드 뷰를 기본으로 설정하고 현재 요일로 필터
      if (isMobileDevice) {
        setViewMode('grid')
        setSelectedDay(currentDay)
        setFilters(prev => ({
          ...prev,
          dayOfWeek: [currentDay]
        }))
      }
    }
    
    checkMobileAndSetDay()
    
    // 윈도우 리사이즈 이벤트 리스너
    const handleResize = () => {
      const isMobileDevice = window.innerWidth <= 768
      setIsMobile(isMobileDevice)
      
      if (isMobileDevice && viewMode !== 'grid') {
        setViewMode('grid')
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [viewMode, isClient])

  // 학원 정보 및 필터 옵션 로딩
  useEffect(() => {
    const fetchData = async () => {
      if (!academyCode) return
      
      setIsLoading(true)
      setError('')
      
      try {
        // 학원 정보 조회
        const academyResponse = await fetch(`/api/academies/${academyCode}`)
        const academyData = await academyResponse.json()
        
        if (!academyData.success) {
          setError('존재하지 않는 학원입니다.')
          return
        }
        
        setAcademyInfo(academyData.data)
        const academyId = academyData.data.academyId
        
        // 필터 옵션 데이터 로딩
        const [instructorsRes, classroomsRes, subjectsRes] = await Promise.all([
          fetch(`/api/instructors?academyId=${academyId}`),
          fetch(`/api/classrooms?academyId=${academyId}`),
          fetch(`/api/subjects?academyId=${academyId}`)
        ])

        const [instructors, classrooms, subjects] = await Promise.all([
          instructorsRes.json(),
          classroomsRes.json(),  
          subjectsRes.json()
        ])

        setFilterOptions({
          instructors: instructors.success ? instructors.data : [],
          classrooms: classrooms.success ? classrooms.data : [],
          subjects: subjects.success ? subjects.data : []
        })

      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [academyCode])

  // 필터 변경 핸들러
  const handleFilterChange = (field: string, value: string) => {
    const newFilters = {
      ...filters,
      [field]: value ? [value] : undefined
    }
    setFilters(newFilters)
  }

  // 필터 초기화
  const handleResetFilters = () => {
    setFilters({})
  }

  // 전체 요일 보기
  const handleShowAllDays = () => {
    setFilters(prev => ({
      ...prev,
      dayOfWeek: undefined
    }))
  }

  // 활성 필터 카운트
  const activeFilterCount = Object.values(filters).filter(val => val && (Array.isArray(val) ? val.length > 0 : true)).length

  // 시간표 클릭 핸들러
  const handleScheduleClick = (schedule: any) => {
    setSelectedSchedule(schedule)
    setShowDetailModal(true)
  }

  // 시간표 수정 버튼 클릭 (바로 edit 페이지로 이동)
  const handleEditSchedule = () => {
    router.push(`/${academyCode}/edit`)
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">학원 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 오류 상태
  if (error || !academyInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            메인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                ← 메인으로 돌아가기
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">
                {academyInfo.academyName}
              </h1>
              <p className="text-gray-600 mt-1">
                학원 시간표를 확인하세요
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href={`/${academyCode}/board`}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                게시판
              </Link>
              <Link
                href={`/${academyCode}/mypage`}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                마이페이지
              </Link>
              <Button
                onClick={handleEditSchedule}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                시간표 수정
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뷰 모드 선택 및 필터 */}
        <div className="mb-6">
          <div className="bg-white rounded-lg border p-4 shadow-md">
            <div className={`${isMobile ? 'flex-col space-y-3' : 'flex justify-between items-center'}`}>
              <div className={`flex items-center ${isMobile ? 'flex-wrap gap-2' : 'space-x-4'}`}>
                {/* 뷰 모드 옵션 */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">보기:</span>
                  {!isMobile && (
                    <>
                      <button
                        onClick={() => setViewMode('week')}
                        className={`px-3 py-1 rounded text-sm ${
                          viewMode === 'week' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        주간
                      </button>
                      <button
                        onClick={() => setViewMode('day')}
                        className={`px-3 py-1 rounded text-sm ${
                          viewMode === 'day' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        일간
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 rounded text-sm ${
                      viewMode === 'grid' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    그리드
                  </button>
                  {viewMode === 'day' && (
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
                      className="ml-2 px-3 py-1 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="MONDAY">월요일</option>
                      <option value="TUESDAY">화요일</option>
                      <option value="WEDNESDAY">수요일</option>
                      <option value="THURSDAY">목요일</option>
                      <option value="FRIDAY">금요일</option>
                      <option value="SATURDAY">토요일</option>
                      <option value="SUNDAY">일요일</option>
                    </select>
                  )}
                </div>
                
                {/* 모바일용 요일 선택기 */}
                {isMobile && viewMode === 'grid' && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">요일:</span>
                    <select
                      value={filters.dayOfWeek?.[0] || selectedDay}
                      onChange={(e) => {
                        const day = e.target.value as DayOfWeek
                        setSelectedDay(day)
                        setFilters(prev => ({
                          ...prev,
                          dayOfWeek: [day]
                        }))
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="MONDAY">월요일</option>
                      <option value="TUESDAY">화요일</option>
                      <option value="WEDNESDAY">수요일</option>
                      <option value="THURSDAY">목요일</option>
                      <option value="FRIDAY">금요일</option>
                      <option value="SATURDAY">토요일</option>
                      <option value="SUNDAY">일요일</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 우측 버튼들 */}
              {isClient && (
                <div className={`flex items-center ${isMobile ? 'flex-wrap gap-2 justify-start' : 'space-x-3'}`}>
                {/* 전체 요일 보기 버튼 */}
                <button
                  onClick={handleShowAllDays}
                  disabled={!filters.dayOfWeek}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filters.dayOfWeek 
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  전체 요일 보기
                </button>
                
                {/* 필터 초기화 버튼 */}
                <button
                  onClick={handleResetFilters}
                  disabled={activeFilterCount === 0}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    activeFilterCount > 0 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  필터 초기화
                </button>

                {/* 필터 토글 버튼 */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 font-medium"
                >
                  <svg 
                    className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 9l-7 7-7-7" 
                    />
                  </svg>
                  <span>필터 {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
                </button>
                </div>
              )}
            </div>

            {/* 필터 섹션 */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 요일 필터 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      요일
                    </label>
                    <select
                      value={filters.dayOfWeek?.[0] || ''}
                      onChange={(e) => handleFilterChange('dayOfWeek', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">전체</option>
                      <option value="MONDAY">월요일</option>
                      <option value="TUESDAY">화요일</option>
                      <option value="WEDNESDAY">수요일</option>
                      <option value="THURSDAY">목요일</option>
                      <option value="FRIDAY">금요일</option>
                      <option value="SATURDAY">토요일</option>
                      <option value="SUNDAY">일요일</option>
                    </select>
                  </div>

                  {/* 강사 필터 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      강사
                    </label>
                    <select
                      value={filters.instructorIds?.[0] || ''}
                      onChange={(e) => handleFilterChange('instructorIds', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">전체</option>
                      {filterOptions.instructors.map(instructor => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 강의실 필터 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      강의실
                    </label>
                    <select
                      value={filters.classroomIds?.[0] || ''}
                      onChange={(e) => handleFilterChange('classroomIds', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">전체</option>
                      {filterOptions.classrooms.map(classroom => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 과목 필터 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      과목
                    </label>
                    <select
                      value={filters.subjectIds?.[0] || ''}
                      onChange={(e) => handleFilterChange('subjectIds', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">전체</option>
                      {filterOptions.subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 필터 제어 버튼 */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    {activeFilterCount > 0 ? `${activeFilterCount}개 필터 적용 중` : '필터가 적용되지 않음'}
                  </div>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    필터 초기화
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 시간표 뷰 */}
        <div className="bg-white rounded-lg shadow-lg">
          {viewMode === 'grid' ? (
            <ScheduleGridView
              academyId={academyInfo.academyId}
              filters={filters}
              onScheduleClick={handleScheduleClick}
              onScheduleEdit={handleScheduleClick}
              isReadOnly={true}
            />
          ) : (
            <CalendarView
              academyId={academyInfo.academyId}
              viewMode={viewMode as 'week' | 'day'}
              selectedDay={selectedDay}
              filters={filters}
              onScheduleClick={handleScheduleClick}
              onScheduleEdit={handleScheduleClick}
              isReadOnly={true}
            />
          )}
        </div>

        {/* 시간표 상세 모달 */}
        {showDetailModal && selectedSchedule && (
          <ScheduleDetailModal
            schedule={selectedSchedule}
            onClose={() => {
              setShowDetailModal(false)
              setSelectedSchedule(null)
            }}
          />
        )}
      </main>
    </div>
  )
}