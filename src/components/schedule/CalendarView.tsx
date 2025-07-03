// macOS 캘린더 스타일 시간표 뷰 컴포넌트
// 목적: 시간 기반 그리드 뷰로 드래그-드롭 및 시각적 시간 표시 지원

'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Schedule, DayOfWeek } from '@/types'

// DayOfWeek enum을 숫자로 변환하는 매핑
const DAY_OF_WEEK_TO_NUMBER: Record<DayOfWeek, number> = {
  'MONDAY': 0,
  'TUESDAY': 1,
  'WEDNESDAY': 2,
  'THURSDAY': 3,
  'FRIDAY': 4,
  'SATURDAY': 5,
  'SUNDAY': 6
}

// 숫자를 DayOfWeek enum으로 변환하는 매핑
const NUMBER_TO_DAY_OF_WEEK: DayOfWeek[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
]

interface CalendarViewProps {
  academyId: string
  viewMode?: 'week' | 'day'
  selectedDay?: any
  filters?: any
  refreshKey?: number
  onScheduleCreate?: (schedule: any) => void
  onScheduleUpdate?: (id: string, schedule: any) => void
  onScheduleClick?: (schedule: any) => void
  onScheduleDelete?: (id: string) => void
  isReadOnly?: boolean // 읽기 전용 모드 (드래그 비활성화)
}

// 요일 배열
const DAYS = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']

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

// 분을 시간 문자열로 변환하는 함수
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// 15분 단위로 반올림
const snapToGrid = (minutes: number): number => {
  return Math.round(minutes / 15) * 15
}

export default function CalendarView({ 
  academyId, 
  viewMode: initialViewMode = 'week', 
  selectedDay: initialSelectedDay, 
  filters, 
  refreshKey, 
  onScheduleCreate, 
  onScheduleUpdate, 
  onScheduleClick, 
  onScheduleDelete,
  isReadOnly = false 
}: CalendarViewProps) {
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'week' | 'day'>(initialViewMode)


  
  // selectedDay를 DayOfWeek에서 숫자 인덱스로 변환
  const getSelectedDayIndex = React.useCallback(() => {
    if (typeof initialSelectedDay === 'string' && initialSelectedDay in DAY_OF_WEEK_TO_NUMBER) {
      return DAY_OF_WEEK_TO_NUMBER[initialSelectedDay as DayOfWeek]
    }
    return 0 // 기본값 월요일
  }, [initialSelectedDay])
  
  const [selectedDay, setSelectedDay] = useState(getSelectedDayIndex())
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ day: number; time: number } | null>(null)
  const [dragCurrent, setDragCurrent] = useState<{ day: number; time: number } | null>(null)
  const [draggedSchedule, setDraggedSchedule] = useState<any>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  

  
  const calendarRef = useRef<HTMLDivElement>(null)



  // selectedDay prop이 변경될 때 내부 상태 업데이트
  React.useEffect(() => {
    setSelectedDay(getSelectedDayIndex())
  }, [getSelectedDayIndex])

  // viewMode prop이 변경될 때 내부 상태 업데이트
  React.useEffect(() => {
    setViewMode(initialViewMode)
  }, [initialViewMode])

  // 시간표 데이터 가져오기
  React.useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.append('academyId', academyId)
        
        if (filters?.dayOfWeek?.length) {
          filters.dayOfWeek.forEach((day: string) => params.append('dayOfWeek', day))
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
        const data = await response.json()
        
        if (data.success) {
          // API에서 받은 시간표 데이터를 그대로 사용 (startTime, endTime이 이미 HH:MM 형식의 문자열)
          setSchedules(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch schedules:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSchedules()
  }, [academyId, filters, refreshKey])

  // 시간 슬롯 생성 (9:00 ~ 22:00, 15분 간격)
  const timeSlots: number[] = []
  for (let hour = 9; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 22 && minute > 0) break // 22:00까지만
      timeSlots.push(hour * 60 + minute)
    }
  }

  // 표시할 요일들
  const displayDays = viewMode === 'week' ? DAYS : [DAYS[selectedDay]]

  // 블록 위치를 기반으로 시간과 요일 계산 (마우스 위치가 아닌 블록 위치 기준)
  const getTimeAndDayFromBlockPosition = useCallback((mouseX: number, mouseY: number, offset: { x: number; y: number } | null) => {
    if (!calendarRef.current) return null

    const rect = calendarRef.current.getBoundingClientRect()
    
    // 블록의 실제 위치 계산 (마우스 위치에서 오프셋을 뺀 블록의 시작점)
    const blockX = mouseX - (offset?.x || 0)
    const blockY = mouseY - (offset?.y || 0)
    
    const relativeX = blockX - rect.left
    const relativeY = blockY - rect.top

    // 헤더 높이 고려
    const headerElement = calendarRef.current.querySelector('.sticky')
    const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : 60
    const timeAreaWidth = 80

    const contentY = relativeY - headerHeight
    const contentX = relativeX - timeAreaWidth

    // 시간 계산 - 블록의 시작점 기준
    const timeSlotHeight = 20
    const exactTimeIndex = contentY / timeSlotHeight
    const timeIndex = Math.floor(exactTimeIndex)
    
    // 시간 범위 체크를 완화하여 영역 밖에서도 계산 가능하도록 함
    let baseTimeInMinutes: number
    if (timeIndex < 0) {
      // 시간표 위쪽 영역에서는 최소 시간 사용
      baseTimeInMinutes = 9 * 60 // 9:00
    } else if (timeIndex >= timeSlots.length) {
      // 시간표 아래쪽 영역에서는 최대 시간 사용
      baseTimeInMinutes = 22 * 60 // 22:00
    } else {
      baseTimeInMinutes = timeSlots[timeIndex]
    }
    
    const fractionWithinSlot = exactTimeIndex - timeIndex
    const adjustedMinutes = baseTimeInMinutes + (fractionWithinSlot * 15)
    const snappedMinutes = snapToGrid(adjustedMinutes)
    
    // 범위 체크
    const minTime = 9 * 60
    const maxTime = 22 * 60
    const finalTimeInMinutes = Math.max(minTime, Math.min(maxTime, snappedMinutes))

    // 요일 계산 - 블록 중심점이 50% 이상 넘어갈 때만 이동
    const dayWidth = (rect.width - timeAreaWidth) / displayDays.length
    
    // 블록의 중심점 계산 (블록 너비의 절반을 더함)
    const blockCenterX = contentX + (dayWidth * 0.4) // 블록 너비의 40% 지점을 중심으로 가정
    
    let dayIndex = Math.floor(blockCenterX / dayWidth)
    
    // 경계 처리 - 블록이 50% 이상 넘어갔을 때만 이동
    if (blockCenterX >= 0) {
      const positionInDay = (blockCenterX % dayWidth) / dayWidth
      if (positionInDay < 0.5 && blockCenterX > 0) {
        // 50% 미만이면 이전 요일 유지
        dayIndex = Math.floor((blockCenterX - dayWidth * 0.5) / dayWidth)
      }
    }
    
    // 요일 범위 체크 - 영역 밖에서도 가장 가까운 요일 선택
    dayIndex = Math.max(0, Math.min(displayDays.length - 1, dayIndex))

    const actualDayIndex = viewMode === 'week' ? dayIndex : selectedDay

    return { day: actualDayIndex, time: finalTimeInMinutes }
  }, [viewMode, selectedDay, displayDays.length, timeSlots])

  // 기존 함수는 새 시간표 생성용으로 유지
  const getTimeAndDayFromPosition = useCallback((clientX: number, clientY: number) => {
    if (!calendarRef.current) return null

    const rect = calendarRef.current.getBoundingClientRect()
    const relativeX = clientX - rect.left
    const relativeY = clientY - rect.top

    // 헤더 높이 고려 (정확한 측정)
    const headerElement = calendarRef.current.querySelector('.sticky')
    const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : 60
    const timeAreaWidth = 80

    const contentY = relativeY - headerHeight
    const contentX = relativeX - timeAreaWidth

    // 시간 계산 개선 - 더 정밀한 위치 계산
    const timeSlotHeight = 20 // 각 15분 슬롯의 높이
    const exactTimeIndex = contentY / timeSlotHeight // 정확한 인덱스 (소수점 포함)
    const timeIndex = Math.floor(exactTimeIndex) // 기본 인덱스
    
    // 시간 범위 체크를 완화하여 영역 밖에서도 계산 가능하도록 함
    let baseTimeInMinutes: number
    if (timeIndex < 0) {
      // 시간표 위쪽 영역에서는 최소 시간 사용
      baseTimeInMinutes = 9 * 60 // 9:00
    } else if (timeIndex >= timeSlots.length) {
      // 시간표 아래쪽 영역에서는 최대 시간 사용
      baseTimeInMinutes = 22 * 60 // 22:00
    } else {
      baseTimeInMinutes = timeSlots[timeIndex]
    }
    
    // 15분 단위로 스냅하되, 마우스 위치를 더 정확하게 반영
    const fractionWithinSlot = exactTimeIndex - timeIndex
    const adjustedMinutes = baseTimeInMinutes + (fractionWithinSlot * 15)
    const snappedMinutes = snapToGrid(adjustedMinutes)
    
    // 범위 체크
    const minTime = 9 * 60 // 9:00
    const maxTime = 22 * 60 // 22:00
    const finalTimeInMinutes = Math.max(minTime, Math.min(maxTime, snappedMinutes))

    // 요일 계산 - 민감도 개선을 위한 여유 공간 추가
    const dayWidth = (rect.width - timeAreaWidth) / displayDays.length
    const marginPercentage = 0.2 // 각 요일 칸의 20%를 여유 공간으로 설정
    const effectiveDayWidth = dayWidth * (1 - marginPercentage)
    const marginWidth = dayWidth * marginPercentage / 2
    
    // 요일 인덱스 계산 시 여유 공간 고려
    let dayIndex = -1
    for (let i = 0; i < displayDays.length; i++) {
      const dayStart = i * dayWidth + marginWidth
      const dayEnd = i * dayWidth + dayWidth - marginWidth
      
      if (contentX >= dayStart && contentX <= dayEnd) {
        dayIndex = i
        break
      }
    }
    
    // 영역 밖에서도 가장 가까운 요일 선택
    if (dayIndex < 0) {
      if (contentX < 0) {
        dayIndex = 0 // 왼쪽 영역에서는 첫 번째 요일
      } else {
        dayIndex = displayDays.length - 1 // 오른쪽 영역에서는 마지막 요일
      }
    }

    const actualDayIndex = viewMode === 'week' ? dayIndex : selectedDay

    return { day: actualDayIndex, time: finalTimeInMinutes }
  }, [viewMode, selectedDay, displayDays.length, timeSlots])

  // 전역 마우스 이벤트 리스너 (드래그 중 정확한 추적을 위해)
  React.useEffect(() => {
    if (!isDragging) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      // 마우스 위치 추적 (항상 업데이트)
      setMousePosition({ x: e.clientX, y: e.clientY })
      
      if (draggedSchedule && dragOffset) {
        // 기존 시간표 이동 시 블록 위치 기반 계산
        const position = getTimeAndDayFromBlockPosition(e.clientX, e.clientY, dragOffset)
        // 영역 밖에서도 항상 위치 업데이트 (null 체크 제거)
        if (position) {
          setDragCurrent(position)
        }
      } else {
        // 새 시간표 생성 시 일반적인 위치 계산
        const position = getTimeAndDayFromPosition(e.clientX, e.clientY)
        // 영역 밖에서도 항상 위치 업데이트 (null 체크 제거)
        if (position) {
          setDragCurrent(position)
        }
      }
    }

    const handleGlobalMouseUp = () => {
      if (draggedSchedule && dragCurrent) {
        // 기존 시간표 이동
        const startTime = minutesToTime(dragCurrent.time)
        const originalStart = timeToMinutes(draggedSchedule.startTime)
        const originalEnd = timeToMinutes(draggedSchedule.endTime)
        const duration = originalEnd - originalStart
        const endTime = minutesToTime(dragCurrent.time + duration)

        onScheduleUpdate?.(draggedSchedule.id, {
          dayOfWeek: NUMBER_TO_DAY_OF_WEEK[dragCurrent.day],
          startTime: new Date(`1970-01-01T${startTime}:00`),
          endTime: new Date(`1970-01-01T${endTime}:00`)
        })
      } else if (dragStart && dragCurrent && !draggedSchedule) {
        // 새 시간표 생성 (기존 시간표 이동이 아닌 경우에만)
        const startMinutes = Math.min(dragStart.time, dragCurrent.time)
        const endMinutes = Math.max(dragStart.time, dragCurrent.time)
        
        // 최소 30분 보장
        const finalEndMinutes = Math.max(endMinutes, startMinutes + 30)
        
        const startTime = minutesToTime(snapToGrid(startMinutes))
        const endTime = minutesToTime(snapToGrid(finalEndMinutes))

        onScheduleCreate?.({
          dayOfWeek: NUMBER_TO_DAY_OF_WEEK[dragStart.day],
          startTime: startTime,
          endTime: endTime,
          title: '새 수업',
          academyId: 'demo-academy'
        } as any)
      }

      // 상태 초기화
      setIsDragging(false)
      setDragStart(null)
      setDragCurrent(null)
      setDraggedSchedule(null)
      setDragOffset(null)
      setMousePosition(null)
    }

    // 전역 이벤트 리스너 등록
    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false })
    document.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, draggedSchedule, dragOffset, dragStart, dragCurrent, getTimeAndDayFromBlockPosition, getTimeAndDayFromPosition, onScheduleCreate, onScheduleUpdate])

  // 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent, schedule?: any) => {
    // 읽기 전용 모드에서는 드래그 비활성화
    if (isReadOnly) return
    
    e.preventDefault()
    e.stopPropagation()
    
    if (schedule) {
      // 기존 시간표 드래그 시작 - 정확한 오프셋 계산
      const scheduleElement = e.currentTarget as HTMLElement
      const rect = scheduleElement.getBoundingClientRect()
      
      // 마우스가 스케줄 블록 내에서 클릭한 상대적 위치 계산
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top
      setDragOffset({ x: offsetX, y: offsetY })
      
      setDraggedSchedule(schedule)
      
      // 스케줄의 실제 시작 시간과 요일을 기준으로 설정 (마우스 위치가 아닌)
      const scheduleStartTime = timeToMinutes(schedule.startTime)
      const scheduleDay = schedule.dayOfWeek in DAY_OF_WEEK_TO_NUMBER ? DAY_OF_WEEK_TO_NUMBER[schedule.dayOfWeek as DayOfWeek] : 0
      
      // 드래그 시작과 현재 위치를 스케줄의 실제 위치로 설정
      setDragStart({ day: scheduleDay, time: scheduleStartTime })
      setDragCurrent({ day: scheduleDay, time: scheduleStartTime })
    } else {
      // 새 시간표 생성 시작
      setDragOffset(null)
      setDraggedSchedule(null)
      
      const position = getTimeAndDayFromPosition(e.clientX, e.clientY)
      if (position) {
        setDragStart(position)
        setDragCurrent(position)
      }
    }
    
    setIsDragging(true)
  }, [isReadOnly, getTimeAndDayFromPosition])

  // 드래그 중
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return

    e.preventDefault()

    // 마우스 위치 추적 (항상 업데이트)
    setMousePosition({ x: e.clientX, y: e.clientY })

    if (draggedSchedule && dragOffset) {
      // 기존 시간표 이동 시 블록 위치 기반 계산
      const position = getTimeAndDayFromBlockPosition(e.clientX, e.clientY, dragOffset)
      // 영역 밖에서도 항상 위치 업데이트
      if (position) {
        setDragCurrent(position)
      }
    } else {
      // 새 시간표 생성 시 일반적인 위치 계산
      const position = getTimeAndDayFromPosition(e.clientX, e.clientY)
      // 영역 밖에서도 항상 위치 업데이트
      if (position) {
        setDragCurrent(position)
      }
    }
  }, [isDragging, draggedSchedule, dragOffset, getTimeAndDayFromBlockPosition, getTimeAndDayFromPosition])

  // 드래그 끝
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return

    if (draggedSchedule && dragCurrent) {
      // 기존 시간표 이동
      const startTime = minutesToTime(dragCurrent.time)
      const originalStart = timeToMinutes(draggedSchedule.startTime)
      const originalEnd = timeToMinutes(draggedSchedule.endTime)
      const duration = originalEnd - originalStart
      const endTime = minutesToTime(dragCurrent.time + duration)

      onScheduleUpdate?.(draggedSchedule.id, {
        dayOfWeek: NUMBER_TO_DAY_OF_WEEK[dragCurrent.day],
        startTime: new Date(`1970-01-01T${startTime}:00`),
        endTime: new Date(`1970-01-01T${endTime}:00`)
      })
    } else if (dragStart && dragCurrent && !draggedSchedule) {
      // 새 시간표 생성 (기존 시간표 이동이 아닌 경우에만)
      const startMinutes = Math.min(dragStart.time, dragCurrent.time)
      const endMinutes = Math.max(dragStart.time, dragCurrent.time)
      
      // 최소 30분 보장
      const finalEndMinutes = Math.max(endMinutes, startMinutes + 30)
      
      const startTime = minutesToTime(snapToGrid(startMinutes))
      const endTime = minutesToTime(snapToGrid(finalEndMinutes))

      onScheduleCreate?.({
        dayOfWeek: NUMBER_TO_DAY_OF_WEEK[dragStart.day],
        startTime: startTime, // HH:MM 형식의 문자열로 전달
        endTime: endTime, // HH:MM 형식의 문자열로 전달
        title: '새 수업',
        academyId: 'demo-academy'
      } as any)
    }

    // 상태 초기화
    setIsDragging(false)
    setDragStart(null)
    setDragCurrent(null)
    setDraggedSchedule(null)
    setDragOffset(null)
    setMousePosition(null)
  }, [isDragging, dragStart, dragCurrent, draggedSchedule, onScheduleCreate, onScheduleUpdate])

  // 시간표를 렌더링하는 함수
  const renderSchedule = (schedule: any, dayIndex: number) => {
    if (!schedule || !schedule.startTime || !schedule.endTime) {
      return null
    }
    
    const startMinutes = timeToMinutes(schedule.startTime)
    const endMinutes = timeToMinutes(schedule.endTime)
    const duration = endMinutes - startMinutes
    
    // 9시부터의 상대적 위치 계산
    const relativeStart = startMinutes - 9 * 60
    const slotHeight = 20 // 15분당 높이
    const top = (relativeStart / 15) * slotHeight
    const height = (duration / 15) * slotHeight

    return (
      <div
        key={schedule.id}
        className={`absolute left-1 right-1 bg-blue-100 border border-blue-300 rounded transition-colors z-10 ${
          isReadOnly ? 'cursor-pointer hover:bg-blue-150' : 'cursor-move hover:bg-blue-200'
        }`}
        style={{
          top: `${top}px`,
          height: `${Math.max(height, 50)}px`,
          padding: '9px'
        }}
        onMouseDown={(e) => handleMouseDown(e, schedule)}
        onClick={() => onScheduleClick?.(schedule)}
      >
        {/* 첫 번째 줄: 시간 */}
        <div className="text-xs text-gray-700 mb-1">
          {schedule.startTime} - {schedule.endTime}
        </div>
        
        {/* 두 번째 줄: 강좌명 (굵게) */}
        <div className="font-bold text-xs text-gray-900 truncate mb-1">
          {schedule.title}
        </div>
        
        {/* 세 번째 줄: 강사명 (좌측, 굵게) + 강의실명 (우측) */}
        <div className="flex justify-between items-start">
          <div className="font-bold text-xs text-gray-700 truncate flex-1 mr-3">
            {schedule.instructor ? schedule.instructor.name : '강사 미정'}
          </div>
          <div className="text-xs text-gray-600 whitespace-nowrap">
            {schedule.classroom ? schedule.classroom.name : '강의실 미정'}
          </div>
        </div>
      </div>
    )
  }

  // 드래그 프리뷰 렌더링 (시각적 피드백 강화)
  const renderDragPreview = () => {
    if (!isDragging || !dragStart || !dragCurrent) return null

    if (draggedSchedule) {
      // 기존 시간표 이동 프리뷰
      const originalStart = timeToMinutes(draggedSchedule.startTime)
      const originalEnd = timeToMinutes(draggedSchedule.endTime)
      const duration = originalEnd - originalStart
      
      const relativeStart = dragCurrent.time - 9 * 60
      const slotHeight = 20
      const top = (relativeStart / 15) * slotHeight
      const height = (duration / 15) * slotHeight

      return (
        <div
          className="absolute left-1 right-1 bg-green-100 border-2 border-green-400 border-dashed rounded p-1 opacity-80 z-20 shadow-lg animate-pulse"
          style={{
            top: `${top}px`,
            height: `${height}px`,
            fontSize: '12px'
          }}
        >
          <div className="font-semibold truncate text-green-800">{draggedSchedule.title}</div>
          <div className="text-xs text-green-600 truncate">
            {(() => {
              const startTime = minutesToTime(dragCurrent.time)
              const endTime = minutesToTime(dragCurrent.time + duration)
              return `${startTime} - ${endTime}`
            })()}
          </div>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-green-500 rounded-full"></div>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-green-500 rounded-full"></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      )
    } else {
      // 새 시간표 생성 프리뷰 - 가이드라인에서 이미 처리하므로 간소화
      return null
    }
  }

  // 마우스 커서를 따라다니는 드래그 프리뷰 (시간표 영역 밖에서도 표시)
  const renderMouseFollowPreview = () => {
    if (!isDragging || !draggedSchedule || !mousePosition || !dragOffset) return null

    const originalStart = timeToMinutes(draggedSchedule.startTime)
    const originalEnd = timeToMinutes(draggedSchedule.endTime)
    const duration = originalEnd - originalStart
    const height = (duration / 15) * 20 // 15분당 20px

    return (
      <div
        className="fixed bg-green-100 border-2 border-green-400 border-dashed rounded p-1 opacity-90 z-50 shadow-lg pointer-events-none"
        style={{
          left: `${mousePosition.x - dragOffset.x}px`,
          top: `${mousePosition.y - dragOffset.y}px`,
          width: '120px',
          height: `${height}px`,
          fontSize: '12px'
        }}
      >
        <div className="font-semibold truncate text-green-800">{draggedSchedule.title}</div>
        <div className="text-xs text-green-600 truncate">
          {typeof draggedSchedule.startTime === 'string' ? draggedSchedule.startTime : draggedSchedule.startTime.toTimeString().slice(0, 5)} - {typeof draggedSchedule.endTime === 'string' ? draggedSchedule.endTime : draggedSchedule.endTime.toTimeString().slice(0, 5)}
        </div>
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-green-500 rounded-full"></div>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-green-500 rounded-full"></div>
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
      </div>
    )
  }

  // 드래그 가이드라인 렌더링 (시간대별 점선)
  const renderDragGuidelines = () => {
    if (!isDragging || !dragCurrent) return null

    const relativeStart = dragCurrent.time - 9 * 60
    const slotHeight = 20
    
    // 헤더 높이를 고려한 정확한 위치 계산
    const headerElement = calendarRef.current?.querySelector('.sticky')
    const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : 60
    const top = (relativeStart / 15) * slotHeight + headerHeight

    // 모든 드래그 피드백을 초록색으로 통일 (시각적 일관성)
    const guidelineColor = 'border-green-400'
    const textColor = 'text-green-600'
    const bgColor = 'bg-green-50'
    const isMovingExisting = !!draggedSchedule

    // 드래그 영역 계산 (기존 시간표 이동과 새 시간표 생성 모두 처리)
    let dragAreaTop = top
    let dragAreaHeight = 0
    
    if (isMovingExisting && draggedSchedule) {
      // 기존 시간표 이동 시 드래그 영역
      const originalStart = timeToMinutes(draggedSchedule.startTime)
      const originalEnd = timeToMinutes(draggedSchedule.endTime)
      const duration = originalEnd - originalStart
      
      dragAreaHeight = (duration / 15) * slotHeight
    } else if (!isMovingExisting && dragStart) {
      // 새 시간표 생성 시 드래그 영역 (헤더 높이 고려)
      const startRelative = dragStart.time - 9 * 60
      const currentRelative = dragCurrent.time - 9 * 60
      const startTop = (startRelative / 15) * slotHeight + headerHeight
      const currentTop = (currentRelative / 15) * slotHeight + headerHeight
      
      dragAreaTop = Math.min(startTop, currentTop)
      dragAreaHeight = Math.abs(currentTop - startTop)
      
      // 최소 높이 보장 (30분 = 40px)
      if (dragAreaHeight < 40) {
        dragAreaHeight = 40
      }
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* 드래그 영역 미리보기 (기존 이동과 새 생성 모두 초록색으로 통일) */}
        {dragAreaHeight > 0 && (
          <div 
            className={`absolute border-2 border-dashed ${guidelineColor} ${bgColor} opacity-80 rounded shadow-lg`}
            style={{ 
              // 정확한 요일 위치 계산
              left: `calc(80px + ${dragCurrent.day} * (100% - 80px) / ${displayDays.length})`,
              width: `calc((100% - 80px) / ${displayDays.length} - 2px)`,
              top: `${dragAreaTop}px`,
              height: `${dragAreaHeight}px`,
              marginLeft: '1px'
            }}
          >
            <div className="absolute inset-0 border border-green-300 rounded animate-pulse opacity-40"></div>
            
            {/* 드래그 박스 내부 정보 표시 */}
            <div className="p-2 h-full flex flex-col justify-center items-center text-center">
              {isMovingExisting && draggedSchedule ? (
                // 기존 시간표 이동 시
                <>
                  <div className="text-xs font-bold text-green-800 mb-1">{draggedSchedule.title}</div>
                  <div className="text-xs text-green-600 font-medium">
                    {(() => {
                      const originalStart = timeToMinutes(draggedSchedule.startTime)
                      const originalEnd = timeToMinutes(draggedSchedule.endTime)
                      const duration = originalEnd - originalStart
                      const newStartTime = minutesToTime(dragCurrent.time)
                      const newEndTime = minutesToTime(dragCurrent.time + duration)
                      return `${newStartTime} - ${newEndTime}`
                    })()}
                  </div>
                  <div className="text-xs text-green-500 mt-1">📍 {displayDays[dragCurrent.day]}</div>
                </>
              ) : (
                // 새 시간표 생성 시
                dragStart && dragCurrent && (
                  <>
                    <div className="text-xs font-bold text-green-800 mb-1">✨ 새 수업</div>
                    <div className="text-xs text-green-600 font-medium">
                      {(() => {
                        const startMinutes = Math.min(dragStart.time, dragCurrent.time)
                        const endMinutes = Math.max(dragStart.time, dragCurrent.time)
                        const finalEndMinutes = Math.max(endMinutes, startMinutes + 30)
                        return `${minutesToTime(snapToGrid(startMinutes))} - ${minutesToTime(snapToGrid(finalEndMinutes))}`
                      })()}
                    </div>
                    <div className="text-xs text-green-500 mt-1">⏰ {displayDays[dragCurrent.day]}</div>
                  </>
                )
              )}
            </div>
          </div>
        )}

        {/* 가로 가이드라인 (시간 위치) - 더 굵고 명확하게 */}
        <div 
          className={`absolute left-0 right-0 border-t-2 border-dashed ${guidelineColor} opacity-90`}
          style={{ 
            top: `${top}px`,
            boxShadow: '0 1px 3px rgba(34, 197, 94, 0.3)'
          }}
        />

        {/* 기존 스케줄 이동 시 상세 정보 */}
        {isMovingExisting && draggedSchedule && (
          <div 
            className="absolute right-4 px-4 py-3 bg-green-50 rounded-lg shadow-xl border-2 border-green-200 text-sm z-30"
            style={{ 
              top: `${Math.max(10, top - 60)}px`
            }}
          >
            <div className="font-bold text-green-800 mb-1">{draggedSchedule.title}</div>
            <div className="text-green-600 font-medium">
              {(() => {
                const originalStart = timeToMinutes(draggedSchedule.startTime)
                const originalEnd = timeToMinutes(draggedSchedule.endTime)
                const duration = originalEnd - originalStart
                const newStartTime = minutesToTime(dragCurrent.time)
                const newEndTime = minutesToTime(dragCurrent.time + duration)
                return `${newStartTime} - ${newEndTime}`
              })()}
            </div>
            <div className="text-green-500 text-xs mt-1 animate-pulse">📍 이동 중...</div>
          </div>
        )}

        {/* 새 시간표 생성 시 시간 범위 표시 - 현재 마우스 위치 기반으로 실시간 업데이트 */}
        {!isMovingExisting && dragStart && dragCurrent && (
          <div 
            className="absolute right-4 px-4 py-3 bg-green-50 rounded-lg shadow-xl border-2 border-green-200 text-sm z-30"
            style={{ 
              top: `${Math.max(10, dragAreaTop)}px`
            }}
          >
            <div className="font-bold text-green-800 mb-1">✨ 새 수업</div>
            <div className="text-green-600 font-medium">
              {(() => {
                // 현재 마우스 위치와 드래그 시작점을 같은 요일에서 처리
                const startMinutes = Math.min(dragStart.time, dragCurrent.time)
                const endMinutes = Math.max(dragStart.time, dragCurrent.time)
                const finalEndMinutes = Math.max(endMinutes, startMinutes + 30)
                return `${minutesToTime(snapToGrid(startMinutes))} - ${minutesToTime(snapToGrid(finalEndMinutes))}`
              })()}
            </div>
            <div className="text-green-500 text-xs mt-1 animate-pulse">⏰ {displayDays[dragCurrent.day]} 시간 선택 중...</div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-white rounded-lg border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">시간표를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">시간표</h2>
        <div className="flex items-center gap-4">
          {/* 뷰 모드 선택 */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              주간
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'day'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              일간
            </button>
          </div>

          {/* 일간 뷰일 때 요일 선택 */}
          {viewMode === 'day' && (
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              {DAYS.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 캘린더 그리드 */}
      <div className="flex-1 overflow-auto">
        <div
          ref={calendarRef}
          className="relative select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* 시간/요일 헤더 */}
          <div className="sticky top-0 bg-white z-30 border-b-2 border-gray-300">
            <div className="flex">
              <div className="w-20 h-15 border-r-2 border-gray-300 bg-gray-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-700">시간</span>
              </div>
              {displayDays.map((day, index) => (
                <div
                  key={day}
                  className="flex-1 h-15 border-r-2 border-gray-300 flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-800">{day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 드래그 가이드라인 */}
          {renderDragGuidelines()}

          {/* 시간 슬롯들 */}
          <div className="flex">
            {/* 시간 라벨 열 */}
            <div className="w-20 border-r bg-gray-50">
              {timeSlots.map((timeMinutes, index) => {
                const isHourMark = timeMinutes % 60 === 0 // 정시 체크 (XX:00)
                return (
                  <div
                    key={timeMinutes}
                    className={`h-5 flex items-center justify-end pr-2 border-b border-gray-100`}
                    style={{ fontSize: '11px' }}
                  >
                    {isHourMark && ( // 정각(XX:00)에만 시간 표시
                      <span className="text-gray-600 font-medium">
                        {(() => {
                          const time = minutesToTime(timeMinutes)
                          const hour = parseInt(time.split(':')[0])
                          const period = hour >= 12 ? '오후' : '오전'
                          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
                          return `${period} ${displayHour}시`
                        })()}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 요일 열들 */}
            {displayDays.map((day, dayIndex) => {
              const actualDayIndex = viewMode === 'week' ? dayIndex : selectedDay
              const daySchedules = Array.isArray(schedules) 
                ? schedules.filter((s: Schedule) => s && s.dayOfWeek && DAY_OF_WEEK_TO_NUMBER[s.dayOfWeek] === actualDayIndex) 
                : []

              return (
                <div key={day} className="flex-1 border-r-2 border-gray-300 relative bg-white">
                  {/* 시간 슬롯 배경 */}
                  {timeSlots.map((timeMinutes, index) => {
                    return (
                      <div
                        key={timeMinutes}
                        className={`h-5 border-b border-gray-100 ${isReadOnly ? 'cursor-default' : 'hover:bg-blue-50 cursor-crosshair'}`}
                        onMouseDown={(e) => !isReadOnly && handleMouseDown(e)}
                      />
                    )
                  })}

                  {/* 시간표들 */}
                  {daySchedules.map((schedule: Schedule) => renderSchedule(schedule, dayIndex))}

                  {/* 드래그 프리뷰 (해당 요일에만) */}
                  {!isReadOnly && isDragging && dragCurrent && dragCurrent.day === actualDayIndex && renderDragPreview()}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 마우스 커서를 따라다니는 드래그 프리뷰 (전역 위치) */}
      {renderMouseFollowPreview()}
    </div>
  )
} 