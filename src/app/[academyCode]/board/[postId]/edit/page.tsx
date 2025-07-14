'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface BoardPost {
  id: string
  title: string
  content: string
  author_nickname: string
  is_notice: boolean
}

export default function EditPostPage() {
  const params = useParams()
  const router = useRouter()
  const academyCode = params.academyCode as string
  const postId = params.postId as string
  
  const [post, setPost] = useState<BoardPost | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    password: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [academyName, setAcademyName] = useState('')

  useEffect(() => {
    fetchPost()
    fetchAcademyInfo()
  }, [postId, academyCode])

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

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/${academyCode}/board/posts/${postId}`)
      const data = await response.json()
      
      if (data.success) {
        const postData = data.data
        setPost(postData)
        setFormData({
          title: postData.title,
          content: postData.content,
          password: ''
        })
      } else {
        setError(data.message || '게시글을 불러오는데 실패했습니다')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
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
      
      const response = await fetch(`/api/${academyCode}/board/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          password: formData.password
        })
      })

      const data = await response.json()
      
      if (data.success) {
        router.push(`/${academyCode}/board/${postId}`)
      } else {
        setError(data.message || '게시글 수정에 실패했습니다')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">게시글을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error && !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href={`/${academyCode}/board`}
            className="text-blue-600 hover:text-blue-800"
          >
            게시판으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <h1 className="text-lg font-bold text-gray-900">
              게시글 수정
            </h1>
            <div className="flex items-center space-x-3">
              <Link 
                href={`/${academyCode}/board/${postId}`}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                취소
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto bg-white">
        {error && (
          <div className="px-4 py-3 bg-red-50 border-b border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4">
          {/* 작성자 정보 */}
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              작성자: <span className="font-medium">{post?.author_nickname}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              작성자만 수정할 수 있습니다
            </p>
          </div>

          {/* 비밀번호 */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="게시글 작성 시 설정한 비밀번호"
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
              required
            />
          </div>

          {/* 제목 */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="제목을 입력하세요"
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
              required
            />
          </div>

          {/* 내용 */}
          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="내용을 입력하세요"
              rows={12}
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
              required
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
            <Link
              href={`/${academyCode}/board/${postId}`}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded text-sm"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
            >
              {submitting ? '수정 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}