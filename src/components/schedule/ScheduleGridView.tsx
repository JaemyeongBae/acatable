// 간소화된 주간 그리드 뷰 컴포넌트
// 목적: 모든 요일을 한눈에 파악할 수 있는 간소화된 그리드 표시

'use client'

import React, { useState, useEffect } from 'react'
import { Schedule, DayOfWeek, DayOfWeekKorean } from '@/types'

interface ScheduleGridViewProps {
  academyId: string
  filters?: any
  refreshKey?: number
  onScheduleClick?: (schedule: any) => void
  onScheduleEdit?: (schedule: any) => void
  isReadOnly?: boolean
}

// 시간을 분으로 변환하는 함수
const timeToMinutes = (time: string | Date): number => {
  try {
    if (time instanceof Date) {
      return time.getHours() * 60 + time.getMinutes()
    }
    if (typeof time === 'string') {
      const [hours, minutes] = time.split(':').map(Number)
      if (isNaN(hours) || isNaN(minutes)) {
        return 0
      }
      return hours * 60 + minutes
    }
    return 0
  } catch (error) {
    console.error('Error converting time to minutes:', time, error)
    return 0
  }
}

// 시간 포맷팅 함수
const formatTime = (time: string | Date): string => {
  try {
    if (time instanceof Date) {
      return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`
    }
    if (typeof time === 'string') {
      return time
    }
    return '00:00'
  } catch (error) {
    console.error('Error formatting time:', time, error)
    return '00:00'
  }
}

// 요일 순서 정의
const DAYS_ORDER: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export default function ScheduleGridView({ 
  academyId, 
  filters, 
  refreshKey, 
  onScheduleClick, 
  onScheduleEdit,
  isReadOnly = false 
}: ScheduleGridViewProps) {
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 시간표 데이터 가져오기
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const queryParams = new URLSearchParams({
          academyId,
          ...(filters?.dayOfWeek && { dayOfWeek: filters.dayOfWeek.join(',') }),
          ...(filters?.instructorIds && { instructorIds: filters.instructorIds.join(',') }),
          ...(filters?.classroomIds && { classroomIds: filters.classroomIds.join(',') }),
          ...(filters?.subjectIds && { subjectIds: filters.subjectIds.join(',') })
        })

        const response = await fetch(`/api/schedules?${queryParams}`)
        const result = await response.json()

        if (result.success) {
          setSchedules(result.data || [])
        } else {
          setError(result.message || '시간표를 불러오는데 실패했습니다.')
        }
      } catch (error) {
        console.error('Error fetching schedules:', error)
        setError('네트워크 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchSchedules()
  }, [academyId, filters, refreshKey])

  // 요일별로 그룹화하고 시간순으로 정렬
  const groupedSchedules = React.useMemo(() => {
    const grouped: Record<DayOfWeek, any[]> = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: []
    }

    schedules.forEach(schedule => {
      if (schedule.dayOfWeek && schedule.dayOfWeek in grouped) {
        grouped[schedule.dayOfWeek as DayOfWeek].push(schedule)
      }
    })

    // 각 요일별로 시간순 정렬
    Object.keys(grouped).forEach(day => {
      grouped[day as DayOfWeek].sort((a, b) => {
        const timeA = timeToMinutes(a.startTime)
        const timeB = timeToMinutes(b.startTime)
        return timeA - timeB
      })
    })

    return grouped
  }, [schedules])

  // 스케줄 클릭 핸들러
  const handleScheduleClick = (schedule: any) => {
    if (onScheduleClick) {
      onScheduleClick(schedule)
    }
  }

  // 스케줄 편집 핸들러
  const handleScheduleEdit = (schedule: any, event: React.MouseEvent) => {
    event.stopPropagation()
    if (onScheduleEdit) {
      onScheduleEdit(schedule)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">시간표를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p className="mb-2">오류가 발생했습니다</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">주간 시간표 - 그리드 뷰</h2>
        
        {/* 그리드 헤더 */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {DAYS_ORDER.map(day => (
            <div key={day} className="text-center">
              <h3 className="text-sm font-semibold text-gray-800 py-2 bg-gray-50 rounded-t-lg">
                {DayOfWeekKorean[day]}
              </h3>
              <div className="text-xs text-gray-500 pb-2">
                ({groupedSchedules[day].length}개)
              </div>
            </div>
          ))}
        </div>

        {/* 그리드 컨텐츠 */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {DAYS_ORDER.map(day => {
            const daySchedules = groupedSchedules[day]
            
            return (
              <div key={day} className="min-h-[300px] border border-gray-200 rounded-lg p-2">
                {/* 모바일에서 요일 표시 */}
                <div className="md:hidden mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 py-1 bg-gray-50 rounded text-center">
                    {DayOfWeekKorean[day]} ({daySchedules.length}개)
                  </h3>
                </div>

                {daySchedules.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-gray-400 text-xs">
                    <p>시간표 없음</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {daySchedules.map(schedule => (
                      <div
                        key={schedule.id}
                        className={`p-2 rounded-md border-l-4 cursor-pointer hover:shadow-sm transition-all duration-200 ${
                          !isReadOnly ? 'hover:bg-gray-50' : ''
                        }`}
                        style={{ 
                          borderLeftColor: schedule.color || '#6B7280',
                          backgroundColor: `${schedule.color || '#6B7280'}08`
                        }}
                        onClick={() => handleScheduleClick(schedule)}
                      >
                        {/* 강좌명 */}
                        <div className="font-medium text-xs text-gray-900 mb-1 leading-tight">
                          {schedule.title || schedule.subject?.name || '제목 없음'}
                        </div>
                        
                        {/* 시간 */}
                        <div className="text-xs font-medium text-gray-700 mb-1">
                          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                        </div>
                        
                        {/* 강사명 */}
                        <div className="text-xs text-gray-600 mb-1">
                          👨‍🏫 {schedule.instructor?.user?.name || schedule.instructor?.name || '미지정'}
                        </div>
                        
                        {/* 강의실 */}
                        <div className="text-xs text-gray-600">
                          🏫 {schedule.classroom?.name || '미지정'}
                        </div>
                        
                        {/* 편집 버튼 (읽기 전용이 아닌 경우) */}
                        {!isReadOnly && (
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={(e) => handleScheduleEdit(schedule, e)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                              aria-label="시간표 편집"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {schedules.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-medium mb-2">등록된 시간표가 없습니다</p>
            <p className="text-sm">새로운 시간표를 추가해보세요</p>
          </div>
        )}
      </div>
    </div>
  )
} 