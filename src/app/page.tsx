'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import ScheduleGrid from '@/components/schedule/ScheduleGrid'
import CalendarView from '@/components/schedule/CalendarView'
import ScheduleDetailModal from '@/components/schedule/ScheduleDetailModal'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { DayOfWeek } from '@/types'

interface FilterState {
  dayOfWeek?: string
  instructorId?: string
  classroomId?: string
  subjectId?: string
}

interface FilterOptions {
  instructors: { id: string; name: string }[]
  classrooms: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
}

export default function Home() {
  // 뷰 모드 상태 (캘린더 뷰 고정)
  const [viewMode] = useState<'calendar'>('calendar')
  const [calendarViewMode, setCalendarViewMode] = useState<'week' | 'day'>('week')
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY')
  
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
  
  const academyId = 'demo-academy' // 데모용 학원 ID (향후 인증 시스템 연동 필요)
  const [academyName, setAcademyName] = useState('와이즈과학학원')
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    instructors: [],
    classrooms: [],
    subjects: []
  })

  // 필터 옵션 데이터 및 학원 정보 로딩
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instructorsRes, classroomsRes, subjectsRes, academyRes] = await Promise.all([
          fetch(`/api/instructors?academyId=${academyId}`),
          fetch(`/api/classrooms?academyId=${academyId}`),
          fetch(`/api/subjects?academyId=${academyId}`),
          fetch(`/api/academies/${academyId}`)
        ])

        const [instructors, classrooms, subjects, academy] = await Promise.all([
          instructorsRes.json(),
          classroomsRes.json(),  
          subjectsRes.json(),
          academyRes.json()
        ])

        setFilterOptions({
          instructors: instructors.success ? instructors.data : [],
          classrooms: classrooms.success ? classrooms.data : [],
          subjects: subjects.success ? subjects.data : []
        })

        // 학원 이름 설정
        if (academy.success && academy.data?.name) {
          setAcademyName(academy.data.name)
        }
      } catch (error) {
        console.error('데이터 로딩 실패:', error)
      }
    }

    fetchData()
  }, [academyId])

  // 필터 변경 핸들러
  const handleFilterChange = (field: keyof FilterState, value: string) => {
    const newFilters = {
      ...filters,
      [field]: value || undefined
    }
    setFilters(newFilters)
  }

  // 필터 초기화
  const handleResetFilters = () => {
    setFilters({})
  }

  // 활성 필터 카운트
  const activeFilterCount = Object.values(filters).filter(val => val).length

  // 시간표 클릭 핸들러
  const handleScheduleClick = (schedule: any) => {
    setSelectedSchedule(schedule)
    setShowDetailModal(true)
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {academyName} 시간표
            </h1>
            <p className="text-xl text-gray-600">
              학원 시간표를 한눈에 확인하세요!
            </p>
          </div>
          <div className="ml-4">
            <Link href="/admin/schedule">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <svg 
                  className="w-5 h-5 mr-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
                시간표 관리
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 뷰 모드 선택 및 필터 */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg border p-4 shadow-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* 캘린더 뷰 고정 */}
              <div className="text-sm font-medium text-gray-700">
                캘린더 뷰
              </div>
              
              {/* 캘린더 뷰 옵션 */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCalendarViewMode('week')}
                  className={`px-3 py-1 rounded text-sm ${
                    calendarViewMode === 'week' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  주간
                </button>
                <button
                  onClick={() => setCalendarViewMode('day')}
                  className={`px-3 py-1 rounded text-sm ${
                    calendarViewMode === 'day' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  일간
                </button>
                {calendarViewMode === 'day' && (
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
            </div>

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
              <span>필터</span>
            </button>
          </div>

          {/* 필터 섹션 (확장 가능) */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">필터 기능 준비 중...</p>
            </div>
          )}
        </div>
      </div>

      {/* 시간표 뷰 */}
      <div className="max-w-7xl mx-auto">
        <CalendarView
          academyId={academyId}
          viewMode={calendarViewMode}
          selectedDay={selectedDay}
          filters={filters}
          onScheduleClick={handleScheduleClick}
          isReadOnly={true}
        />
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
  )
} 