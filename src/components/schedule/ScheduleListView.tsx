// Apple 캘린더 스타일 시간표 리스트 뷰 컴포넌트
// 목적: 시간대별로 정렬된 리스트 형태의 시간표 표시

'use client'

import React, { useState, useEffect } from 'react'
import { Schedule, DayOfWeek, DayOfWeekKorean } from '@/types'

interface ScheduleListViewProps {
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

export default function ScheduleListView({ 
  academyId, 
  filters, 
  refreshKey, 
  onScheduleClick, 
  onScheduleEdit,
  isReadOnly = false 
}: ScheduleListViewProps) {
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

  // 컬러가 밝은지 확인하는 함수
  const isLightColor = (color: string): boolean => {
    if (!color) return true
    
    // hex 색상을 RGB로 변환
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // 밝기 계산 (0-255)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128
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
        <h2 className="text-lg font-semibold text-gray-900 mb-6">주간 시간표 - 리스트 뷰</h2>
        
        <div className="space-y-8">
          {DAYS_ORDER.map(day => {
            const daySchedules = groupedSchedules[day]
            
            return (
              <div key={day} className="border-b border-gray-100 last:border-b-0 pb-6 last:pb-0">
                <h3 className="text-base font-medium text-gray-800 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  {DayOfWeekKorean[day]}
                  <span className="ml-2 text-sm text-gray-500">({daySchedules.length}개)</span>
                </h3>
                
                {daySchedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>등록된 시간표가 없습니다</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {daySchedules.map(schedule => (
                       <div
                         key={schedule.id}
                         className={`p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 ${
                           !isReadOnly ? 'cursor-pointer hover:shadow-sm' : ''
                         }`}
                         onClick={() => handleScheduleClick(schedule)}
                       >
                         {/* 데스크톱 레이아웃 */}
                         <div className="hidden md:flex items-center">
                           {/* 컬러 마크 */}
                           <div
                             className="w-4 h-4 rounded-full mr-4 flex-shrink-0 border border-gray-200"
                             style={{ 
                               backgroundColor: schedule.color || '#6B7280' 
                             }}
                           ></div>
                           
                           {/* 과목명 */}
                           <div className="flex-1 min-w-0 mr-4">
                             <h4 className="text-sm font-medium text-gray-900 truncate">
                               {schedule.title || schedule.subject?.name || '제목 없음'}
                             </h4>
                             {schedule.description && (
                               <p className="text-xs text-gray-500 truncate mt-1">
                                 {schedule.description}
                               </p>
                             )}
                           </div>
                           
                           {/* 강사명 */}
                           <div className="w-20 mr-4 flex-shrink-0">
                             <p className="text-sm text-gray-700 truncate">
                               {schedule.instructor?.user?.name || schedule.instructor?.name || '미지정'}
                             </p>
                           </div>
                           
                           {/* 강의실 */}
                           <div className="w-16 mr-4 flex-shrink-0">
                             <p className="text-sm text-gray-600 truncate">
                               {schedule.classroom?.name || '미지정'}
                             </p>
                           </div>
                           
                           {/* 시간 */}
                           <div className="w-24 flex-shrink-0">
                             <p className="text-sm font-medium text-gray-800">
                               {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                             </p>
                           </div>
                           
                           {/* 편집 버튼 (읽기 전용이 아닌 경우) */}
                           {!isReadOnly && (
                             <div className="ml-4 flex-shrink-0">
                               <button
                                 onClick={(e) => handleScheduleEdit(schedule, e)}
                                 className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                 aria-label="시간표 편집"
                               >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                 </svg>
                               </button>
                             </div>
                           )}
                         </div>

                         {/* 모바일 레이아웃 */}
                         <div className="md:hidden">
                           <div className="flex items-start justify-between">
                             <div className="flex items-start space-x-3 flex-1">
                               {/* 컬러 마크 */}
                               <div
                                 className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0 border border-gray-200"
                                 style={{ 
                                   backgroundColor: schedule.color || '#6B7280' 
                                 }}
                               ></div>
                               
                               <div className="flex-1 min-w-0">
                                 {/* 과목명과 시간 */}
                                 <div className="flex items-center justify-between mb-1">
                                   <h4 className="text-sm font-medium text-gray-900 truncate">
                                     {schedule.title || schedule.subject?.name || '제목 없음'}
                                   </h4>
                                   <span className="text-sm font-medium text-gray-800 ml-2">
                                     {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                   </span>
                                 </div>
                                 
                                 {/* 강사명과 강의실 */}
                                 <div className="flex items-center text-xs text-gray-600 space-x-3">
                                   <span>
                                     강사: {schedule.instructor?.user?.name || schedule.instructor?.name || '미지정'}
                                   </span>
                                   <span>•</span>
                                   <span>
                                     강의실: {schedule.classroom?.name || '미지정'}
                                   </span>
                                 </div>
                                 
                                 {/* 설명 */}
                                 {schedule.description && (
                                   <p className="text-xs text-gray-500 mt-1 truncate">
                                     {schedule.description}
                                   </p>
                                 )}
                               </div>
                             </div>
                             
                             {/* 편집 버튼 (읽기 전용이 아닌 경우) */}
                             {!isReadOnly && (
                               <button
                                 onClick={(e) => handleScheduleEdit(schedule, e)}
                                 className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors ml-2"
                                 aria-label="시간표 편집"
                               >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                 </svg>
                               </button>
                             )}
                           </div>
                         </div>
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