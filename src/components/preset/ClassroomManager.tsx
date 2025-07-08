// 강의실 관리 컴포넌트
// 목적: 학원별 강의실 프리셋 추가, 수정, 삭제 기능

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

interface Classroom {
  id: string
  name: string
  capacity?: number
  equipment?: string
  floor?: number
  location?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ClassroomManagerProps {
  academyId: string
  onDataChange: () => void
}

export default function ClassroomManager({ academyId, onDataChange }: ClassroomManagerProps) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    equipment: '',
    floor: '',
    location: ''
  })
  // 개별 작업 로딩 상태
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 강의실 목록 로드
  const loadClassrooms = async () => {
    try {
      const response = await fetch(`/api/classrooms?academyId=${academyId}`)
      const data = await response.json()
      
      if (data.success) {
        setClassrooms(data.data)
      } else {
        setError(data.message || '강의실 목록을 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClassrooms()
  }, [academyId])

  // 새 강의실 추가
  const handleAddClassroom = async () => {
    if (!formData.name.trim()) {
      alert('강의실명을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/classrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academyId,
          name: formData.name.trim(),
          capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
          equipment: formData.equipment.trim() || undefined,
          floor: formData.floor ? parseInt(formData.floor) : undefined,
          location: formData.location.trim() || undefined
        }),
      })

      const data = await response.json()

      if (data.success) {
        await loadClassrooms()
        setIsAddingNew(false)
        setFormData({ name: '', capacity: '', equipment: '', floor: '', location: '' })
        onDataChange()
      } else {
        alert(data.message || '강의실 추가에 실패했습니다.')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 강의실 수정
  const handleUpdateClassroom = async () => {
    if (!editingClassroom || !formData.name.trim()) {
      alert('강의실명을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/classrooms/${editingClassroom.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academyId,
          name: formData.name.trim(),
          capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
          equipment: formData.equipment.trim() || undefined,
          floor: formData.floor ? parseInt(formData.floor) : undefined,
          location: formData.location.trim() || undefined
        }),
      })

      const data = await response.json()

      if (data.success) {
        await loadClassrooms()
        setEditingClassroom(null)
        setFormData({ name: '', capacity: '', equipment: '', floor: '', location: '' })
        onDataChange()
      } else {
        alert(data.message || '강의실 수정에 실패했습니다.')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 강의실 삭제
  const handleDeleteClassroom = async (id: string) => {
    if (!confirm('정말로 이 강의실을 삭제하시겠습니까?')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/classrooms/${id}?academyId=${academyId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await loadClassrooms()
        onDataChange()
      } else {
        alert(data.message || '강의실 삭제에 실패했습니다.')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  // 편집 시작
  const startEditing = (classroom: Classroom) => {
    setEditingClassroom(classroom)
    setFormData({
      name: classroom.name,
      capacity: classroom.capacity ? classroom.capacity.toString() : '',
      equipment: classroom.equipment || '',
      floor: classroom.floor ? classroom.floor.toString() : '',
      location: classroom.location || ''
    })
    setIsAddingNew(false)
  }

  // 편집 취소
  const cancelEditing = () => {
    setEditingClassroom(null)
    setIsAddingNew(false)
    setFormData({ name: '', capacity: '', equipment: '', floor: '', location: '' })
  }

  // 새 강의실 추가 시작
  const startAddingNew = () => {
    setIsAddingNew(true)
    setEditingClassroom(null)
    setFormData({ name: '', capacity: '', equipment: '', floor: '', location: '' })
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
          onClick={loadClassrooms}
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
          <h3 className="text-lg font-semibold text-gray-900">강의실 관리</h3>
          <p className="text-sm text-gray-600">시간표에 사용할 강의실을 추가하고 관리하세요.</p>
        </div>
        <Button
          onClick={startAddingNew}
          disabled={isAddingNew || editingClassroom !== null || isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          + 강의실 추가
        </Button>
      </div>

      {/* 새 강의실 추가 폼 */}
      {isAddingNew && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">새 강의실 추가</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                강의실명 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 1강의실, 대강의실"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                수용인원
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 30"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                층수
              </label>
              <input
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 2"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                위치
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 본관 2층 왼쪽"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                보유 장비
              </label>
              <input
                type="text"
                value={formData.equipment}
                onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 프로젝터, 화이트보드, 컴퓨터"
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
              onClick={handleAddClassroom}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              {isSubmitting && <LoadingSpinner size="sm" />}
              추가
            </Button>
          </div>
        </div>
      )}

      {/* 강의실 목록 */}
      <div className="space-y-3">
        {classrooms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>등록된 강의실이 없습니다.</p>
            <p className="text-sm mt-1">새 강의실을 추가해보세요.</p>
          </div>
        ) : (
          classrooms.map((classroom) => (
            <div
              key={classroom.id}
              className={`bg-white border rounded-lg p-4 ${
                editingClassroom?.id === classroom.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {editingClassroom?.id === classroom.id ? (
                // 편집 모드
                <div>
                  <h4 className="font-medium text-blue-900 mb-3">강의실 수정</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        강의실명 *
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
                        수용인원
                      </label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        층수
                      </label>
                      <input
                        type="number"
                        value={formData.floor}
                        onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        위치
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        보유 장비
                      </label>
                      <input
                        type="text"
                        value={formData.equipment}
                        onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
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
                      onClick={handleUpdateClassroom}
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
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{classroom.name}</h4>
                      <div className="text-sm text-gray-500">
                        {classroom.capacity && <p>수용인원: {classroom.capacity}명</p>}
                        {classroom.floor && <p>층수: {classroom.floor}층</p>}
                        {classroom.location && <p>위치: {classroom.location}</p>}
                        {classroom.equipment && <p>장비: {classroom.equipment}</p>}
                        <p>생성일: {new Date(classroom.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEditing(classroom)}
                      disabled={isSubmitting || deletingId === classroom.id}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteClassroom(classroom.id)}
                      disabled={isSubmitting || deletingId !== null}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {deletingId === classroom.id && <LoadingSpinner size="sm" />}
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