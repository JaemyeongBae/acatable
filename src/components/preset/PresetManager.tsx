// 프리셋 관리자 컴포넌트
// 목적: 학원별 과목, 강사, 강의실, 수업종류 프리셋 관리 기능

'use client'

import { useState, useEffect } from 'react'
import SubjectManager from './SubjectManager'
import InstructorManager from './InstructorManager'
import ClassroomManager from './ClassroomManager'
import ClassTypeManager from './ClassTypeManager'

interface PresetManagerProps {
  academyId: string
  onClose: () => void
}

type TabType = 'subjects' | 'instructors' | 'classrooms' | 'classTypes'

export default function PresetManager({ academyId, onClose }: PresetManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('subjects')
  const [hasChanges, setHasChanges] = useState(false)

  // 변경사항 감지
  const handleDataChange = () => {
    setHasChanges(true)
  }

  // 탭 목록 정의
  const tabs = [
    { id: 'subjects', label: '과목', icon: '📚' },
    { id: 'instructors', label: '강사', icon: '👨‍🏫' },
    { id: 'classrooms', label: '강의실', icon: '🏫' },
    { id: 'classTypes', label: '수업 종류', icon: '📝' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">시간표 프리셋 관리</h2>
            <p className="text-sm text-gray-600 mt-1">
              시간표 작성에 사용할 과목, 강사, 강의실, 수업 종류를 관리하세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b bg-gray-50">
          <nav className="flex space-x-8 px-6" aria-label="탭">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'subjects' && (
            <SubjectManager academyId={academyId} onDataChange={handleDataChange} />
          )}
          {activeTab === 'instructors' && (
            <InstructorManager academyId={academyId} onDataChange={handleDataChange} />
          )}
          {activeTab === 'classrooms' && (
            <ClassroomManager academyId={academyId} onDataChange={handleDataChange} />
          )}
          {activeTab === 'classTypes' && (
            <ClassTypeManager academyId={academyId} onDataChange={handleDataChange} />
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-600">
                설정된 프리셋은 시간표 작성 시 드롭다운에 자동으로 표시됩니다.
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              완료
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}