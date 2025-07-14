'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface BoardPost {
  id: string
  academy_code: string
  title: string
  content: string
  author_nickname: string
  is_notice: boolean
  view_count: number
  like_count: number
  created_at: string
  updated_at: string
  comments_count: number
}

interface BoardData {
  posts: BoardPost[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export default function BoardPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const academyCode = params.academyCode as string
  const currentPage = parseInt(searchParams.get('page') || '1')
  
  const [boardData, setBoardData] = useState<BoardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [academyName, setAcademyName] = useState('')
  const [anonymousMap, setAnonymousMap] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    fetchBoardData()
    fetchAcademyInfo()
  }, [academyCode, currentPage])

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

  const fetchBoardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/${academyCode}/board/posts?page=${currentPage}&limit=20`)
      const data = await response.json()
      
      if (data.success) {
        setBoardData(data.data)
        
        // 익명 사용자 번호 매핑 생성
        const newAnonymousMap = new Map<string, string>()
        let anonymousCounter = 1
        
        data.data.posts.forEach((post: BoardPost) => {
          if (post.author_nickname === '익명') {
            const key = post.author_nickname + '_' + post.id
            if (!newAnonymousMap.has(key)) {
              newAnonymousMap.set(key, `익명${anonymousCounter}`)
              anonymousCounter++
            }
          }
        })
        
        setAnonymousMap(newAnonymousMap)
      } else {
        setError(data.message || '게시글을 불러오는데 실패했습니다')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || !boardData || page > boardData.pagination.totalPages) return
    window.location.href = `/${academyCode}/board?page=${page}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (diffDays < 7) {
      return `${diffDays}일 전`
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: '2-digit',
        day: '2-digit'
      })
    }
  }

  const getDisplayName = (nickname: string, postId: string) => {
    if (nickname !== '익명') return nickname
    return anonymousMap.get(nickname + '_' + postId) || '익명'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">게시글을 불러오는 중...</p>
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
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {academyName} 게시판
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link 
                href={`/${academyCode}`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>시간표로 돌아가기</span>
              </Link>
              <Link
                href={`/${academyCode}/board/write`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>글쓰기</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto bg-white border-x border-gray-200">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* 탭 메뉴 */}
        <div className="flex border-b border-gray-200">
          <button className="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
            전체글
          </button>
        </div>

        {/* 게시글 목록 */}
        <div className="bg-white">
          <div className="divide-y divide-gray-100">
            {boardData?.posts.map((post, index) => {
              const postNumber = boardData.pagination.total - ((currentPage - 1) * 20) - index
              
              return (
                <Link
                  key={post.id}
                  href={`/${academyCode}/board/${post.id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="px-4 py-3">
                    <div className="flex items-center">
                      {/* 카테고리/번호 열 */}
                      <div className="w-16 flex-shrink-0 text-left">
                        {post.is_notice ? (
                          <span className="inline-flex items-center justify-center w-10 h-5 bg-red-500 text-white text-xs rounded">
                            공지
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">{postNumber}</span>
                        )}
                      </div>
                      
                      {/* 제목 열 */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center">
                          {post.is_notice && (
                            <span className="inline-block w-1 h-1 bg-red-500 rounded-full mr-2 flex-shrink-0"></span>
                          )}
                          <h3 className="text-sm text-gray-900 truncate">
                            {post.title}
                          </h3>
                          {post.comments_count > 0 && (
                            <span className="text-blue-500 text-xs ml-1">
                              [{post.comments_count}]
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* 작성자 열 */}
                      <div className="w-20 flex-shrink-0 text-center">
                        <span className="text-xs text-gray-600">
                          {getDisplayName(post.author_nickname, post.id)}
                        </span>
                      </div>
                      
                      {/* 작성일 열 */}
                      <div className="w-16 flex-shrink-0 text-center">
                        <span className="text-xs text-gray-400">
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                      
                      {/* 조회 열 */}
                      <div className="w-12 flex-shrink-0 text-center">
                        <span className="text-xs text-gray-400">
                          {post.view_count}
                        </span>
                      </div>
                      
                      {/* 추천 열 */}
                      <div className="w-12 flex-shrink-0 text-center">
                        <span className="text-xs text-red-500">
                          {post.like_count > 0 ? post.like_count : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {boardData?.posts.length === 0 && !loading && (
            <div className="px-4 py-12 text-center text-gray-500">
              <div className="text-gray-400 mb-2 text-2xl">📝</div>
              <p className="text-sm">첫 번째 글을 작성해보세요!</p>
            </div>
          )}

          {/* 페이지네이션 */}
          {boardData && boardData.pagination.totalPages > 1 && (
            <div className="flex justify-center py-4 border-t border-gray-100">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {Array.from({ length: boardData.pagination.totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === boardData.pagination.totalPages || 
                    Math.abs(page - currentPage) <= 2
                  )
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                          currentPage === page
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))
                }
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === boardData.pagination.totalPages}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}