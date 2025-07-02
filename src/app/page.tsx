'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import ScheduleGrid from '@/components/schedule/ScheduleGrid'
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
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null)
  const [filters, setFilters] = useState<FilterState>({})
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    instructors: [],
    classrooms: [],
    subjects: []
  })
  const [academyId] = useState('demo-academy')

  // 필터 옵션 데이터 로딩
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
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
      } catch (error) {
        console.error('필터 옵션 로딩 실패:', error)
      }
    }

    fetchFilterOptions()
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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              우리학원시간표
            </h1>
            <p className="text-xl text-gray-600">
              학원 시간표를 한눈에 확인하고 관리하세요
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

      {/* 필터 섹션 */}
      <div className="max-w-7xl mx-auto mb-6">
        <Card>
          <div className="p-4">
            {/* 필터 토글 버튼 */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 font-medium"
              >
                <svg 
                  className={`w-5 h-5 transition-transform ${isFilterExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>필터</span>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {activeFilterCount}개 적용
                  </span>
                )}
              </button>
              
              {activeFilterCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="text-sm text-gray-500 hover:text-red-600 font-medium"
                >
                  초기화
                </button>
              )}
            </div>

            {/* 활성 필터 칩 표시 */}
            {activeFilterCount > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {filters.dayOfWeek && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {filters.dayOfWeek === 'MONDAY' && '월요일'}
                    {filters.dayOfWeek === 'TUESDAY' && '화요일'}
                    {filters.dayOfWeek === 'WEDNESDAY' && '수요일'}
                    {filters.dayOfWeek === 'THURSDAY' && '목요일'}
                    {filters.dayOfWeek === 'FRIDAY' && '금요일'}
                    {filters.dayOfWeek === 'SATURDAY' && '토요일'}
                    {filters.dayOfWeek === 'SUNDAY' && '일요일'}
                    <button
                      onClick={() => handleFilterChange('dayOfWeek', '')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.instructorId && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {filterOptions.instructors.find(i => i.id === filters.instructorId)?.name || '강사'}
                    <button
                      onClick={() => handleFilterChange('instructorId', '')}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.classroomId && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {filterOptions.classrooms.find(c => c.id === filters.classroomId)?.name || '강의실'}
                    <button
                      onClick={() => handleFilterChange('classroomId', '')}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.subjectId && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {filterOptions.subjects.find(s => s.id === filters.subjectId)?.name || '과목'}
                    <button
                      onClick={() => handleFilterChange('subjectId', '')}
                      className="ml-1 text-orange-600 hover:text-orange-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* 확장된 필터 옵션 */}
            {isFilterExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 요일 필터 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      요일
                    </label>
                    <select 
                      value={filters.dayOfWeek || ''}
                      onChange={(e) => handleFilterChange('dayOfWeek', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                      value={filters.instructorId || ''}
                      onChange={(e) => handleFilterChange('instructorId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                      value={filters.classroomId || ''}
                      onChange={(e) => handleFilterChange('classroomId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                      value={filters.subjectId || ''}
                      onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 시간표 그리드 */}
      <div className="max-w-7xl mx-auto">
        <ScheduleGrid 
          academyId="demo-academy"
          filters={{
            dayOfWeek: filters.dayOfWeek ? [filters.dayOfWeek as DayOfWeek] : undefined,
            instructorIds: filters.instructorId ? [filters.instructorId] : undefined,
            classroomIds: filters.classroomId ? [filters.classroomId] : undefined,
            subjectIds: filters.subjectId ? [filters.subjectId] : undefined
          }}
          onScheduleClick={setSelectedSchedule}
        />
      </div>

      {/* 시간표 상세 모달 */}
      {selectedSchedule && (
        <ScheduleDetailModal
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
        />
      )}
    </main>
  )
} 