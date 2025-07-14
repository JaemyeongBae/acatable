'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function WritePage() {
  const params = useParams()
  const router = useRouter()
  const academyCode = params.academyCode as string
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    authorNickname: '익명',
    password: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [academyName, setAcademyName] = useState('')

  useEffect(() => {
    fetchAcademyInfo()
  }, [academyCode])

  const fetchAcademyInfo = async () => {
    try {
      const response = await fetch(`/api/academies/${academyCode}`)
      const data = await response.json()
      if (data.success) {
        setAcademyName(data.data.academyName)
      }
    } catch (err) {
      console.error('Academy info fetch error:', err)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.password.trim()) {
      setError('제목, 내용, 비밀번호는 필수입니다')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      
      const response = await fetch(`/api/${academyCode}/board/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          authorNickname: formData.authorNickname.trim() || '익명',
          password: formData.password
        })
      })

      const data = await response.json()
      
      if (data.success) {
        router.push(`/${academyCode}/board`)
      } else {
        setError(data.message || '글 작성에 실패했습니다')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            <h1 className="text-lg font-bold text-gray-900">
              {academyName} - 글쓰기
            </h1>
            <Link 
              href={`/${academyCode}/board`}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              취소
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-md">
          <div className="px-4 py-4 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-900">새 글 작성</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4">
            {/* 작성자 정보 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label htmlFor="authorNickname" className="block text-xs font-medium text-gray-700 mb-1">
                  닉네임
                </label>
                <input
                  type="text"
                  id="authorNickname"
                  name="authorNickname"
                  value={formData.authorNickname}
                  onChange={handleInputChange}
                  placeholder="닉네임 (기본: 익명)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="수정/삭제용 비밀번호"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
            </div>

            {/* 제목 */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-xs font-medium text-gray-700 mb-1">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="제목을 입력하세요"
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
            </div>

            {/* 내용 */}
            <div className="mb-4">
              <label htmlFor="content" className="block text-xs font-medium text-gray-700 mb-1">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="내용을 입력하세요"
                rows={12}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
              <Link
                href={`/${academyCode}/board`}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {submitting ? '작성 중...' : '글 작성'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}