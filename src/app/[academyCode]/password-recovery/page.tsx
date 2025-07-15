'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PasswordRecoveryPage() {
  const params = useParams()
  const router = useRouter()
  const academyCode = params.academyCode as string
  
  const [step, setStep] = useState<'verify' | 'change'>('verify')
  const [verifyForm, setVerifyForm] = useState({
    email: '',
    phone: ''
  })
  const [changeForm, setChangeForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 이메일과 전화번호 확인
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!verifyForm.email || !verifyForm.phone) {
      setError('이메일과 전화번호를 모두 입력해주세요.')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // 임시로 이메일과 전화번호만 확인 (추후 인증번호 기능 추가 예정)
      const response = await fetch('/api/auth/verify-recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academyCode,
          email: verifyForm.email,
          phone: verifyForm.phone
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStep('change')
      } else {
        setError(data.message || '등록된 정보와 일치하지 않습니다.')
      }
    } catch (err) {
      setError('확인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 비밀번호 변경
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!changeForm.newPassword || !changeForm.confirmPassword) {
      setError('새 비밀번호를 모두 입력해주세요.')
      return
    }
    
    if (changeForm.newPassword !== changeForm.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    
    if (changeForm.newPassword.length < 6) {
      setError('새 비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      console.log('=== 비밀번호 변경 프로세스 시작 ===')
      console.log('1. 요청 데이터 준비:', { 
        academyCode, 
        type: 'recovery', 
        hasEmail: !!verifyForm.email, 
        hasPhone: !!verifyForm.phone,
        newPasswordLength: changeForm.newPassword.length
      })
      
      const requestBody = {
        academyCode,
        email: verifyForm.email,
        phone: verifyForm.phone,
        newPassword: changeForm.newPassword,
        type: 'recovery'
      }
      
      console.log('2. API 요청 전송 중...')
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      console.log('3. API 응답 수신:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      let data
      try {
        const responseText = await response.text()
        console.log('4. 응답 텍스트:', responseText)
        
        try {
          data = JSON.parse(responseText)
          console.log('5. 파싱된 응답 데이터:', data)
        } catch (parseError) {
          console.error('❌ JSON 파싱 오류:', parseError)
          console.error('❌ 원본 응답:', responseText)
          throw new Error(`서버 응답을 파싱할 수 없습니다. 응답: ${responseText}`)
        }
      } catch (textError) {
        console.error('❌ 응답 텍스트 읽기 오류:', textError)
        throw new Error('서버 응답을 읽을 수 없습니다')
      }
      
      if (data.success) {
        console.log('✅ 비밀번호 변경 성공!')
        
        // 비밀번호 변경 후 새 비밀번호로 테스트
        console.log('6. 새 비밀번호 테스트 시작...')
        
        try {
          const testResponse = await fetch('/api/debug/test-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              academyCode,
              testPassword: changeForm.newPassword
            }),
          })
          
          const testData = await testResponse.json()
          console.log('7. 새 비밀번호 테스트 결과:', testData)
          
          if (testData.success && testData.data.passwordMatch) {
            console.log('✅ 새 비밀번호 검증 성공!')
            alert('비밀번호가 성공적으로 변경되고 검증되었습니다! 로그인 페이지로 이동합니다.')
          } else {
            console.warn('⚠️ 새 비밀번호 검증 실패:', testData)
            alert('비밀번호는 변경되었지만 검증에 실패했습니다. 로그인 페이지로 이동합니다.')
          }
        } catch (testError) {
          console.error('❌ 비밀번호 테스트 오류:', testError)
          alert('비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다.')
        }
        
        console.log('8. 로그인 페이지로 이동')
        router.push(`/${academyCode}/mypage`)
        
      } else {
        console.error('❌ 비밀번호 변경 실패:', data.message)
        setError(data.message || '비밀번호 변경에 실패했습니다.')
      }
      
    } catch (err) {
      console.error('❌ 비밀번호 변경 중 예외 발생:', err)
      console.error('❌ 오류 스택:', err instanceof Error ? err.stack : String(err))
      
      if (err instanceof Error) {
        setError(`비밀번호 변경 중 오류가 발생했습니다: ${err.message}`)
      } else {
        setError('비밀번호 변경 중 알 수 없는 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
      console.log('=== 비밀번호 변경 프로세스 종료 ===')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* 헤더 */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">비밀번호 찾기</h1>
            <p className="text-gray-600">
              {step === 'verify' ? '등록된 정보를 입력해주세요' : '새 비밀번호를 설정해주세요'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {step === 'verify' 
                ? '※ 추후 이메일/SMS 인증 기능이 추가될 예정입니다' 
                : '비밀번호는 최소 6자 이상 입력해주세요'
              }
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {step === 'verify' ? (
            /* 정보 확인 단계 */
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  등록된 이메일 주소
                </label>
                <input
                  type="email"
                  id="email"
                  value={verifyForm.email}
                  onChange={(e) => setVerifyForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="example@email.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  등록된 전화번호
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={verifyForm.phone}
                  onChange={(e) => setVerifyForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="010-1234-5678"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {loading ? '확인 중...' : '정보 확인'}
              </button>
            </form>
          ) : (
            /* 비밀번호 변경 단계 */
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={changeForm.newPassword}
                  onChange={(e) => setChangeForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  minLength={6}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={changeForm.confirmPassword}
                  onChange={(e) => setChangeForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          )}

          {/* 돌아가기 링크 */}
          <div className="mt-6 text-center">
            <Link 
              href={`/${academyCode}/mypage`}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← 로그인 페이지로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}