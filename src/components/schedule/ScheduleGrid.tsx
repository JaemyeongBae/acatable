// 주간 시간표 그리드 뷰 컴포넌트
// 목적: 주간 시간표를 그리드 형태로 시각화

'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import Card from '@/components/ui/Card'
import { DayOfWeek } from '@/types'

interface ScheduleItem {
  id: string
  title: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  instructor?: { name: string } | null
  classroom?: { name: string } | null
  subject?: { name: string; color?: string } | null
  classType?: { name: string; color?: string } | null
}

interface ScheduleGridProps {
  academyId: string
  filters?: {
    dayOfWeek?: DayOfWeek[]
    instructorIds?: string[]
    classroomIds?: string[]
    subjectIds?: string[]
  }
  refreshKey?: number
  onEdit?: (schedule: ScheduleItem) => void
  onDelete?: (scheduleId: string) => void
  onScheduleClick?: (schedule: ScheduleItem) => void
}

// 요일 순서 정의
const DAYS_ORDER: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const DAY_LABELS = {
  MONDAY: '월요일',
  TUESDAY: '화요일', 
  WEDNESDAY: '수요일',
  THURSDAY: '목요일',
  FRIDAY: '금요일',
  SATURDAY: '토요일',
  SUNDAY: '일요일'
}

// 시간 슬롯 생성 (09:00 ~ 22:00)
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 9; hour <= 21; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
  }
  return slots
}

export default function ScheduleGrid({ 
  academyId, 
  filters, 
  refreshKey, 
  onEdit, 
  onDelete,
  onScheduleClick 
}: ScheduleGridProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 시간표 데이터 페칭
  useEffect(() => {
    let isMounted = true // 컴포넌트 마운트 상태 추적

    const fetchSchedules = async () => {
      try {
        if (!isMounted) return // 이미 언마운트된 경우 실행하지 않음
        
        setLoading(true)
        setError(null)

        // URL 쿼리 파라미터 구성
        const params = new URLSearchParams({ academyId })
        
        if (filters?.dayOfWeek?.length) {
          filters.dayOfWeek.forEach((day: DayOfWeek) => params.append('dayOfWeek', day))
        }
        if (filters?.instructorIds?.length) {
          filters.instructorIds.forEach((id: string) => params.append('instructorId', id))
        }
        if (filters?.classroomIds?.length) {
          filters.classroomIds.forEach((id: string) => params.append('classroomId', id))
        }
        if (filters?.subjectIds?.length) {
          filters.subjectIds.forEach((id: string) => params.append('subjectId', id))
        }

        const response = await fetch(`/api/schedules?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error('시간표 데이터를 불러오는데 실패했습니다.')
        }

        const result = await response.json()
        
        if (!isMounted) return // 비동기 작업 완료 후 다시 체크
        
        if (result.success) {
          setSchedules(result.data || [])
        } else {
          throw new Error(result.message || '알 수 없는 오류가 발생했습니다.')
        }
      } catch (err) {
        if (!isMounted) return
        console.error('시간표 조회 오류:', err)
        setError(err instanceof Error ? err.message : '시간표를 불러오는데 실패했습니다.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (academyId) {
      fetchSchedules()
    }

    // 클린업 함수
    return () => {
      isMounted = false
    }
  }, [academyId, refreshKey, filters]) // filters 추가하여 필터 변경 시 새로고침

  // 시간표 데이터를 그리드 구조로 변환
  const groupSchedulesByDayAndTime = () => {
    const grid: { [day: string]: { [time: string]: ScheduleItem[] } } = {}
    
    DAYS_ORDER.forEach(day => {
      grid[day] = {}
    })

    schedules.forEach(schedule => {
      const day = schedule.dayOfWeek as DayOfWeek
      const startHour = schedule.startTime.split(':')[0]
      const timeKey = `${startHour}:00`
      
      if (!grid[day][timeKey]) {
        grid[day][timeKey] = []
      }
      grid[day][timeKey].push(schedule)
    })

    return grid
  }

  // 시간 슬롯에서 해당 시간의 강의가 있는지 확인
  const getScheduleAtTime = (day: DayOfWeek, timeSlot: string) => {
    return schedules.filter(schedule => 
      schedule.dayOfWeek === day && 
      schedule.startTime.startsWith(timeSlot.substring(0, 2))
    )
  }

  const timeSlots = generateTimeSlots()

  if (loading) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">시간표를 불러오는 중...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 데스크톱 뷰 - 그리드 형태 */}
      <Card className="hidden lg:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th 
                  className="border border-gray-200 p-3 text-left font-medium text-gray-900 w-20"
                  scope="col"
                >
                  시간
                </th>
                {DAYS_ORDER.map(day => (
                  <th 
                    key={day} 
                    className="border border-gray-200 p-3 text-center font-medium text-gray-900 min-w-32"
                    scope="col"
                  >
                    {DAY_LABELS[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
                            {timeSlots.map((timeSlot, index) => {
                const isLastSlot = index === timeSlots.length - 1
                const isFirstSlot = index === 0
                return (
                <tr key={timeSlot} className="hover:bg-gray-50">
                  <th 
                    className="border border-gray-200 p-3 font-medium text-gray-600 bg-gray-50"
                    scope="row"
                  >
                    <div className="text-sm">
                      {(() => {
                        const hour = parseInt(timeSlot.split(':')[0])
                        const minute = timeSlot.split(':')[1]
                        const period = hour >= 12 ? '오후' : '오전'
                        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
                        return `${period} ${displayHour}시${minute !== '00' ? ` ${minute}분` : ''}`
                      })()}
                    </div>
                  </th>
                  {DAYS_ORDER.map(day => {
                    const daySchedules = getScheduleAtTime(day, timeSlot)
                    return (
                      <td 
                        key={`${day}-${timeSlot}`} 
                        className="border border-gray-200 p-2 align-top min-h-[60px]"
                        role="gridcell"
                        aria-label={`${DAY_LABELS[day]} ${timeSlot} 시간대`}
                      >
                        {daySchedules.map(schedule => (
                          <div
                            key={schedule.id}
                            className="mb-2 group relative"
                          >
                            <div
                              className="p-2 rounded-md border-l-4 bg-blue-50 border-blue-400 hover:bg-blue-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                              style={{
                                borderLeftColor: schedule.subject?.color || '#3B82F6'
                              }}
                              tabIndex={0}
                              role="button"
                              aria-label={`${schedule.title} 강의, ${schedule.startTime}부터 ${schedule.endTime}까지, ${schedule.instructor?.name || '강사 미정'} 강사, ${schedule.classroom?.name || '강의실 미정'}`}
                              onClick={() => {
                                if (onEdit) {
                                  onEdit(schedule)
                                } else if (onScheduleClick) {
                                  onScheduleClick(schedule)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  if (onEdit) {
                                    onEdit(schedule)
                                  } else if (onScheduleClick) {
                                    onScheduleClick(schedule)
                                  }
                                }
                              }}
                            >
                              <div className="font-medium text-sm text-gray-900 truncate">
                                {schedule.title}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {schedule.startTime} - {schedule.endTime}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {schedule.instructor?.name || '강사 미정'} · {schedule.classroom?.name || '강의실 미정'}
                              </div>
                            </div>
                            
                            {/* 수정/삭제 버튼 - 관리자 모드에서만 표시 */}
                            {(onEdit || onDelete) && (
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                {onEdit && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onEdit(schedule)
                                    }}
                                    className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label={`${schedule.title} 수정`}
                                    title="수정"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                )}
                                {onDelete && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onDelete(schedule.id)
                                    }}
                                    className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                    aria-label={`${schedule.title} 삭제`}
                                    title="삭제"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </td>
                    )
                  })}
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 태블릿 뷰 - 간소화된 그리드 */}
              <Card className="hidden md:block lg:hidden overflow-hidden">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-8 gap-0 min-w-[640px]">
            {/* 헤더 */}
            <div className="bg-gray-50 border border-gray-200 p-2 font-medium text-gray-900 text-sm">
              시간
            </div>
            {DAYS_ORDER.map(day => (
              <div key={day} className="bg-gray-50 border border-gray-200 p-2 text-center font-medium text-gray-900 text-sm">
                {DAY_LABELS[day].slice(0, 1)} {/* 요일 첫 글자만 표시 */}
              </div>
            ))}
            
            {/* 시간표 내용 */}
            {timeSlots.map((timeSlot, index) => {
              const isLastSlot = index === timeSlots.length - 1
              const isFirstSlot = index === 0
              return (
                <React.Fragment key={timeSlot}>
                  <div className="border border-gray-200 p-2 bg-gray-50 text-sm font-medium text-gray-600">
                    {(() => {
                      const hour = parseInt(timeSlot.split(':')[0])
                      const minute = timeSlot.split(':')[1]
                      const period = hour >= 12 ? '오후' : '오전'
                      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
                      return `${period} ${displayHour}시${minute !== '00' ? ` ${minute}분` : ''}`
                    })()}
                  </div>
                  {DAYS_ORDER.map(day => {
                    const daySchedules = getScheduleAtTime(day, timeSlot)
                    return (
                      <div 
                        key={`${day}-${timeSlot}`} 
                        className="border border-gray-200 p-1 min-h-[4rem]"
                        role="gridcell"
                      >
                      {daySchedules.map(schedule => (
                        <div
                          key={schedule.id}
                          className="text-xs p-1 rounded border-l-2 bg-blue-50 border-blue-400 mb-1 cursor-pointer hover:bg-blue-100 transition-colors"
                          style={{
                            borderLeftColor: schedule.subject?.color || '#3B82F6'
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`${schedule.title} 강의`}
                          onClick={() => {
                            if (onEdit) {
                              onEdit(schedule)
                            } else if (onScheduleClick) {
                              onScheduleClick(schedule)
                            }
                          }}
                        >
                          <div className="font-medium text-gray-900 truncate">
                            {schedule.title}
                          </div>
                          <div className="text-gray-600">
                            {schedule.startTime.slice(0, 5)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </React.Fragment>
                )
            })}
          </div>
        </div>
      </Card>

      {/* 모바일 뷰 - 리스트 형태 */}
      <div className="md:hidden space-y-4" role="region" aria-label="모바일용 시간표 목록">
        {DAYS_ORDER.map(day => {
          const daySchedules = schedules.filter(s => s.dayOfWeek === day)
          if (daySchedules.length === 0) return null

          return (
            <Card key={day}>
              <h3 
                className="font-bold text-lg text-gray-900 mb-3 pb-2 border-b"
                id={`mobile-day-${day}`}
              >
                {DAY_LABELS[day]}
              </h3>
              <div 
                className="space-y-2"
                role="list"
                aria-labelledby={`mobile-day-${day}`}
              >
                {daySchedules
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map(schedule => (
                    <div
                      key={schedule.id}
                      className="relative group"
                    >
                      <div
                        className="p-3 border-l-4 bg-blue-50 border-blue-400 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                        style={{
                          borderLeftColor: schedule.subject?.color || '#3B82F6'
                        }}
                        role="listitem button"
                        tabIndex={0}
                        aria-label={`${schedule.title} 강의, ${schedule.startTime}부터 ${schedule.endTime}까지, ${schedule.instructor?.name || '강사 미정'} 강사, ${schedule.classroom?.name || '강의실 미정'}`}
                        onClick={() => {
                          if (onEdit) {
                            onEdit(schedule)
                          } else if (onScheduleClick) {
                            onScheduleClick(schedule)
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            if (onEdit) {
                              onEdit(schedule)
                            } else if (onScheduleClick) {
                              onScheduleClick(schedule)
                            }
                          }
                        }}
                      >
                        <div className="font-medium text-gray-900 mb-1">
                          {schedule.title}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <time dateTime={`${schedule.startTime}`}>{schedule.startTime}</time>
                          {' - '}
                          <time dateTime={`${schedule.endTime}`}>{schedule.endTime}</time>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span 
                            className="bg-gray-100 px-2 py-1 rounded"
                            aria-label={`강사: ${schedule.instructor?.name || '강사 미정'}`}
                          >
                            {schedule.instructor?.name || '강사 미정'}
                          </span>
                          <span 
                            className="bg-gray-100 px-2 py-1 rounded"
                            aria-label={`강의실: ${schedule.classroom?.name || '강의실 미정'}`}
                          >
                            {schedule.classroom?.name || '강의실 미정'}
                          </span>
                          {schedule.subject && (
                          <span 
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded"
                            aria-label={`과목: ${schedule.subject.name}`}
                          >
                            {schedule.subject.name}
                          </span>
                          )}
                        </div>
                      </div>
                      
                      {/* 모바일용 수정/삭제 버튼 - 관리자 모드에서만 표시 */}
                      {(onEdit || onDelete) && (
                        <div className="absolute top-2 right-2 flex space-x-1">
                          {onEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onEdit(schedule)
                              }}
                              className="p-2 rounded-full bg-white shadow-md text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              aria-label={`${schedule.title} 수정`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDelete(schedule.id)
                              }}
                              className="p-2 rounded-full bg-white shadow-md text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                              aria-label={`${schedule.title} 삭제`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </Card>
          )
        })}

        {schedules.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500">등록된 시간표가 없습니다.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
} 