// 데이터 유효성 검증 스키마
// 목적: API 입력값 검증 및 타입 안전성 보장

import { DayOfWeek, ValidationError } from '@/types'

/**
 * 유효성 검증 결과 타입
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * 기본 유효성 검증 함수들
 */
export const validators = {
  /**
   * 필수 필드 검증
   */
  required: (value: any, fieldName: string): ValidationError | null => {
    if (value === undefined || value === null || value === '') {
      return { field: fieldName, message: `${fieldName}은(는) 필수입니다.` }
    }
    return null
  },

  /**
   * 문자열 길이 검증
   */
  stringLength: (
    value: string, 
    fieldName: string, 
    min: number = 0, 
    max: number = 255
  ): ValidationError | null => {
    if (typeof value !== 'string') {
      return { field: fieldName, message: `${fieldName}은(는) 문자열이어야 합니다.` }
    }
    if (value.length < min) {
      return { field: fieldName, message: `${fieldName}은(는) 최소 ${min}자 이상이어야 합니다.` }
    }
    if (value.length > max) {
      return { field: fieldName, message: `${fieldName}은(는) 최대 ${max}자까지 입력 가능합니다.` }
    }
    return null
  },

  /**
   * 이메일 형식 검증
   */
  email: (value: string, fieldName: string = '이메일'): ValidationError | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return { field: fieldName, message: '올바른 이메일 형식이 아닙니다.' }
    }
    return null
  },

  /**
   * 전화번호 형식 검증 (한국 형식)
   */
  phone: (value: string, fieldName: string = '전화번호'): ValidationError | null => {
    const phoneRegex = /^(\d{2,3}-\d{3,4}-\d{4}|\d{10,11})$/
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return { field: fieldName, message: '올바른 전화번호 형식이 아닙니다.' }
    }
    return null
  },

  /**
   * 시간 형식 검증 (HH:MM)
   */
  timeFormat: (value: string, fieldName: string = '시간'): ValidationError | null => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(value)) {
      return { field: fieldName, message: 'HH:MM 형식으로 입력해주세요.' }
    }
    return null
  },

  /**
   * 요일 검증
   */
  dayOfWeek: (value: string, fieldName: string = '요일'): ValidationError | null => {
    const validDays: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
    if (!validDays.includes(value as DayOfWeek)) {
      return { field: fieldName, message: '올바른 요일을 선택해주세요.' }
    }
    return null
  },

  /**
   * 숫자 범위 검증
   */
  numberRange: (
    value: number, 
    fieldName: string, 
    min: number = 0, 
    max: number = Number.MAX_SAFE_INTEGER
  ): ValidationError | null => {
    if (typeof value !== 'number' || isNaN(value)) {
      return { field: fieldName, message: `${fieldName}은(는) 숫자여야 합니다.` }
    }
    if (value < min) {
      return { field: fieldName, message: `${fieldName}은(는) ${min} 이상이어야 합니다.` }
    }
    if (value > max) {
      return { field: fieldName, message: `${fieldName}은(는) ${max} 이하여야 합니다.` }
    }
    return null
  }
}

/**
 * 학원 정보 유효성 검증
 */
export function validateAcademy(data: any): ValidationResult {
  const errors: ValidationError[] = []

  // 필수 필드 검증
  const nameError = validators.required(data.name, '학원명')
  if (nameError) errors.push(nameError)

  // 학원명 길이 검증
  if (data.name) {
    const nameLengthError = validators.stringLength(data.name, '학원명', 1, 100)
    if (nameLengthError) errors.push(nameLengthError)
  }

  // 선택적 필드 검증
  if (data.email) {
    const emailError = validators.email(data.email, '이메일')
    if (emailError) errors.push(emailError)
  }

  if (data.phone) {
    const phoneError = validators.phone(data.phone, '전화번호')
    if (phoneError) errors.push(phoneError)
  }

  if (data.address) {
    const addressError = validators.stringLength(data.address, '주소', 0, 200)
    if (addressError) errors.push(addressError)
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * 과목 정보 유효성 검증
 */
export function validateSubject(data: any): ValidationResult {
  const errors: ValidationError[] = []

  const nameError = validators.required(data.name, '과목명')
  if (nameError) errors.push(nameError)

  if (data.name) {
    const nameLengthError = validators.stringLength(data.name, '과목명', 1, 50)
    if (nameLengthError) errors.push(nameLengthError)
  }

  // 색상 코드 검증 (HEX)
  if (data.color) {
    const colorRegex = /^#[0-9A-Fa-f]{6}$/
    if (!colorRegex.test(data.color)) {
      errors.push({ field: 'color', message: '올바른 색상 코드(#RRGGBB) 형식이 아닙니다.' })
    }
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * 강의실 정보 유효성 검증
 */
export function validateClassroom(data: any): ValidationResult {
  const errors: ValidationError[] = []

  const nameError = validators.required(data.name, '강의실명')
  if (nameError) errors.push(nameError)

  if (data.name) {
    const nameLengthError = validators.stringLength(data.name, '강의실명', 1, 50)
    if (nameLengthError) errors.push(nameLengthError)
  }

  if (data.capacity !== undefined && data.capacity !== null) {
    const capacityError = validators.numberRange(data.capacity, '수용인원', 1, 1000)
    if (capacityError) errors.push(capacityError)
  }

  if (data.floor !== undefined && data.floor !== null) {
    const floorError = validators.numberRange(data.floor, '층수', -5, 50)
    if (floorError) errors.push(floorError)
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * 시간표 정보 유효성 검증
 */
export function validateSchedule(data: any): ValidationResult {
  const errors: ValidationError[] = []

  // 필수 필드 검증
  const titleError = validators.required(data.title, '강의명')
  if (titleError) errors.push(titleError)

  const dayError = validators.required(data.dayOfWeek, '요일')
  if (dayError) errors.push(dayError)

  const startTimeError = validators.required(data.startTime, '시작시간')
  if (startTimeError) errors.push(startTimeError)

  const endTimeError = validators.required(data.endTime, '종료시간')
  if (endTimeError) errors.push(endTimeError)

  // 형식 검증
  if (data.title) {
    const titleLengthError = validators.stringLength(data.title, '강의명', 1, 100)
    if (titleLengthError) errors.push(titleLengthError)
  }

  if (data.dayOfWeek) {
    const dayValidationError = validators.dayOfWeek(data.dayOfWeek, '요일')
    if (dayValidationError) errors.push(dayValidationError)
  }

  if (data.startTime) {
    const startTimeFormatError = validators.timeFormat(data.startTime, '시작시간')
    if (startTimeFormatError) errors.push(startTimeFormatError)
  }

  if (data.endTime) {
    const endTimeFormatError = validators.timeFormat(data.endTime, '종료시간')
    if (endTimeFormatError) errors.push(endTimeFormatError)
  }

  // 시간 논리 검증
  if (data.startTime && data.endTime) {
    const startTime = new Date(`1970-01-01T${data.startTime}:00`)
    const endTime = new Date(`1970-01-01T${data.endTime}:00`)
    
    if (endTime <= startTime) {
      errors.push({ 
        field: 'endTime', 
        message: '종료시간은 시작시간보다 늦어야 합니다.' 
      })
    }
  }

  // 최대 학생 수 검증
  if (data.maxStudents !== undefined && data.maxStudents !== null) {
    const maxStudentsError = validators.numberRange(data.maxStudents, '최대 학생수', 1, 200)
    if (maxStudentsError) errors.push(maxStudentsError)
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * 범용 유효성 검증 실행기
 * @param data 검증할 데이터
 * @param schema 검증 스키마 함수
 */
export function validateData(data: any, schema: (data: any) => ValidationResult): ValidationResult {
  try {
    return schema(data)
  } catch (error) {
    return {
      isValid: false,
      errors: [{ field: 'general', message: '데이터 검증 중 오류가 발생했습니다.' }]
    }
  }
} 