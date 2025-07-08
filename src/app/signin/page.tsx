// 회원가입 페이지
// 목적: 새로운 학원 계정 생성

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// 회원가입 폼 데이터 타입
interface SignupFormData {
  academyName: string
  academyCode: string
  password: string
  confirmPassword: string
  adminEmail: string
  adminPhone: string
  address: string
}

export default function SigninPage() {
  const router = useRouter()
  
  // 폼 데이터 상태
  const [formData, setFormData] = useState<SignupFormData>({
    academyName: '',
    academyCode: '',
    password: '',
    confirmPassword: '',
    adminEmail: '',
    adminPhone: '',
    address: ''
  })
  
  // UI 상태
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<SignupFormData>>({})

  // 폼 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // 해당 필드 오류 제거
    if (fieldErrors[name as keyof SignupFormData]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // 학원 코드 실시간 검증
  const handleAcademyCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    // 영문 소문자와 숫자만 허용
    const cleanValue = value.replace(/[^a-z0-9]/g, '')
    setFormData(prev => ({ ...prev, academyCode: cleanValue }))
    
    if (fieldErrors.academyCode) {
      setFieldErrors(prev => ({ ...prev, academyCode: '' }))
    }
  }

  // 폼 검증
  const validateForm = (): boolean => {
    const errors: Partial<SignupFormData> = {}
    
    // 필수 필드 검증
    if (!formData.academyName.trim()) {
      errors.academyName = '학원명을 입력해주세요.'
    }
    
    if (!formData.academyCode.trim()) {
      errors.academyCode = '학원 ID를 입력해주세요.'
    } else if (formData.academyCode.length < 3) {
      errors.academyCode = '학원 ID는 3자 이상이어야 합니다.'
    } else if (!/^[a-z0-9]+$/.test(formData.academyCode)) {
      errors.academyCode = '학원 ID는 영문 소문자와 숫자만 사용할 수 있습니다.'
    }
    
    if (!formData.password) {
      errors.password = '비밀번호를 입력해주세요.'
    } else if (formData.password.length < 6) {
      errors.password = '비밀번호는 6자 이상이어야 합니다.'
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = '비밀번호 확인을 입력해주세요.'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    }
    
    if (!formData.adminEmail.trim()) {
      errors.adminEmail = '관리자 이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      errors.adminEmail = '올바른 이메일 형식을 입력해주세요.'
    }
    
    if (!formData.adminPhone.trim()) {
      errors.adminPhone = '관리자 전화번호를 입력해주세요.'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 회원가입 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academyName: formData.academyName.trim(),
          academyCode: formData.academyCode.trim(),
          password: formData.password,
          adminEmail: formData.adminEmail.trim(),
          adminPhone: formData.adminPhone.trim(),
          ...(formData.address.trim() && { address: formData.address.trim() })
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess(true)
        // 3초 후 메인 페이지로 이동
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } else {
        setError(data.message || '회원가입에 실패했습니다.')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 성공 화면
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">회원가입 완료!</h2>
            <p className="text-gray-600 mb-6">
              {formData.academyName}의 계정이 성공적으로 생성되었습니다.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              학원 페이지: table.acatools.co.kr/{formData.academyCode}
            </p>
            <p className="text-sm text-gray-400">
              3초 후 메인 페이지로 이동합니다...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
              우리학원시간표
            </Link>
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              돌아가기
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">학원 회원가입</h1>
          <p className="text-lg text-gray-600">
            학원 정보를 입력하여 시간표 관리를 시작하세요
          </p>
        </div>

        {/* 회원가입 폼 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 전체 오류 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* 학원명 */}
            <div>
              <label htmlFor="academyName" className="block text-sm font-medium text-gray-700 mb-2">
                학원명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="academyName"
                name="academyName"
                value={formData.academyName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  fieldErrors.academyName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="학원명을 입력하세요!"
              />
              {fieldErrors.academyName && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.academyName}</p>
              )}
            </div>

            {/* 학원 ID */}
            <div>
              <label htmlFor="academyCode" className="block text-sm font-medium text-gray-700 mb-2">
                학원 ID (URL 주소) <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  table.acatools.co.kr/
                </span>
                <input
                  type="text"
                  id="academyCode"
                  name="academyCode"
                  value={formData.academyCode}
                  onChange={handleAcademyCodeChange}
                  className={`flex-1 px-4 py-3 border rounded-r-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                    fieldErrors.academyCode ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="학원 ID를 영문 소문자로 입력하세요!"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                영문 소문자와 숫자만 사용 가능 (3자 이상)
              </p>
              {fieldErrors.academyCode && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.academyCode}</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                    fieldErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="6자 이상"
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                    fieldErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="비밀번호 재입력"
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* 관리자 이메일 */}
            <div>
              <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-2">
                관리자 이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="adminEmail"
                name="adminEmail"
                value={formData.adminEmail}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  fieldErrors.adminEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="mail@example.com"
              />
              {fieldErrors.adminEmail && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.adminEmail}</p>
              )}
            </div>

            {/* 관리자 전화번호 */}
            <div>
              <label htmlFor="adminPhone" className="block text-sm font-medium text-gray-700 mb-2">
                관리자 전화번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="adminPhone"
                name="adminPhone"
                value={formData.adminPhone}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  fieldErrors.adminPhone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="010-0000-0000"
              />
              {fieldErrors.adminPhone && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.adminPhone}</p>
              )}
            </div>

            {/* 주소 (선택사항) */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                학원 주소 (선택사항)
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="서울특별시 강남구 테스트로 123"
              />
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-blue-600 text-white font-semibold text-lg rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '처리 중...' : '학원 등록하기'}
            </button>
          </form>
        </div>

        {/* 추가 안내 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              학원 검색하기
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}