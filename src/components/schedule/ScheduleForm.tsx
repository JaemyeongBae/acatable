// 시간표 입력/수정 폼 컴포넌트
// 목적: 시간표 생성 및 수정을 위한 폼 인터페이스

'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import ColorPicker from '@/components/ui/ColorPicker'
import { DayOfWeek } from '@/types'

interface ScheduleFormData {
  title: string
  description: string
  dayOfWeek: DayOfWeek | ''
  startTime: string
  endTime: string
  subjectId: string
  instructorId: string
  classroomId: string
  classTypeId: string
  maxStudents: number | ''
  color: string
}

interface ScheduleFormProps {
  academyId: string
  schedule?: any // 수정할 시간표 데이터
  onSuccess: (message: string, formData?: ScheduleFormData) => void
  onCancel: () => void
  onError?: (message: string) => void
  onDelete?: (scheduleId: string) => void
}

interface SelectOption {
  id: string
  name: string
}

const DAY_OPTIONS = [
  { value: 'MONDAY', label: '월요일' },
  { value: 'TUESDAY', label: '화요일' },
  { value: 'WEDNESDAY', label: '수요일' },
  { value: 'THURSDAY', label: '목요일' },
  { value: 'FRIDAY', label: '금요일' },
  { value: 'SATURDAY', label: '토요일' },
  { value: 'SUNDAY', label: '일요일' }
]

// 시간 옵션 생성 (09:00 ~ 22:00, 30분 단위)
const generateTimeOptions = () => {
  const options = []
  for (let hour = 9; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      options.push(time)
    }
  }
  return options
}

export default function ScheduleForm({ 
  academyId, 
  schedule, 
  onSuccess, 
  onCancel,
  onError,
  onDelete 
}: ScheduleFormProps) {
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: '',
    description: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    subjectId: '',
    instructorId: '',
    classroomId: '',
    classTypeId: '',
    maxStudents: '',
    color: '#3B82F6' // 기본값: 파란색
  })

  const [options, setOptions] = useState({
    subjects: [] as SelectOption[],
    instructors: [] as SelectOption[],
    classrooms: [] as SelectOption[],
    classTypes: [] as SelectOption[]
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [warnings, setWarnings] = useState<{ [key: string]: string }>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  const timeOptions = generateTimeOptions()

  // 폼 데이터 초기화
  useEffect(() => {
    if (schedule) {
      // startTime과 endTime이 Date 객체인 경우 HH:MM 형식으로 변환
      let startTimeStr = schedule.startTime || ''
      let endTimeStr = schedule.endTime || ''
      
      if (schedule.startTime instanceof Date) {
        startTimeStr = schedule.startTime.toTimeString().slice(0, 5)
      } else if (typeof schedule.startTime === 'string') {
        startTimeStr = schedule.startTime
      }
      
      if (schedule.endTime instanceof Date) {
        endTimeStr = schedule.endTime.toTimeString().slice(0, 5)
      } else if (typeof schedule.endTime === 'string') {
        endTimeStr = schedule.endTime
      }
      
      setFormData({
        title: schedule.title || '',
        description: schedule.description || '',
        dayOfWeek: schedule.dayOfWeek || '',
        startTime: startTimeStr,
        endTime: endTimeStr,
        subjectId: schedule.subjectId || schedule.subject?.id || '',
        instructorId: schedule.instructorId || schedule.instructor?.id || '',
        classroomId: schedule.classroomId || schedule.classroom?.id || '',
        classTypeId: schedule.classTypeId || schedule.classType?.id || '',
        maxStudents: schedule.maxStudents || '',
        color: schedule.color || '#3B82F6' // 기본값: 파란색
      })
    }
  }, [schedule])

  // 선택 옵션 데이터 페칭
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [subjectsRes, instructorsRes, classroomsRes, classTypesRes] = await Promise.all([
          fetch(`/api/subjects?academyId=${academyId}`),
          fetch(`/api/instructors?academyId=${academyId}`),
          fetch(`/api/classrooms?academyId=${academyId}`),
          fetch(`/api/class-types?academyId=${academyId}`)
        ])

        const [subjects, instructors, classrooms, classTypes] = await Promise.all([
          subjectsRes.json(),
          instructorsRes.json(),
          classroomsRes.json(),
          classTypesRes.json()
        ])

        setOptions({
          subjects: subjects.success ? subjects.data : [],
          instructors: instructors.success ? instructors.data : [],
          classrooms: classrooms.success ? classrooms.data : [],
          classTypes: classTypes.success ? classTypes.data : []
        })
      } catch (error) {
        console.error('옵션 데이터 로딩 실패:', error)
      }
    }

    fetchOptions()
  }, [academyId])

  // 실시간 충돌 검증
  const validateConflicts = async () => {
    if (!formData.dayOfWeek || !formData.startTime || !formData.endTime || 
        !formData.instructorId || !formData.classroomId) {
      setWarnings({})
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch('/api/schedules/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          academyId,
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
          instructorId: formData.instructorId,
          classroomId: formData.classroomId,
          excludeId: schedule?.id // 수정 시 현재 시간표 제외
        })
      })

      const result = await response.json()

      if (result.success) {
        const newWarnings: { [key: string]: string } = {}

        if (result.conflicts?.instructor) {
          newWarnings.instructorId = `강사가 ${result.conflicts.instructor.startTime}-${result.conflicts.instructor.endTime}에 다른 수업이 있습니다.`
        }

        if (result.conflicts?.classroom) {
          newWarnings.classroomId = `강의실이 ${result.conflicts.classroom.startTime}-${result.conflicts.classroom.endTime}에 사용 중입니다.`
        }

        setWarnings(newWarnings)
      }
    } catch (error) {
      console.error('충돌 검증 오류:', error)
    } finally {
      setIsValidating(false)
    }
  }

  // 실시간 검증 트리거 (디바운스 적용)
  useEffect(() => {
    const timer = setTimeout(() => {
      validateConflicts()
    }, 500) // 500ms 디바운스

    return () => clearTimeout(timer)
  }, [formData.dayOfWeek, formData.startTime, formData.endTime, formData.instructorId, formData.classroomId])

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.title.trim()) {
      newErrors.title = '강의명을 입력해주세요.'
    }

    if (!formData.dayOfWeek) {
      newErrors.dayOfWeek = '요일을 선택해주세요.'
    }

    if (!formData.startTime) {
      newErrors.startTime = '시작 시간을 선택해주세요.'
    }

    if (!formData.endTime) {
      newErrors.endTime = '종료 시간을 선택해주세요.'
    }

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = '종료 시간은 시작 시간보다 늦어야 합니다.'
    }

    // 과목, 강사, 강의실, 수업유형은 선택사항으로 변경
    // 필요에 따라 나중에 입력 가능

    if (formData.maxStudents !== '' && formData.maxStudents <= 0) {
      newErrors.maxStudents = '최대 수강 인원은 1명 이상이어야 합니다.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 입력 값 변경 핸들러
  const handleChange = (field: keyof ScheduleFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // 실시간 유효성 검사 (제출 시도 후에만)
    if (submitAttempted) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }

    // 경고 메시지 초기화 (해당 필드)
    if (warnings[field]) {
      const newWarnings = { ...warnings }
      delete newWarnings[field]
      setWarnings(newWarnings)
    }
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)

    if (!validateForm()) {
      return
    }

    // 충돌이 있는 경우 경고 표시
    if (Object.keys(warnings).length > 0) {
      const confirmMessage = '시간 충돌이 감지되었습니다. 그래도 저장하시겠습니까?\n\n' + 
        Object.values(warnings).join('\n')
      
      if (!confirm(confirmMessage)) {
        return
      }
    }

    setLoading(true)

    try {
      const endpoint = schedule?.id
        ? `/api/schedules/${schedule.id}` 
        : '/api/schedules'
      
      const method = schedule?.id ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          academyId,
          maxStudents: formData.maxStudents === '' ? null : Number(formData.maxStudents)
        })
      })

      const result = await response.json()

      if (result.success) {
        const message = '시간표가 설정되었습니다.'
        onSuccess(message, formData)
      } else {
        if (result.errors) {
          setErrors(result.errors)
        } else {
          const errorMessage = result.message || '저장에 실패했습니다.'
          setErrors({ submit: errorMessage })
          if (onError) {
            onError(errorMessage)
          }
        }
      }
    } catch (error) {
      console.error('폼 제출 오류:', error)
      const errorMessage = '네트워크 오류가 발생했습니다.'
      setErrors({ submit: errorMessage })
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  // 삭제 핸들러 (confirm은 상위 컴포넌트에서 처리)
  const handleDelete = async () => {
    if (!schedule?.id || !onDelete) return
    
    setLoading(true)
    try {
      onDelete(schedule.id)
    } catch (error) {
      console.error('삭제 오류:', error)
      setErrors({ submit: '삭제 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* 검증 상태 표시 */}
      {isValidating && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          시간 충돌을 확인하는 중...
        </div>
      )}

      {/* 경고 메시지 */}
      {Object.keys(warnings).length > 0 && (
        <div 
          className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md"
          role="alert"
          aria-live="polite"
        >
          <div className="flex">
            <svg className="flex-shrink-0 h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium">시간 충돌 경고</h3>
              <div className="mt-1 text-sm">
                <ul className="space-y-1">
                  {Object.entries(warnings).map(([field, message]) => (
                    <li key={field}>• {message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {errors.submit && (
        <div 
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"
          role="alert"
          aria-live="polite"
        >
          {errors.submit}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 강의명 */}
        <div className="md:col-span-2">
          <label 
            htmlFor="title" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            강의명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="예: 고1 홍길동T 수학A반"
            aria-describedby={errors.title ? 'title-error' : undefined}
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p id="title-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.title}
            </p>
          )}
        </div>

        {/* 요일 */}
        <div>
          <label 
            htmlFor="dayOfWeek" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            요일 <span className="text-red-500">*</span>
          </label>
          <select
            id="dayOfWeek"
            value={formData.dayOfWeek}
            onChange={(e) => handleChange('dayOfWeek', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.dayOfWeek ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
            aria-describedby={errors.dayOfWeek ? 'dayOfWeek-error' : undefined}
            aria-invalid={!!errors.dayOfWeek}
          >
            <option value="">요일 선택</option>
            {DAY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.dayOfWeek && (
            <p id="dayOfWeek-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.dayOfWeek}
            </p>
          )}
        </div>

        {/* 최대 수강 인원 */}
        <div>
          <label 
            htmlFor="maxStudents" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            최대 수강 인원
          </label>
          <input
            type="number"
            id="maxStudents"
            value={formData.maxStudents}
            onChange={(e) => handleChange('maxStudents', e.target.value === '' ? '' : Number(e.target.value))}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.maxStudents ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="예: 20"
            min="1"
            aria-describedby={errors.maxStudents ? 'maxStudents-error' : undefined}
            aria-invalid={!!errors.maxStudents}
          />
          {errors.maxStudents && (
            <p id="maxStudents-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.maxStudents}
            </p>
          )}
        </div>
      </div>

      {/* 색상 - 독립된 행 */}
      <div>
        <label 
          htmlFor="color" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          색상
        </label>
        <ColorPicker
          value={formData.color}
          onChange={(color) => handleChange('color', color)}
          disabled={loading}
        />
      </div>

      {/* 시간 설정 - 같은 행 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 시작 시간 */}
        <div>
          <label 
            htmlFor="startTime" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            시작 시간 <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="startTime"
            value={formData.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.startTime ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
            step="900"
            aria-describedby={errors.startTime ? 'startTime-error' : undefined}
            aria-invalid={!!errors.startTime}
          />
          {errors.startTime && (
            <p id="startTime-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.startTime}
            </p>
          )}
        </div>

        {/* 종료 시간 */}
        <div>
          <label 
            htmlFor="endTime" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            종료 시간 <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="endTime"
            value={formData.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.endTime ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
            step="900"
            aria-describedby={errors.endTime ? 'endTime-error' : undefined}
            aria-invalid={!!errors.endTime}
          />
          {errors.endTime && (
            <p id="endTime-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.endTime}
            </p>
          )}
        </div>
      </div>

      {/* 나머지 필드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 과목 */}
        <div>
          <label 
            htmlFor="subjectId" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            과목
          </label>
          <select
            id="subjectId"
            value={formData.subjectId}
            onChange={(e) => handleChange('subjectId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.subjectId ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
            aria-describedby={errors.subjectId ? 'subjectId-error' : undefined}
            aria-invalid={!!errors.subjectId}
          >
            <option value="">과목 선택</option>
            {options.subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjectId && (
            <p id="subjectId-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.subjectId}
            </p>
          )}
        </div>

        {/* 강사 */}
        <div>
          <label 
            htmlFor="instructorId" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            강사
          </label>
          <select
            id="instructorId"
            value={formData.instructorId}
            onChange={(e) => handleChange('instructorId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.instructorId ? 'border-red-300 focus:border-red-500' : 
              warnings.instructorId ? 'border-yellow-300 focus:border-yellow-500' :
              'border-gray-300 focus:border-blue-500'
            }`}
            aria-describedby={errors.instructorId ? 'instructorId-error' : warnings.instructorId ? 'instructorId-warning' : undefined}
            aria-invalid={!!errors.instructorId}
          >
            <option value="">강사 선택</option>
            {options.instructors.map(instructor => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name}
              </option>
            ))}
          </select>
          {errors.instructorId && (
            <p id="instructorId-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.instructorId}
            </p>
          )}
          {warnings.instructorId && !errors.instructorId && (
            <p id="instructorId-warning" className="mt-1 text-sm text-yellow-600" role="alert">
              {warnings.instructorId}
            </p>
          )}
        </div>

        {/* 강의실 */}
        <div>
          <label 
            htmlFor="classroomId" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            강의실
          </label>
          <select
            id="classroomId"
            value={formData.classroomId}
            onChange={(e) => handleChange('classroomId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.classroomId ? 'border-red-300 focus:border-red-500' : 
              warnings.classroomId ? 'border-yellow-300 focus:border-yellow-500' :
              'border-gray-300 focus:border-blue-500'
            }`}
            aria-describedby={errors.classroomId ? 'classroomId-error' : warnings.classroomId ? 'classroomId-warning' : undefined}
            aria-invalid={!!errors.classroomId}
          >
            <option value="">강의실 선택</option>
            {options.classrooms.map(classroom => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>
          {errors.classroomId && (
            <p id="classroomId-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.classroomId}
            </p>
          )}
          {warnings.classroomId && !errors.classroomId && (
            <p id="classroomId-warning" className="mt-1 text-sm text-yellow-600" role="alert">
              {warnings.classroomId}
            </p>
          )}
        </div>

        {/* 수업 유형 */}
        <div>
          <label 
            htmlFor="classTypeId" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            수업 유형
          </label>
          <select
            id="classTypeId"
            value={formData.classTypeId}
            onChange={(e) => handleChange('classTypeId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.classTypeId ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
            aria-describedby={errors.classTypeId ? 'classTypeId-error' : undefined}
            aria-invalid={!!errors.classTypeId}
          >
            <option value="">수업 유형 선택</option>
            {options.classTypes.map(classType => (
              <option key={classType.id} value={classType.id}>
                {classType.name}
              </option>
            ))}
          </select>
          {errors.classTypeId && (
            <p id="classTypeId-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.classTypeId}
            </p>
          )}
        </div>

        {/* 설명 */}
        <div className="md:col-span-2">
          <label 
            htmlFor="description" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            설명
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="수업에 대한 추가 정보를 입력하세요."
          />
        </div>
      </div>

      {/* 버튼 그룹 */}
      <div className="flex justify-between pt-6 border-t">
        {/* 삭제 버튼 (수정 모드에서만 표시) */}
        <div>
          {schedule && (
            <button
              type="button"
              onClick={() => handleDelete()}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              삭제
            </button>
          )}
        </div>
        
        {/* 취소/저장 버튼 */}
        <div className="flex space-x-3">
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            disabled={loading}
          >
            취소
          </Button>
        <Button
          type="submit"
          disabled={loading || isValidating}
          className={`transition-all duration-200 ${
            loading || isValidating
              ? 'bg-gray-400 cursor-not-allowed' 
              : Object.keys(warnings).length > 0 
                ? 'bg-yellow-600 hover:bg-yellow-700' 
                : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {loading ? (
            <>
              <svg 
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                fill="none" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              처리중...
            </>
          ) : isValidating ? (
            <>
              <svg 
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                fill="none" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
              </svg>
              확인중...
            </>
          ) : Object.keys(warnings).length > 0 ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              충돌 무시하고 {schedule ? '수정' : '등록'}
            </>
          ) : (
            schedule ? '수정' : '등록'
          )}
        </Button>
        </div>
      </div>
    </form>
  )
}