// 강사 관리 컴포넌트
// 목적: 학원별 강사 프리셋 추가, 수정, 삭제 기능

'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'

// 로딩 스피너 컴포넌트
const LoadingSpinner = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'
  return (
    <div className={`${sizeClass} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`} />
  )
}

interface Instructor {
  id: string
  name: string
  email?: string
  phone?: string
  specialties?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface InstructorManagerProps {
  academyId: string
  onDataChange: () => void
}

export default function InstructorManager({ academyId, onDataChange }: InstructorManagerProps) {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: ''
  })
  // 개별 작업 로딩 상태
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 강사 목록 로드
  const loadInstructors = async () => {
    try {
      const response = await fetch(`/api/instructors?academyId=${academyId}`)
      const data = await response.json()
      
      if (data.success) {
        setInstructors(data.data)
      } else {
        setError(data.message || '강사 목록을 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInstructors()
  }, [academyId])

  // 새 강사 추가
  const handleAddInstructor = async () => {
    if (!formData.name.trim()) {
      alert('강사명을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/instructors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academyId,
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          specialties: formData.specialties.trim() || undefined
        }),
      })

      const data = await response.json()

      if (data.success) {
        await loadInstructors()
        setIsAddingNew(false)
        setFormData({ name: '', email: '', phone: '', specialties: '' })
        onDataChange()
      } else {
        alert(data.message || '강사 추가에 실패했습니다.')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 강사 수정
  const handleUpdateInstructor = async () => {
    if (!editingInstructor || !formData.name.trim()) {
      alert('강사명을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/instructors/${editingInstructor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academyId,
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          specialties: formData.specialties.trim() || undefined
        }),
      })

      const data = await response.json()

      if (data.success) {
        await loadInstructors()
        setEditingInstructor(null)
        setFormData({ name: '', email: '', phone: '', specialties: '' })
        onDataChange()
      } else {
        alert(data.message || '강사 수정에 실패했습니다.')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 강사 삭제
  const handleDeleteInstructor = async (id: string) => {
    if (!confirm('정말로 이 강사를 삭제하시겠습니까?')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/instructors/${id}?academyId=${academyId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await loadInstructors()
        onDataChange()
      } else {
        alert(data.message || '강사 삭제에 실패했습니다.')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  // 편집 시작
  const startEditing = (instructor: Instructor) => {
    setEditingInstructor(instructor)
    setFormData({
      name: instructor.name,
      email: instructor.email || '',
      phone: instructor.phone || '',
      specialties: instructor.specialties || ''
    })
    setIsAddingNew(false)
  }

  // 편집 취소
  const cancelEditing = () => {
    setEditingInstructor(null)
    setIsAddingNew(false)
    setFormData({ name: '', email: '', phone: '', specialties: '' })
  }

  // 새 강사 추가 시작
  const startAddingNew = () => {
    setIsAddingNew(true)
    setEditingInstructor(null)
    setFormData({ name: '', email: '', phone: '', specialties: '' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadInstructors}
          className="mt-2 text-sm text-red-500 hover:text-red-700"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">강사 관리</h3>
          <p className="text-sm text-gray-600">시간표에 사용할 강사를 추가하고 관리하세요.</p>
        </div>
        <Button
          onClick={startAddingNew}
          disabled={isAddingNew || editingInstructor !== null || isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          + 강사 추가
        </Button>
      </div>

      {/* 새 강사 추가 폼 */}
      {isAddingNew && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">새 강사 추가</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                강사명 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="선생님 성함을 입력하세요!"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: teacher@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                전화번호
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 010-0000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                전문 과목
              </label>
              <input
                type="text"
                value={formData.specialties}
                onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 수학, 물리, 화학"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              onClick={cancelEditing}
              variant="secondary"
            >
              취소
            </Button>
            <Button
              onClick={handleAddInstructor}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              {isSubmitting && <LoadingSpinner size="sm" />}
              추가
            </Button>
          </div>
        </div>
      )}

      {/* 강사 목록 */}
      <div className="space-y-3">
        {instructors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>등록된 강사가 없습니다.</p>
            <p className="text-sm mt-1">새 강사를 추가해보세요.</p>
          </div>
        ) : (
          instructors.map((instructor) => (
            <div
              key={instructor.id}
              className={`bg-white border rounded-lg p-4 ${
                editingInstructor?.id === instructor.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {editingInstructor?.id === instructor.id ? (
                // 편집 모드
                <div>
                  <h4 className="font-medium text-blue-900 mb-3">강사 수정</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        강사명 *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        이메일
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        전화번호
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        전문 과목
                      </label>
                      <input
                        type="text"
                        value={formData.specialties}
                        onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      onClick={cancelEditing}
                      variant="secondary"
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleUpdateInstructor}
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      {isSubmitting && <LoadingSpinner size="sm" />}
                      저장
                    </Button>
                  </div>
                </div>
              ) : (
                // 표시 모드
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{instructor.name}</h4>
                      <div className="text-sm text-gray-500">
                        {instructor.email && <p>이메일: {instructor.email}</p>}
                        {instructor.phone && <p>전화: {instructor.phone}</p>}
                        {instructor.specialties && <p>전문과목: {instructor.specialties}</p>}
                        <p>생성일: {new Date(instructor.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEditing(instructor)}
                      disabled={isSubmitting || deletingId === instructor.id}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteInstructor(instructor.id)}
                      disabled={isSubmitting || deletingId !== null}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {deletingId === instructor.id && <LoadingSpinner size="sm" />}
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}