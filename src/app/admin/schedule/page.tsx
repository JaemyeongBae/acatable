// 관리자용 시간표 입력/관리 페이지
// 목적: 시간표 CRUD 기능을 위한 관리자 인터페이스

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ScheduleForm from '@/components/schedule/ScheduleForm'
import CalendarView from '@/components/schedule/CalendarView'
import { DayOfWeek } from '@/types'
import ScheduleDetailModal from '@/components/schedule/ScheduleDetailModal'

interface FilterState {
  dayOfWeek?: string
  instructorId?: string
  classroomId?: string
  subjectId?: string
}

interface FormState {
  isOpen: boolean
  mode: 'create' | 'edit'
  selectedSchedule: any | null
  loading: boolean
}

// 필터 옵션 인터페이스
interface FilterOptions {
  instructors: { id: string; name: string }[]
  classrooms: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
}

export default function AdminSchedulePage() {
  // 뷰 모드 상태 - 캘린더 뷰 고정
  const [calendarViewMode, setCalendarViewMode] = useState<'week' | 'day'>('week')
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY')
  
  // 폼 관련 상태
  const [formState, setFormState] = useState<FormState>({
    isOpen: false,
    mode: 'create',
    selectedSchedule: null,
    loading: false
  })

  // 필터 관련 상태
  const [filters, setFilters] = useState<FilterState>({})
  const [isFilterApplied, setIsFilterApplied] = useState(false)
  
  // 마지막 입력값 저장 (빠른 입력을 위해)
  const [lastFormData, setLastFormData] = useState<any>(null)

  // 필터 옵션 데이터
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    instructors: [],
    classrooms: [],
    subjects: []
  })

  // 데이터 관련 상태
  const [academyId] = useState('demo-academy') // 데모용 학원 ID (향후 인증 시스템 연동 필요)
  const [refreshKey, setRefreshKey] = useState(0)

  // 알림 관련 상태
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning'
    message: string
    show: boolean
  }>({
    type: 'success',
    message: '',
    show: false
  })

  // 필터 옵션 데이터 로딩
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [subjectsRes, instructorsRes, classroomsRes] = await Promise.all([
          fetch(`/api/subjects?academyId=${academyId}`),
          fetch(`/api/instructors?academyId=${academyId}`),
          fetch(`/api/classrooms?academyId=${academyId}`)
        ])

        const [subjectsData, instructorsData, classroomsData] = await Promise.all([
          subjectsRes.json(),
          instructorsRes.json(),
          classroomsRes.json()
        ])

        setFilterOptions({
          subjects: subjectsData.success ? subjectsData.data || [] : [],
          instructors: instructorsData.success ? instructorsData.data || [] : [],
          classrooms: classroomsData.success ? classroomsData.data || [] : []
        })
      } catch (error) {
        console.error('필터 옵션 로딩 실패:', error)
      }
    }

    loadFilterOptions()
  }, [])

  // 필터 변경 핸들러
  const handleFilterChange = (field: keyof FilterState, value: string) => {
    const newFilters = {
      ...filters,
      [field]: value || undefined
    }
    setFilters(newFilters)
    setIsFilterApplied(Object.values(newFilters).some(val => val))
  }

  // 필터 초기화
  const handleResetFilters = () => {
    setFilters({})
    setIsFilterApplied(false)
  }

  // 새 시간표 추가
  const handleAddSchedule = (presetData?: any) => {
    setFormState({
      isOpen: true,
      mode: 'create',
      selectedSchedule: presetData ? { ...lastFormData, ...presetData } : lastFormData,
      loading: false
    })
  }

  // 시간표 수정
  const handleEditSchedule = (schedule: any) => {
    setFormState({
      isOpen: true,
      mode: 'edit',
      selectedSchedule: schedule,
      loading: false
    })
  }

  // 폼 닫기
  const handleCloseForm = () => {
    setFormState(prev => ({
      ...prev,
      isOpen: false,
      selectedSchedule: null
    }))
  }

  // 폼 성공 처리
  const handleFormSuccess = (message: string, formData?: any) => {
    // 마지막 입력값 저장 (다음 입력 시 활용)
    if (formData && formState.mode === 'create') {
      setLastFormData({
        subjectId: formData.subjectId,
        instructorId: formData.instructorId,
        classroomId: formData.classroomId,
        classTypeId: formData.classTypeId,
        maxStudents: formData.maxStudents
      })
    }
    
    setFormState(prev => ({
      ...prev,
      isOpen: false,
      selectedSchedule: null
    }))
    setRefreshKey(prev => prev + 1) // 시간표 목록 새로고침
    showNotification('success', message)
  }

  // 알림 표시
  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message, show: true })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 5000)
  }

  // 시간표 삭제
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('정말로 이 시간표를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setRefreshKey(prev => prev + 1)
        showNotification('success', '시간표가 삭제되었습니다.')
        
        // 삭제 성공 시 폼 모달 닫기
        setFormState({
          isOpen: false,
          mode: 'create',
          selectedSchedule: null,
          loading: false
        })
      } else {
        showNotification('error', result.message || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('삭제 오류:', error)
      showNotification('error', '네트워크 오류가 발생했습니다.')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 페이지 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button 
                  variant="outline"
                  className="text-gray-600 hover:text-gray-900"
                  aria-label="시간표 조회 페이지로 이동"
                >
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
                      d="M15 19l-7-7 7-7" 
                    />
                  </svg>
                  시간표 조회
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  시간표 관리
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  학원 시간표를 등록, 수정, 삭제할 수 있습니다.
                </p>
              </div>
            </div>
            <Button
              onClick={handleAddSchedule}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              aria-label="새 시간표 추가"
            >
              <svg 
                className="w-5 h-5 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                />
              </svg>
              시간표 추가
            </Button>
          </div>
        </div>
      </header>

      {/* 뷰 모드 선택 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCalendarViewMode('week')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  calendarViewMode === 'week' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                주간
              </button>
              <button
                onClick={() => setCalendarViewMode('day')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  calendarViewMode === 'day' 
                    ? 'bg-white text-gray-900 shadow-sm' 
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
        </div>
      </div>

      {/* 알림 메시지 */}
      {notification.show && (
        <div 
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
            notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-yellow-50 border border-yellow-200 text-yellow-800'
          }`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {notification.type === 'success' && (
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'error' && (
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'warning' && (
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="알림 닫기"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* 필터 섹션 */}
          <Card>
            <section className="p-6" aria-label="시간표 필터">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  필터
                </h2>
                {isFilterApplied && (
                  <button
                    onClick={handleResetFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
              <form role="search" aria-label="시간표 필터링">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 요일 필터 */}
                  <div>
                    <label 
                      htmlFor="day-filter" 
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      요일
                    </label>
                    <select 
                      id="day-filter"
                      name="dayOfWeek"
                      value={filters.dayOfWeek || ''}
                      onChange={(e) => handleFilterChange('dayOfWeek', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      aria-describedby="day-filter-desc"
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
                    <div id="day-filter-desc" className="sr-only">
                      특정 요일의 시간표만 표시
                    </div>
                  </div>

                  {/* 강사 필터 */}
                  <div>
                    <label 
                      htmlFor="instructor-filter" 
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      강사
                    </label>
                    <select 
                      id="instructor-filter"
                      name="instructorId"
                      value={filters.instructorId || ''}
                      onChange={(e) => handleFilterChange('instructorId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      aria-describedby="instructor-filter-desc"
                    >
                      <option value="">전체</option>
                      {filterOptions.instructors.map(instructor => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.name}
                        </option>
                      ))}
                    </select>
                    <div id="instructor-filter-desc" className="sr-only">
                      특정 강사의 시간표만 표시
                    </div>
                  </div>

                  {/* 강의실 필터 */}
                  <div>
                    <label 
                      htmlFor="classroom-filter" 
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      강의실
                    </label>
                    <select 
                      id="classroom-filter"
                      name="classroomId"
                      value={filters.classroomId || ''}
                      onChange={(e) => handleFilterChange('classroomId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      aria-describedby="classroom-filter-desc"
                    >
                      <option value="">전체</option>
                      {filterOptions.classrooms.map(classroom => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name}
                        </option>
                      ))}
                    </select>
                    <div id="classroom-filter-desc" className="sr-only">
                      특정 강의실의 시간표만 표시
                    </div>
                  </div>

                  {/* 과목 필터 */}
                  <div>
                    <label 
                      htmlFor="subject-filter" 
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      과목
                    </label>
                    <select 
                      id="subject-filter"
                      name="subjectId"
                      value={filters.subjectId || ''}
                      onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      aria-describedby="subject-filter-desc"
                    >
                      <option value="">전체</option>
                      {filterOptions.subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                    <div id="subject-filter-desc" className="sr-only">
                      특정 과목의 시간표만 표시
                    </div>
                  </div>
                </div>
              </form>
            </section>
          </Card>

          {/* 시간표 뷰 */}
          <section aria-label="캘린더 뷰">
            <CalendarView
              academyId={academyId}
              viewMode={calendarViewMode}
              selectedDay={selectedDay}
              filters={{
                dayOfWeek: filters.dayOfWeek ? [filters.dayOfWeek as DayOfWeek] : undefined,
                instructorIds: filters.instructorId ? [filters.instructorId] : undefined,
                classroomIds: filters.classroomId ? [filters.classroomId] : undefined,
                subjectIds: filters.subjectId ? [filters.subjectId] : undefined
              }}
              refreshKey={refreshKey}
              onScheduleClick={handleEditSchedule}
              onScheduleCreate={(data) => handleAddSchedule(data)}
              onScheduleUpdate={async (scheduleId, data) => {
                try {
                  // 현재 스크롤 위치 저장
                  const currentScrollY = window.scrollY
                  
                  // startTime과 endTime이 Date 객체인 경우 문자열로 변환
                  const updateData = {
                    ...data,
                    startTime: data.startTime instanceof Date 
                      ? `${data.startTime.getHours().toString().padStart(2, '0')}:${data.startTime.getMinutes().toString().padStart(2, '0')}`
                      : data.startTime,
                    endTime: data.endTime instanceof Date 
                      ? `${data.endTime.getHours().toString().padStart(2, '0')}:${data.endTime.getMinutes().toString().padStart(2, '0')}`
                      : data.endTime
                  }
                  
                  const response = await fetch(`/api/schedules/${scheduleId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                  })
                  const result = await response.json()
                  if (result.success) {
                    setRefreshKey(prev => prev + 1)
                    showNotification('success', '시간표가 수정되었습니다.')
                    
                    // 스크롤 위치 복원 (약간의 딜레이 후)
                    setTimeout(() => {
                      window.scrollTo(0, currentScrollY)
                    }, 100)
                  } else {
                    showNotification('error', result.message || '수정에 실패했습니다.')
                  }
                } catch (error) {
                  showNotification('error', '네트워크 오류가 발생했습니다.')
                }
              }}
              onScheduleDelete={handleDeleteSchedule}
              isReadOnly={false}
            />
          </section>
        </div>
      </div>

      {/* 시간표 입력/수정 모달 */}
      {formState.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseForm()
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-form-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 id="schedule-form-title" className="text-xl font-semibold text-gray-900">
                  {formState.mode === 'edit' ? '시간표 수정' : '새 시간표 추가'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
                  aria-label="모달 닫기"
                >
                  <svg 
                    className="w-6 h-6" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </button>
              </div>
              <ScheduleForm
                academyId={academyId}
                schedule={formState.selectedSchedule}
                onSuccess={(message, formData) => handleFormSuccess(message, formData)}
                onCancel={handleCloseForm}
                onError={(message) => showNotification('error', message)}
                onDelete={handleDeleteSchedule}
              />
            </div>
          </div>
        </div>
      )}

      {/* 시간표 상세 모달 */}
      {formState.selectedSchedule && !formState.isOpen && (
        <ScheduleDetailModal
          schedule={formState.selectedSchedule}
          onClose={handleCloseForm}
        />
      )}
    </main>
  )
}