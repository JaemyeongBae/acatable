import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

interface CreateCommentRequest {
  content: string
  authorNickname?: string
  password: string
  parentId?: string | null
}

// GET - Get all comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ academyCode: string; postId: string }> }
) {
  try {
    const { academyCode, postId } = await params

    // Verify post exists and belongs to academy
    const { data: post, error: postError } = await supabase
      .from('board_posts')
      .select('id')
      .eq('id', postId)
      .eq('academy_code', academyCode)
      .single()

    if (postError || !post) {
      return NextResponse.json({ success: false, message: '게시글을 찾을 수 없습니다' }, { status: 404 })
    }

    // Get comments with parent_id for reply support
    const { data: comments, error } = await supabase
      .from('board_comments')
      .select('id, content, author_nickname, like_count, created_at, updated_at, parent_id, author_ip')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Comments fetch error:', error)
      return NextResponse.json({ success: false, message: '댓글을 불러오는데 실패했습니다' }, { status: 500 })
    }

    // Get post author's IP to identify them as "글쓴이"
    const { data: postData } = await supabase
      .from('board_posts')
      .select('author_ip')
      .eq('id', postId)
      .single()

    return NextResponse.json({
      success: true,
      data: comments || [],
      postAuthorIp: postData?.author_ip || null
    })

  } catch (error) {
    console.error('GET comments error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// POST - Create new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ academyCode: string; postId: string }> }
) {
  try {
    const { academyCode, postId } = await params
    const body: CreateCommentRequest = await request.json()
    
    const { content, authorNickname = '익명', password, parentId } = body

    if (!content || !password) {
      return NextResponse.json({ success: false, message: '내용과 비밀번호는 필수입니다' }, { status: 400 })
    }

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwarded?.split(',')[0] || realIp || request.ip || '127.0.0.1'

    // Verify post exists and belongs to academy
    const { data: post, error: postError } = await supabase
      .from('board_posts')
      .select('id')
      .eq('id', postId)
      .eq('academy_code', academyCode)
      .single()

    if (postError || !post) {
      return NextResponse.json({ success: false, message: '게시글을 찾을 수 없습니다' }, { status: 404 })
    }

    // Validate parent comment if parentId is provided
    if (parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('board_comments')
        .select('id, parent_id')
        .eq('id', parentId)
        .eq('post_id', postId)
        .single()
      
      if (parentError || !parentComment) {
        return NextResponse.json({ success: false, message: '부모 댓글을 찾을 수 없습니다' }, { status: 404 })
      }
      
      // 대댓글의 대댓글은 허용하지 않음
      if (parentComment.parent_id) {
        return NextResponse.json({ success: false, message: '대댓글의 대댓글은 작성할 수 없습니다' }, { status: 400 })
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create comment
    const { data: newComment, error } = await supabase
      .from('board_comments')
      .insert({
        post_id: postId,
        content,
        author_nickname: authorNickname,
        password_hash: passwordHash,
        author_ip: clientIp,
        parent_id: parentId || null
      })
      .select('id, content, author_nickname, like_count, created_at, updated_at, parent_id')
      .single()

    if (error) {
      console.error('Comment creation error:', error)
      return NextResponse.json({ success: false, message: '댓글 작성에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '댓글이 작성되었습니다',
      data: newComment
    })

  } catch (error) {
    console.error('POST comment error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}