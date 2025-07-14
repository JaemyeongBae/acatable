'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  author_ip?: string
}

interface Comment {
  id: string
  content: string
  author_nickname: string
  like_count: number
  created_at: string
  updated_at: string
  parent_id: string | null
  author_ip?: string
  replies?: Comment[]
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const academyCode = params.academyCode as string
  const postId = params.postId as string
  
  const [post, setPost] = useState<BoardPost | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [academyName, setAcademyName] = useState('')
  const [anonymousMap, setAnonymousMap] = useState<Map<string, string>>(new Map())
  
  // Comment form state
  const [commentForm, setCommentForm] = useState({
    content: '',
    authorNickname: '익명',
    password: '',
    parentId: null as string | null
  })
  const [commentLoading, setCommentLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  
  // Edit/Delete modals
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteAdminPassword, setDeleteAdminPassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Menu and notice modal
  const [showMenu, setShowMenu] = useState(false)
  const [showNoticeModal, setShowNoticeModal] = useState(false)
  const [noticeAdminPassword, setNoticeAdminPassword] = useState('')
  const [noticeLoading, setNoticeLoading] = useState(false)
  
  // Comment edit/delete
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')
  const [showCommentDeleteModal, setShowCommentDeleteModal] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [commentPassword, setCommentPassword] = useState('')
  const [commentAdminPassword, setCommentAdminPassword] = useState('')
  const [commentActionLoading, setCommentActionLoading] = useState(false)

  useEffect(() => {
    fetchPost()
    fetchComments()
    fetchAcademyInfo()
  }, [postId, academyCode])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu) {
        setShowMenu(false)
      }
    }
    
    if (showMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMenu])

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
        setPost(data.data)
      } else {
        setError(data.message || '게시글을 불러오는데 실패했습니다')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다')
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/${academyCode}/board/posts/${postId}/comments`)
      const data = await response.json()
      
      if (data.success) {
        // 댓글을 계층 구조로 정리
        const commentsMap = new Map()
        const rootComments: Comment[] = []
        
        data.data.forEach((comment: Comment) => {
          comment.replies = []
          commentsMap.set(comment.id, comment)
          
          if (comment.parent_id) {
            const parent = commentsMap.get(comment.parent_id)
            if (parent) {
              parent.replies!.push(comment)
            }
          } else {
            rootComments.push(comment)
          }
        })
        
        setComments(rootComments)
        
        // 익명 사용자 번호 매핑 생성 (IP 기반)
        const newAnonymousMap = new Map<string, string>()
        const ipToNumberMap = new Map<string, number>()
        let anonymousCounter = 1
        const postAuthorIp = data.postAuthorIp
        
        // 모든 댓글의 익명 사용자들에게 IP 기반 번호 부여
        const processComments = (comments: Comment[]) => {
          comments.forEach(comment => {
            if (comment.author_nickname === '익명' && comment.author_ip) {
              // 글쓴이와 같은 IP인지 확인
              if (comment.author_ip === postAuthorIp && post?.author_nickname === '익명') {
                newAnonymousMap.set(comment.id, '익명(글쓴이)')
              } else {
                // IP별로 번호 부여
                if (!ipToNumberMap.has(comment.author_ip)) {
                  ipToNumberMap.set(comment.author_ip, anonymousCounter++)
                }
                const number = ipToNumberMap.get(comment.author_ip)!
                newAnonymousMap.set(comment.id, `익명${number}`)
              }
            }
            if (comment.replies) {
              processComments(comment.replies)
            }
          })
        }
        
        processComments(data.data)
        setAnonymousMap(newAnonymousMap)
      }
    } catch (err) {
      console.error('Comments fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!commentForm.content.trim() || !commentForm.password.trim()) {
      alert('내용과 비밀번호는 필수입니다')
      return
    }

    try {
      setCommentLoading(true)
      
      const response = await fetch(`/api/${academyCode}/board/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: commentForm.content.trim(),
          authorNickname: commentForm.authorNickname.trim() || '익명',
          password: commentForm.password,
          parentId: commentForm.parentId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setCommentForm({ content: '', authorNickname: '익명', password: '', parentId: null })
        setReplyingTo(null)
        fetchComments()
      } else {
        alert(data.message || '댓글 작성에 실패했습니다')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다')
    } finally {
      setCommentLoading(false)
    }
  }

  const handleDeletePost = async () => {
    if (!deletePassword.trim() && !deleteAdminPassword.trim()) {
      alert('비밀번호를 입력해주세요')
      return
    }

    try {
      setDeleteLoading(true)
      
      const response = await fetch(`/api/${academyCode}/board/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: deletePassword || undefined,
          adminPassword: deleteAdminPassword || undefined
        })
      })

      const data = await response.json()
      
      if (data.success) {
        router.push(`/${academyCode}/board`)
      } else {
        alert(data.message || '글 삭제에 실패했습니다')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다')
    } finally {
      setDeleteLoading(false)
      setShowDeleteModal(false)
    }
  }

  const handleToggleNotice = async () => {
    if (!noticeAdminPassword.trim()) {
      alert('관리자 비밀번호를 입력해주세요')
      return
    }

    try {
      setNoticeLoading(true)
      
      const response = await fetch(`/api/${academyCode}/board/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isNotice: !post?.is_notice,
          password: 'dummy',
          adminPassword: noticeAdminPassword
        })
      })

      const data = await response.json()
      
      if (data.success) {
        fetchPost()
        setShowNoticeModal(false)
        setNoticeAdminPassword('')
        setShowMenu(false)
      } else {
        alert(data.message || '공지사항 설정에 실패했습니다')
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다')
    } finally {
      setNoticeLoading(false)
    }
  }

  const handleVote = async (type: 'like', targetId: string, isComment: boolean = false) => {
    try {
      const endpoint = isComment 
        ? `/api/${academyCode}/board/comments/${targetId}/vote`
        : `/api/${academyCode}/board/posts/${targetId}/vote`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      })

      const data = await response.json()
      
      if (data.success) {
        if (isComment) {
          fetchComments()
        } else {
          fetchPost()
        }
      } else {
        alert(data.message)
      }
    } catch (err) {
      alert('투표 중 오류가 발생했습니다')
    }
  }

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditCommentContent(comment.content)
  }

  const handleSaveCommentEdit = async () => {
    if (!editCommentContent.trim() || !commentPassword.trim()) {
      alert('내용과 비밀번호를 입력해주세요')
      return
    }

    try {
      setCommentActionLoading(true)
      
      const response = await fetch(`/api/${academyCode}/board/comments/${editingCommentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: editCommentContent.trim(),
          password: commentPassword
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setEditingCommentId(null)
        setEditCommentContent('')
        setCommentPassword('')
        fetchComments()
      } else {
        alert(data.message)
      }
    } catch (err) {
      alert('댓글 수정 중 오류가 발생했습니다')
    } finally {
      setCommentActionLoading(false)
    }
  }

  const handleDeleteComment = async () => {
    if (!commentPassword.trim() && !commentAdminPassword.trim()) {
      alert('비밀번호를 입력해주세요')
      return
    }

    try {
      setCommentActionLoading(true)
      
      const response = await fetch(`/api/${academyCode}/board/comments/${deletingCommentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: commentPassword || undefined,
          adminPassword: commentAdminPassword || undefined
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setShowCommentDeleteModal(false)
        setDeletingCommentId(null)
        setCommentPassword('')
        setCommentAdminPassword('')
        fetchComments()
      } else {
        alert(data.message)
      }
    } catch (err) {
      alert('댓글 삭제 중 오류가 발생했습니다')
    } finally {
      setCommentActionLoading(false)
    }
  }

  const handleReply = (commentId: string, authorNickname: string) => {
    setReplyingTo(commentId)
    setCommentForm(prev => ({
      ...prev,
      parentId: commentId,
      content: ''
    }))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\./g, '/').replace(' ', ' ')
  }

  const getDisplayName = (nickname: string, commentId?: string, isPost: boolean = false, commentAuthorIp?: string) => {
    if (nickname !== '익명') return nickname
    
    if (isPost) {
      return '익명(글쓴이)'
    }
    
    if (commentId) {
      // 댓글 작성자가 글쓴이와 같은 IP인지 확인
      if (commentAuthorIp && commentAuthorIp === post?.author_ip && post?.author_nickname === '익명') {
        return '익명(글쓴이)'
      }
      return anonymousMap.get(commentId) || '익명'
    }
    
    return '익명'
  }

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isAuthor = comment.author_ip === post?.author_ip && post?.author_nickname === '익명' && comment.author_nickname === '익명'
    
    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 pl-4 bg-gray-50 border-l-4 border-blue-200' : 'bg-white'} ${isAuthor ? 'bg-blue-50' : ''} border-b border-gray-100`}>
        <div className="p-4">
        <div className="flex items-start space-x-3">
          {/* 프로필 아이콘 */}
          <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs text-gray-500">
              {getDisplayName(comment.author_nickname, comment.id, false, comment.author_ip).charAt(0)}
            </span>
          </div>
          
          <div className="flex-1">
            {/* 댓글 헤더 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {getDisplayName(comment.author_nickname, comment.id, false, comment.author_ip)}
                </span>
                {isAuthor && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    글쓴이
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {formatDate(comment.created_at)}
                </span>
                {comment.created_at !== comment.updated_at && (
                  <span className="text-xs text-gray-400">(수정됨)</span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <button
                  onClick={() => handleEditComment(comment)}
                  className="hover:text-gray-600"
                >
                  수정
                </button>
                <button
                  onClick={() => {
                    setDeletingCommentId(comment.id)
                    setShowCommentDeleteModal(true)
                  }}
                  className="hover:text-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
            
            {/* 댓글 내용 */}
            {editingCommentId === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editCommentContent}
                  onChange={(e) => setEditCommentContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                />
                <div className="flex space-x-2">
                  <input
                    type="password"
                    placeholder="비밀번호"
                    value={commentPassword}
                    onChange={(e) => setCommentPassword(e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-200 rounded text-xs"
                  />
                  <button
                    onClick={handleSaveCommentEdit}
                    disabled={commentActionLoading}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => {
                      setEditingCommentId(null)
                      setEditCommentContent('')
                      setCommentPassword('')
                    }}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-900 mb-2">
                  {comment.content}
                </p>
                
                {/* 댓글 액션 */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleVote('like', comment.id, true)}
                    className="flex items-center space-x-1 text-xs text-red-500 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                    <span>공감</span>
                    <span>{comment.like_count}</span>
                  </button>
                  
                  {!isReply && (
                    <button
                      onClick={() => handleReply(comment.id, getDisplayName(comment.author_nickname, comment.id, false, comment.author_ip))}
                      className="text-xs text-blue-500 hover:text-blue-600"
                    >
                      대댓글
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
        {/* 대댓글 렌더링 */}
        {comment.replies && comment.replies.map(reply => renderComment(reply, true))}
      </div>
    )
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

  if (error || !post) {
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
              {academyName ? `${academyName} 게시판` : '자유게시판'}
            </h1>
            <div className="flex items-center space-x-3">
              <Link 
                href={`/${academyCode}/board`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                글 목록
              </Link>
              <Link 
                href={`/${academyCode}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                시간표 보기
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto bg-white">
        {/* 게시글 */}
        <div className="border-b border-gray-200">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              {/* 프로필 아이콘 */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm text-gray-500">
                  {getDisplayName(post.author_nickname, undefined, true).charAt(0)}
                </span>
              </div>
              
              <div className="flex-1">
                {/* 게시글 헤더 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {getDisplayName(post.author_nickname, undefined, true)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(post.created_at)}
                    </span>
                    {post.created_at !== post.updated_at && (
                      <span className="text-xs text-gray-400">(수정됨)</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <button
                      onClick={() => router.push(`/${academyCode}/board/${postId}/edit`)}
                      className="hover:text-gray-600"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="hover:text-red-600"
                    >
                      삭제
                    </button>
                    <button
                      onClick={() => setShowNoticeModal(true)}
                      className="hover:text-gray-600"
                    >
                      {post.is_notice ? '공지해제' : '공지등록'}
                    </button>
                  </div>
                </div>
                
                {/* 게시글 제목 */}
                <h1 className="text-lg font-bold text-gray-900 mb-3">
                  {post.is_notice && (
                    <span className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded mr-2">
                      공지
                    </span>
                  )}
                  {post.title}
                  {post.comments_count > 0 && (
                    <span className="text-blue-500 text-sm ml-2">
                      [{post.comments_count}]
                    </span>
                  )}
                </h1>
                
                {/* 게시글 내용 */}
                <div className="text-sm text-gray-900 mb-4 leading-relaxed">
                  <pre className="whitespace-pre-wrap font-sans">
                    {post.content}
                  </pre>
                </div>
                
                {/* 게시글 액션 */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleVote('like', post.id)}
                      className="flex items-center space-x-1 text-red-500 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                      </svg>
                      <span>공감</span>
                      <span>{post.like_count}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-blue-500 hover:text-blue-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      <span>댓글</span>
                      <span>{post.comments_count}</span>
                    </button>
                  </div>
                  <span>조회 {post.view_count}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 댓글 목록 */}
        <div>
          {comments.map(comment => renderComment(comment))}
          
          {comments.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">첫 번째 댓글을 작성해보세요!</p>
            </div>
          )}
        </div>

        {/* 댓글 작성 폼 */}
        <div className={`bg-gray-50 border-t border-gray-200 p-4 ${replyingTo ? 'ml-8 border-l-4 border-blue-300' : ''}`}>
          {replyingTo && (
            <div className="mb-2 p-2 bg-blue-50 rounded text-xs text-blue-700 flex items-center justify-between">
              <span>댓글에 답글을 작성 중입니다.</span>
              <button
                onClick={() => {
                  setReplyingTo(null)
                  setCommentForm(prev => ({ ...prev, parentId: null, content: '' }))
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ✕ 취소
              </button>
            </div>
          )}
          
          <form onSubmit={handleCommentSubmit}>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                placeholder="닉네임 (기본: 익명)"
                value={commentForm.authorNickname}
                onChange={(e) => setCommentForm(prev => ({ ...prev, authorNickname: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded text-sm"
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={commentForm.password}
                onChange={(e) => setCommentForm(prev => ({ ...prev, password: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded text-sm"
                required
              />
            </div>
            <div className="flex space-x-2">
              <textarea
                placeholder={replyingTo ? "대댓글을 입력하세요" : "댓글을 입력하세요"}
                value={commentForm.content}
                onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm"
                required
              />
              <button
                type="submit"
                disabled={commentLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {commentLoading ? '작성 중...' : '댓글 작성'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 공지사항 등록/해제 모달 */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {post?.is_notice ? '공지사항 해제' : '공지사항 등록'}
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                관리자 비밀번호
              </label>
              <input
                type="password"
                value={noticeAdminPassword}
                onChange={(e) => setNoticeAdminPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowNoticeModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded"
              >
                취소
              </button>
              <button
                onClick={handleToggleNotice}
                disabled={noticeLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                {noticeLoading ? '처리 중...' : (post?.is_notice ? '해제' : '등록')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 댓글 삭제 모달 */}
      {showCommentDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">댓글 삭제</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  작성자 비밀번호
                </label>
                <input
                  type="password"
                  value={commentPassword}
                  onChange={(e) => setCommentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="text-center text-sm text-gray-500">또는</div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  관리자 비밀번호
                </label>
                <input
                  type="password"
                  value={commentAdminPassword}
                  onChange={(e) => setCommentAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowCommentDeleteModal(false)
                  setDeletingCommentId(null)
                  setCommentPassword('')
                  setCommentAdminPassword('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded"
              >
                취소
              </button>
              <button
                onClick={handleDeleteComment}
                disabled={commentActionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
              >
                {commentActionLoading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">게시글 삭제</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  작성자 비밀번호
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="text-center text-sm text-gray-500">또는</div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  관리자 비밀번호
                </label>
                <input
                  type="password"
                  value={deleteAdminPassword}
                  onChange={(e) => setDeleteAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded"
              >
                취소
              </button>
              <button
                onClick={handleDeletePost}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
              >
                {deleteLoading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}