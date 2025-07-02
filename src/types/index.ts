// 학원 시간표 관리 시스템 타입 정의
// 목적: 타입 안전성 보장 및 개발 생산성 향상

// ==========================================
// 기본 엔티티 타입
// ==========================================

export type UserRole = 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'

export type DayOfWeek = 
  | 'MONDAY' 
  | 'TUESDAY' 
  | 'WEDNESDAY' 
  | 'THURSDAY' 
  | 'FRIDAY' 
  | 'SATURDAY' 
  | 'SUNDAY'

// 한국어 요일 매핑
export const DayOfWeekKorean: Record<DayOfWeek, string> = {
  MONDAY: '월요일',
  TUESDAY: '화요일', 
  WEDNESDAY: '수요일',
  THURSDAY: '목요일',
  FRIDAY: '금요일',
  SATURDAY: '토요일',
  SUNDAY: '일요일'
}

// ==========================================
// 데이터베이스 엔티티 타입
// ==========================================

export interface Academy {
  id: string
  name: string
  code: string
  address: string | null
  phone: string | null
  email: string | null
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  name: string
  phone: string | null
  role: UserRole
  academyId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Subject {
  id: string
  name: string
  color: string | null
  academyId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Instructor {
  id: string
  userId: string
  academyId: string
  specialties: string[]
  bio: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Classroom {
  id: string
  name: string
  capacity: number | null
  equipment: string[]
  floor: number | null
  academyId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ClassType {
  id: string
  name: string
  color: string | null
  academyId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Schedule {
  id: string
  title: string
  description: string | null
  dayOfWeek: DayOfWeek
  startTime: Date
  endTime: Date
  academyId: string
  subjectId: string
  instructorId: string
  classroomId: string
  classTypeId: string
  isActive: boolean
  maxStudents: number | null
  currentStudents: number
  createdAt: Date
  updatedAt: Date
}

// ==========================================
// 관계를 포함한 확장 타입
// ==========================================

export interface ScheduleWithRelations extends Schedule {
  academy: Academy
  subject: Subject
  instructor: Instructor & {
    user: User
  }
  classroom: Classroom
  classType: ClassType
  studentSchedules: StudentSchedule[]
}

export interface StudentSchedule {
  id: string
  userId: string
  scheduleId: string
  enrolledAt: Date
  isActive: boolean
}

export interface InstructorWithUser extends Instructor {
  user: User
}

// ==========================================
// 폼 및 API 요청 타입
// ==========================================

export interface CreateScheduleRequest {
  title: string
  description?: string
  dayOfWeek: DayOfWeek
  startTime: string // HH:MM 형식
  endTime: string   // HH:MM 형식
  subjectId: string
  instructorId: string
  classroomId: string
  classTypeId: string
  maxStudents?: number
}

export interface UpdateScheduleRequest extends Partial<CreateScheduleRequest> {
  id: string
}

export interface ScheduleFilter {
  dayOfWeek?: DayOfWeek[]
  subjectIds?: string[]
  instructorIds?: string[]
  classroomIds?: string[]
  classTypeIds?: string[]
  startDate?: Date
  endDate?: Date
}

// ==========================================
// UI 상태 관리 타입
// ==========================================

export interface ScheduleViewMode {
  type: 'week' | 'day' | 'instructor' | 'classroom' | 'subject'
  filters: ScheduleFilter
}

export interface TimeSlot {
  hour: number
  minute: number
  display: string // "09:00" 형식
}

// 시간표 그리드용 데이터 구조
export interface ScheduleGridData {
  [key: string]: { // dayOfWeek
    [key: string]: ScheduleWithRelations[] // timeSlot
  }
}

// ==========================================
// 에러 및 응답 타입
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ValidationError {
  field: string
  message: string
}

export interface ScheduleConflict {
  type: 'instructor' | 'classroom'
  conflictingSchedule: ScheduleWithRelations
  message: string
}

// ==========================================
// 유틸리티 타입
// ==========================================

export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateInput<T> = Partial<CreateInput<T>> & { id: string } 