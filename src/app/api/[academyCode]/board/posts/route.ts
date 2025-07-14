import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// Types
interface CreatePostRequest {
  title: string
  content: string
  authorNickname?: string
  password: string
  isNotice?: boolean
  adminPassword?: string
}

interface UpdatePostRequest {
  title?: string
  content?: string
  password: string
  isNotice?: boolean
  adminPassword?: string
}

interface BoardPost {
  id: string
  academy_code: string
  title: string
  content: string
  author_nickname: string
  is_notice: boolean
  view_count: number
  created_at: string
  updated_at: string
}

// GET - Get all posts for an academy
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ academyCode: string }> }
) {
  try {
    const { academyCode } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit


    // Verify academy exists
    const { data: academy, error: academyError } = await supabase
      .from('academies')
      .select('code')
      .eq('code', academyCode)
      .single()

    if (academyError || !academy) {
      return NextResponse.json({ success: false, message: '존재하지 않는 학원입니다' }, { status: 404 })
    }

    // Get posts with pagination, notices first
    const { data: posts, error } = await supabase
      .from('board_posts')
      .select('id, title, author_nickname, is_notice, view_count, like_count, created_at')
      .eq('academy_code', academyCode)
      .order('is_notice', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Posts fetch error:', error)
      return NextResponse.json({ 
        success: false, 
        message: '게시글을 불러오는데 실패했습니다',
        error: error.message 
      }, { status: 500 })
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('board_posts')
      .select('*', { count: 'exact', head: true })
      .eq('academy_code', academyCode)

    if (countError) {
      console.error('Count error:', countError)
    }

    return NextResponse.json({
      success: true,
      data: {
        posts: posts || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    })

  } catch (error) {
    console.error('GET posts error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// POST - Create new post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ academyCode: string }> }
) {
  try {
    const { academyCode } = await params
    const body: CreatePostRequest = await request.json()
    
    const { title, content, authorNickname = '익명', password, isNotice = false, adminPassword } = body

    if (!title || !content || !password) {
      return NextResponse.json({ success: false, message: '제목, 내용, 비밀번호는 필수입니다' }, { status: 400 })
    }

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwarded?.split(',')[0] || realIp || request.ip || '127.0.0.1'


    // Verify academy exists
    const { data: academy, error: academyError } = await supabase
      .from('academies')
      .select('code')
      .eq('code', academyCode)
      .single()

    if (academyError || !academy) {
      return NextResponse.json({ success: false, message: '존재하지 않는 학원입니다' }, { status: 404 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create post
    const { data: newPost, error } = await supabase
      .from('board_posts')
      .insert({
        academy_code: academyCode,
        title,
        content,
        author_nickname: authorNickname,
        password_hash: passwordHash,
        is_notice: false,
        author_ip: clientIp
      })
      .select()
      .single()

    if (error) {
      console.error('Post creation error:', error)
      return NextResponse.json({ 
        success: false, 
        message: '게시글 작성에 실패했습니다',
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '게시글이 작성되었습니다',
      data: newPost
    })

  } catch (error) {
    console.error('POST posts error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}