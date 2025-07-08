// 시간표 상세 정보 모달 컴포넌트
// 목적: 시간표 클릭 시 상세 정보를 모달로 표시

'use client'

import { DayOfWeek } from '@/types'
import Button from '@/components/ui/Button'

interface ScheduleDetailModalProps {
  schedule: {
    id: string
    title: string
    description?: string
    dayOfWeek: DayOfWeek
    startTime: string
    endTime: string
    maxStudents?: number
    currentStudents?: number
    instructor?: { name: string } | null
    classroom?: { name: string } | null
    subject?: { name: string; color?: string } | null
    classType?: { name: string; color?: string } | null
  }
  onClose: () => void
}

const DAY_LABELS: { [key in DayOfWeek]: string } = {
  MONDAY: '월요일',
  TUESDAY: '화요일',
  WEDNESDAY: '수요일',
  THURSDAY: '목요일',
  FRIDAY: '금요일',
  SATURDAY: '토요일',
  SUNDAY: '일요일'
}

export default function ScheduleDetailModal({ schedule, onClose }: ScheduleDetailModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-detail-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 
            id="schedule-detail-title" 
            className="text-xl font-semibold text-gray-900"
          >
            수업 상세 정보
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
            aria-label="모달 닫기"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
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

        {/* 내용 */}
        <div className="p-6 space-y-6">
          {/* 수업 제목 */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {schedule.title}
            </h3>
            {schedule.description && (
              <p className="text-gray-600 leading-relaxed">
                {schedule.description}
              </p>
            )}
          </div>

          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 과목 */}
            {schedule.subject && (
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: schedule.subject?.color || '#3B82F6' }}
              ></div>
              <div>
                <p className="text-sm text-gray-500">과목</p>
                <p className="font-medium text-gray-900">{schedule.subject.name}</p>
              </div>
            </div>
            )}

            {/* 수업 유형 */}
            {schedule.classType && (
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: schedule.classType?.color || '#6B7280' }}
              ></div>
              <div>
                <p className="text-sm text-gray-500">수업 유형</p>
                <p className="font-medium text-gray-900">{schedule.classType.name}</p>
              </div>
            </div>
            )}
          </div>

          {/* 시간 정보 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              수업 시간
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">요일</span>
                <span className="font-medium">{DAY_LABELS[schedule.dayOfWeek]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">시간</span>
                <span className="font-medium">
                  {schedule.startTime} - {schedule.endTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">수업 시간</span>
                <span className="font-medium">
                  {calculateDuration(schedule.startTime, schedule.endTime)}
                </span>
              </div>
            </div>
          </div>

          {/* 장소 및 담당자 정보 */}
          <div className="grid grid-cols-1 gap-4">
            {/* 강사 */}
            {schedule.instructor && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">담당 강사</p>
                <p className="font-medium text-gray-900">{schedule.instructor.name}</p>
              </div>
            </div>
            )}

            {/* 강의실 */}
            {schedule.classroom && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">강의실</p>
                <p className="font-medium text-gray-900">{schedule.classroom.name}</p>
              </div>
            </div>
            )}
          </div>

          {/* 수강 인원 정보 */}
          {(schedule.maxStudents || schedule.currentStudents) && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                수강 정보
              </h4>
              <div className="space-y-2">
                {schedule.currentStudents !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">현재 수강생</span>
                    <span className="font-medium">{schedule.currentStudents}명</span>
                  </div>
                )}
                {schedule.maxStudents && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">최대 인원</span>
                    <span className="font-medium">{schedule.maxStudents}명</span>
                  </div>
                )}
                {schedule.maxStudents && schedule.currentStudents !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">여석</span>
                    <span className="font-medium text-green-600">
                      {schedule.maxStudents - schedule.currentStudents}명
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end p-6 border-t">
          <Button
            onClick={onClose}
            variant="outline"
            className="text-gray-600 hover:text-gray-900"
          >
            닫기
          </Button>
        </div>
      </div>
    </div>
  )
}

// 수업 시간 계산 함수
function calculateDuration(startTime: string, endTime: string): string {
  const start = new Date(`2000-01-01T${startTime}:00`)
  const end = new Date(`2000-01-01T${endTime}:00`)
  const diffMs = end.getTime() - start.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  
  if (hours > 0 && minutes > 0) {
    return `${hours}시간 ${minutes}분`
  } else if (hours > 0) {
    return `${hours}시간`
  } else {
    return `${minutes}분`
  }
} 