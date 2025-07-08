// 과목 관리 컴포넌트
// 목적: 학원별 과목 프리셋 추가, 수정, 삭제 기능

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

interface Subject {
  id: string
  name: string
  color?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface SubjectManagerProps {
  academyId: string
  onDataChange: () => void
}

export default function SubjectManager({ academyId, onDataChange }: SubjectManagerProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6'
  })
  // 개별 작업 로딩 상태
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 과목 목록 로드
  const loadSubjects = async () => {
    try {
      const response = await fetch(`/api/subjects?academyId=${academyId}`)
      const data = await response.json()
      
      if (data.success) {
        setSubjects(data.data)
      } else {
        setError(data.message || '과목 목록을 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubjects()
  }, [academyId])

  // 새 과목 추가
  const handleAddSubject = async () => {
    if (!formData.name.trim()) {
      alert('과목명을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academyId,
          name: formData.name.trim(),
          color: formData.color
        }),
      })

      const data = await response.json()

      if (data.success) {
        await loadSubjects()
        setIsAddingNew(false)
        setFormData({ name: '', color: '#3B82F6' })
        onDataChange()
      } else {
        alert(data.message || '과목 추가에 실패했습니다.')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 과목 수정
  const handleUpdateSubject = async () => {
    if (!editingSubject || !formData.name.trim()) {
      alert('과목명을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/subjects/${editingSubject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academyId,
          name: formData.name.trim(),
          color: formData.color
        }),
      })

      const data = await response.json()

      if (data.success) {
        await loadSubjects()
        setEditingSubject(null)
        setFormData({ name: '', color: '#3B82F6' })
        onDataChange()
      } else {
        alert(data.message || '과목 수정에 실패했습니다.')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 과목 삭제
  const handleDeleteSubject = async (id: string) => {
    if (!confirm('정말로 이 과목을 삭제하시겠습니까?')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/subjects/${id}?academyId=${academyId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await loadSubjects()
        onDataChange()
      } else {
        alert(data.message || '과목 삭제에 실패했습니다.')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  // 편집 시작
  const startEditing = (subject: Subject) => {
    setEditingSubject(subject)
    setFormData({
      name: subject.name,
      color: subject.color || '#3B82F6'
    })
    setIsAddingNew(false)
  }

  // 편집 취소
  const cancelEditing = () => {
    setEditingSubject(null)
    setIsAddingNew(false)
    setFormData({ name: '', color: '#3B82F6' })
  }

  // 새 과목 추가 시작
  const startAddingNew = () => {
    setIsAddingNew(true)
    setEditingSubject(null)
    setFormData({ name: '', color: '#3B82F6' })
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
          onClick={loadSubjects}
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
          <h3 className="text-lg font-semibold text-gray-900">과목 관리</h3>
          <p className="text-sm text-gray-600">시간표에 사용할 과목을 추가하고 관리하세요.</p>
        </div>
        <Button
          onClick={startAddingNew}
          disabled={isAddingNew || editingSubject !== null || isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          + 과목 추가
        </Button>
      </div>

      {/* 새 과목 추가 폼 */}
      {isAddingNew && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">새 과목 추가</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                과목명 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 수학, 영어, 과학"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                색상
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
              onClick={handleAddSubject}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              {isSubmitting && <LoadingSpinner size="sm" />}
              추가
            </Button>
          </div>
        </div>
      )}

      {/* 과목 목록 */}
      <div className="space-y-3">
        {subjects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>등록된 과목이 없습니다.</p>
            <p className="text-sm mt-1">새 과목을 추가해보세요.</p>
          </div>
        ) : (
          subjects.map((subject) => (
            <div
              key={subject.id}
              className={`bg-white border rounded-lg p-4 ${
                editingSubject?.id === subject.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {editingSubject?.id === subject.id ? (
                // 편집 모드
                <div>
                  <h4 className="font-medium text-blue-900 mb-3">과목 수정</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        과목명 *
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
                        색상
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                          className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.color}
                          onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
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
                      onClick={handleUpdateSubject}
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
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: subject.color || '#3B82F6' }}
                    ></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{subject.name}</h4>
                      <p className="text-sm text-gray-500">
                        생성일: {new Date(subject.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEditing(subject)}
                      disabled={isSubmitting || deletingId === subject.id}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(subject.id)}
                      disabled={isSubmitting || deletingId !== null}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {deletingId === subject.id && <LoadingSpinner size="sm" />}
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