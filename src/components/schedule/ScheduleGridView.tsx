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
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEmptyRooms, setShowEmptyRooms] = useState(false)

  // 시간표 및 강의실 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const scheduleQueryParams = new URLSearchParams({
          academyId,
          ...(filters?.dayOfWeek && { dayOfWeek: filters.dayOfWeek.join(',') }),
          ...(filters?.instructorIds && { instructorIds: filters.instructorIds.join(',') }),
          ...(filters?.classroomIds && { classroomIds: filters.classroomIds.join(',') }),
          ...(filters?.subjectIds && { subjectIds: filters.subjectIds.join(',') })
        })

        const [scheduleResponse, classroomResponse] = await Promise.all([
          fetch(`/api/schedules?${scheduleQueryParams}`),
          fetch(`/api/classrooms?academyId=${academyId}`)
        ])

        const [scheduleResult, classroomResult] = await Promise.all([
          scheduleResponse.json(),
          classroomResponse.json()
        ])

        if (scheduleResult.success) {
          setSchedules(scheduleResult.data || [])
        } else {
          setError(scheduleResult.message || '시간표를 불러오는데 실패했습니다.')
        }

        if (classroomResult.success) {
          setClassrooms(classroomResult.data || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('네트워크 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

  // 같은 시간대의 수업들을 그룹화 (빈 강의실 포함)
  const timeGroupedSchedules = React.useMemo(() => {
    const result: Record<DayOfWeek, Array<Array<any>>> = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: []
    }

    Object.entries(groupedSchedules).forEach(([day, daySchedules]) => {
      const groups: Array<Array<any>> = []
      let currentGroup: any[] = []
      let lastTime = ''

      daySchedules.forEach((schedule, index) => {
        const currentTime = `${formatTime(schedule.startTime)}-${formatTime(schedule.endTime)}`
        
        if (index === 0 || currentTime === lastTime) {
          currentGroup.push(schedule)
        } else {
          if (currentGroup.length > 0) {
            // 빈 강의실 추가 (옵션이 켜진 경우)
            if (showEmptyRooms && currentGroup.length > 0) {
              const usedRoomIds = new Set(currentGroup.map(s => s.classroom?.id).filter(Boolean))
              const emptyRooms = classrooms.filter(room => !usedRoomIds.has(room.id))
              
              emptyRooms.forEach(room => {
                currentGroup.push({
                  id: `empty-${room.id}-${lastTime}`,
                  isEmpty: true,
                  classroom: room,
                  startTime: currentGroup[0].startTime,
                  endTime: currentGroup[0].endTime,
                  title: '빈 강의실',
                  color: '#E5E7EB'
                })
              })
            }
            
            // 그룹 내에서 강의실명 기준으로 정렬
            currentGroup.sort((a, b) => {
              const roomA = a.classroom?.name || '미지정'
              const roomB = b.classroom?.name || '미지정'
              return roomA.localeCompare(roomB)
            })
            groups.push(currentGroup)
          }
          currentGroup = [schedule]
        }
        
        lastTime = currentTime

        // 마지막 항목 처리
        if (index === daySchedules.length - 1 && currentGroup.length > 0) {
          // 빈 강의실 추가 (옵션이 켜진 경우)
          if (showEmptyRooms && currentGroup.length > 0) {
            const usedRoomIds = new Set(currentGroup.map(s => s.classroom?.id).filter(Boolean))
            const emptyRooms = classrooms.filter(room => !usedRoomIds.has(room.id))
            
            emptyRooms.forEach(room => {
              currentGroup.push({
                id: `empty-${room.id}-${lastTime}`,
                isEmpty: true,
                classroom: room,
                startTime: currentGroup[0].startTime,
                endTime: currentGroup[0].endTime,
                title: '빈 강의실',
                color: '#E5E7EB'
              })
            })
          }
          
          // 마지막 그룹도 강의실명 기준으로 정렬
          currentGroup.sort((a, b) => {
            const roomA = a.classroom?.name || '미지정'
            const roomB = b.classroom?.name || '미지정'
            return roomA.localeCompare(roomB)
          })
          groups.push(currentGroup)
        }
      })

      result[day as DayOfWeek] = groups
    })

    return result
  }, [groupedSchedules, showEmptyRooms, classrooms])

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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">주간 시간표 - 그리드 뷰</h2>
          
          {/* 빈 강의실 보기 옵션 */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showEmptyRooms}
              onChange={(e) => setShowEmptyRooms(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm text-gray-700">빈 강의실 보기</span>
          </label>
        </div>
        
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

                {timeGroupedSchedules[day].length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-gray-400 text-xs">
                    <p>시간표 없음</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timeGroupedSchedules[day].map((group, groupIndex) => (
                      <div key={groupIndex} className="space-y-1">
                        {/* 같은 시간대 그룹 헤더 */}
                        <div className="text-xs font-medium text-gray-700 px-2 py-1 bg-gray-100 rounded-t flex items-center justify-between">
                          <span>{formatTime(group[0].startTime)} - {formatTime(group[0].endTime)}</span>
                          <span className="text-gray-500">{group.length}개 수업</span>
                        </div>
                        
                        {/* 같은 시간대 수업들 */}
                        <div className="space-y-1 border border-gray-200 rounded-b p-1">
                          {group.map(schedule => (
                            <div
                              key={schedule.id}
                              className={`p-2 rounded-md border-l-4 transition-all duration-200 ${
                                schedule.isEmpty 
                                  ? 'border-gray-300 bg-gray-50' 
                                  : `cursor-pointer hover:shadow-sm ${!isReadOnly ? 'hover:bg-gray-50' : ''}`
                              }`}
                              style={schedule.isEmpty ? {} : { 
                                borderLeftColor: schedule.color || '#6B7280',
                                backgroundColor: `${schedule.color || '#6B7280'}08`
                              }}
                              onClick={() => !schedule.isEmpty && handleScheduleClick(schedule)}
                            >
                              {/* 강좌명 */}
                              <div className={`font-medium text-xs mb-1 leading-tight ${
                                schedule.isEmpty ? 'text-gray-500 italic' : 'text-gray-900'
                              }`}>
                                {schedule.isEmpty ? '빈 강의실' : (schedule.title || schedule.subject?.name || '제목 없음')}
                              </div>
                              
                              {/* 시간은 이제 그룹 헤더에 표시되므로 개별 표시하지 않음 */}
                              
                              {/* 강사명과 강의실 */}
                              <div className="text-xs text-gray-600 flex justify-between items-center">
                                <span>{schedule.isEmpty ? '-' : (schedule.instructor?.user?.name || schedule.instructor?.name || '미지정')}</span>
                                <span>{schedule.classroom?.name || '미지정'}</span>
                              </div>
                              
                              {/* 편집 버튼 (읽기 전용이 아니고 빈 강의실이 아닌 경우) */}
                              {!isReadOnly && !schedule.isEmpty && (
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