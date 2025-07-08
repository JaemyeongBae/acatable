// 수업 종류 관리 컴포넌트
// 목적: 학원별 수업 종류 프리셋 추가, 수정, 삭제 기능

'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'

interface ClassType {
  id: string
  name: string
  color?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ClassTypeManagerProps {
  academyId: string
  onDataChange: () => void
}

export default function ClassTypeManager({ academyId, onDataChange }: ClassTypeManagerProps) {
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingClassType, setEditingClassType] = useState<ClassType | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    color: '#8B5CF6',
    description: ''
  })

  // 수업 종류 목록 로드
  const loadClassTypes = async () => {
    try {
      const response = await fetch(`/api/class-types?academyId=${academyId}`)
      const data = await response.json()
      
      if (data.success) {
        setClassTypes(data.data)
      } else {
        setError(data.message || '수업 종류 목록을 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClassTypes()
  }, [academyId])

  // 새 수업 종류 추가
  const handleAddClassType = async () => {
    if (!formData.name.trim()) {
      alert('수업 종류명을 입력해주세요.')
      return
    }

    try {
      const response = await fetch('/api/class-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academyId,
          name: formData.name.trim(),
          color: formData.color,
          description: formData.description.trim() || undefined
        }),
      })

      const data = await response.json()

      if (data.success) {
        await loadClassTypes()
        setIsAddingNew(false)
        setFormData({ name: '', color: '#8B5CF6', description: '' })
        onDataChange()
      } else {
        alert(data.message || '수업 종류 추가에 실패했습니다.')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.')
    }
  }

  // 수업 종류 수정
  const handleUpdateClassType = async () => {
    if (!editingClassType || !formData.name.trim()) {
      alert('수업 종류명을 입력해주세요.')
      return
    }

    try {
      const response = await fetch(`/api/class-types/${editingClassType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academyId,
          name: formData.name.trim(),
          color: formData.color,
          description: formData.description.trim() || undefined
        }),
      })

      const data = await response.json()

      if (data.success) {
        await loadClassTypes()
        setEditingClassType(null)
        setFormData({ name: '', color: '#8B5CF6', description: '' })
        onDataChange()
      } else {
        alert(data.message || '수업 종류 수정에 실패했습니다.')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.')
    }
  }

  // 수업 종류 삭제
  const handleDeleteClassType = async (id: string) => {
    if (!confirm('정말로 이 수업 종류를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/class-types/${id}?academyId=${academyId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await loadClassTypes()
        onDataChange()
      } else {
        alert(data.message || '수업 종류 삭제에 실패했습니다.')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.')
    }
  }

  // 편집 시작
  const startEditing = (classType: ClassType) => {
    setEditingClassType(classType)
    setFormData({
      name: classType.name,
      color: classType.color || '#8B5CF6',
      description: classType.description || ''
    })
    setIsAddingNew(false)
  }

  // 편집 취소
  const cancelEditing = () => {
    setEditingClassType(null)
    setIsAddingNew(false)
    setFormData({ name: '', color: '#8B5CF6', description: '' })
  }

  // 새 수업 종류 추가 시작
  const startAddingNew = () => {
    setIsAddingNew(true)
    setEditingClassType(null)
    setFormData({ name: '', color: '#8B5CF6', description: '' })
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
          onClick={loadClassTypes}
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
          <h3 className="text-lg font-semibold text-gray-900">수업 종류 관리</h3>
          <p className="text-sm text-gray-600">시간표에 사용할 수업 종류를 추가하고 관리하세요.</p>
        </div>
        <Button
          onClick={startAddingNew}
          disabled={isAddingNew || editingClassType !== null}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          + 수업 종류 추가
        </Button>
      </div>

      {/* 새 수업 종류 추가 폼 */}
      {isAddingNew && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">새 수업 종류 추가</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                수업 종류명 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 정규반, 특강, 개별지도"
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="수업에 대한 설명을 입력하세요"
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
              onClick={handleAddClassType}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              추가
            </Button>
          </div>
        </div>
      )}

      {/* 수업 종류 목록 */}
      <div className="space-y-3">
        {classTypes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>등록된 수업 종류가 없습니다.</p>
            <p className="text-sm mt-1">새 수업 종류를 추가해보세요.</p>
          </div>
        ) : (
          classTypes.map((classType) => (
            <div
              key={classType.id}
              className={`bg-white border rounded-lg p-4 ${
                editingClassType?.id === classType.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {editingClassType?.id === classType.id ? (
                // 편집 모드
                <div>
                  <h4 className="font-medium text-blue-900 mb-3">수업 종류 수정</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        수업 종류명 *
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
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        설명
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
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
                      onClick={handleUpdateClassType}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
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
                      style={{ backgroundColor: classType.color || '#8B5CF6' }}
                    ></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{classType.name}</h4>
                      <div className="text-sm text-gray-500">
                        {classType.description && <p>설명: {classType.description}</p>}
                        <p>생성일: {new Date(classType.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEditing(classType)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteClassType(classType.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
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