'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Academy {
  id: string
  name: string
  code: string
  email?: string
  phone?: string
  created_at: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [academies, setAcademies] = useState<Academy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null)
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
    adminPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // 인증 확인
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_authenticated')
    if (!isAuthenticated) {
      router.push('/admin/login')
      return
    }

    // 학원 목록 로드
    fetchAcademies()
  }, [router])

  const fetchAcademies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/academies')
      const data = await response.json()
      
      if (data.success) {
        setAcademies(data.data || [])
      } else {
        setError(data.message || '학원 목록을 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated')
    router.push('/admin/login')
  }

  const handlePasswordChange = (academy: Academy) => {
    setSelectedAcademy(academy)
    setShowPasswordModal(true)
    setPasswordForm({
      newPassword: '',
      confirmPassword: '',
      adminPassword: ''
    })
    setPasswordError('')
  }

  const submitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { newPassword, confirmPassword, adminPassword } = passwordForm
    
    if (!newPassword || !confirmPassword || !adminPassword) {
      setPasswordError('모든 필드를 입력해주세요.')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    
    if (newPassword.length < 6) {
      setPasswordError('새 비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }
    
    setPasswordLoading(true)
    setPasswordError('')
    
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academyCode: selectedAcademy?.code,
          newPassword,
          adminPassword
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(data.message)
        setShowPasswordModal(false)
        setPasswordForm({
          newPassword: '',
          confirmPassword: '',
          adminPassword: ''
        })
      } else {
        setPasswordError(data.message || '비밀번호 변경에 실패했습니다.')
      }
    } catch (err) {
      setPasswordError('비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setPasswordLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin 대시보드
              </h1>
              <p className="text-gray-600 mt-1">
                전체 학원 관리 및 모니터링
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 px-3 py-1 rounded-full">
                <span className="text-red-800 text-sm font-medium">Admin 모드</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0a2 2 0 01-2 2H7a2 2 0 01-2-2m2-4h6m-6 4h6" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{academies.length}</p>
                <p className="text-gray-600 text-sm">등록된 학원</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">활성</p>
                <p className="text-gray-600 text-sm">시스템 상태</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">v1.5.3</p>
                <p className="text-gray-600 text-sm">현재 버전</p>
              </div>
            </div>
          </div>
        </div>

        {/* 학원 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">학원 목록</h2>
            <p className="text-sm text-gray-600 mt-1">
              모든 학원에 Admin 권한으로 접근할 수 있습니다
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    학원명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    학원 코드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    연락처
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {academies.map((academy) => (
                  <tr key={academy.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {academy.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {academy.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {academy.email && (
                          <div>{academy.email}</div>
                        )}
                        {academy.phone && (
                          <div className="text-gray-500">{academy.phone}</div>
                        )}
                        {!academy.email && !academy.phone && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(academy.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Link
                          href={`/${academy.code}`}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          target="_blank"
                        >
                          시간표 보기
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link
                          href={`/${academy.code}/mypage`}
                          className="text-green-600 hover:text-green-900 text-sm font-medium"
                          target="_blank"
                        >
                          마이페이지
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link
                          href={`/${academy.code}/edit`}
                          className="text-purple-600 hover:text-purple-900 text-sm font-medium"
                          target="_blank"
                        >
                          수정 페이지
                        </Link>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handlePasswordChange(academy)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          비밀번호 변경
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {academies.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0a2 2 0 01-2 2H7a2 2 0 01-2-2m2-4h6m-6 4h6" />
              </svg>
              <p className="text-lg font-medium text-gray-600 mb-2">등록된 학원이 없습니다</p>
              <p className="text-sm text-gray-500">새로운 학원이 등록되면 여기에 표시됩니다</p>
            </div>
          )}
        </div>
      </main>

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && selectedAcademy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              비밀번호 변경 - {selectedAcademy.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              학원 코드: <span className="font-mono font-medium">{selectedAcademy.code}</span>
            </p>
            
            <form onSubmit={submitPasswordChange} className="space-y-4">
              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{passwordError}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin 마스터 비밀번호
                </label>
                <input
                  type="password"
                  value={passwordForm.adminPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, adminPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  minLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">최소 6자 이상 입력해주세요</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setSelectedAcademy(null)
                    setPasswordForm({
                      newPassword: '',
                      confirmPassword: '',
                      adminPassword: ''
                    })
                    setPasswordError('')
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {passwordLoading ? '변경 중...' : '변경'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}