import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

interface UpdatePostRequest {
  title?: string
  content?: string
  password: string
  isNotice?: boolean
  adminPassword?: string
}

interface DeletePostRequest {
  password: string
  adminPassword?: string
}

// GET - Get single post with comments count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ academyCode: string; postId: string }> }
) {
  try {
    const { academyCode, postId } = await params


    // Get post
    const { data: post, error } = await supabase
      .from('board_posts')
      .select('*, author_ip')
      .eq('id', postId)
      .eq('academy_code', academyCode)
      .single()

    if (error || !post) {
      return NextResponse.json({ success: false, message: '게시글을 찾을 수 없습니다' }, { status: 404 })
    }

    // Increment view count
    await supabase
      .from('board_posts')
      .update({ view_count: post.view_count + 1 })
      .eq('id', postId)

    // Get comments count
    const { count: commentsCount } = await supabase
      .from('board_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        view_count: post.view_count + 1,
        comments_count: commentsCount || 0
      }
    })

  } catch (error) {
    console.error('GET post error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// PUT - Update post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ academyCode: string; postId: string }> }
) {
  try {
    const { academyCode, postId } = await params
    const body: UpdatePostRequest = await request.json()
    
    const { title, content, password, isNotice, adminPassword } = body

    if (!password) {
      return NextResponse.json({ success: false, message: '비밀번호가 필요합니다' }, { status: 400 })
    }


    // Get post
    const { data: post, error: postError } = await supabase
      .from('board_posts')
      .select('*')
      .eq('id', postId)
      .eq('academy_code', academyCode)
      .single()

    if (postError || !post) {
      return NextResponse.json({ success: false, message: '게시글을 찾을 수 없습니다' }, { status: 404 })
    }

    // Check password authentication
    const adminMasterPassword = process.env.ADMIN_MASTER_PASSWORD
    const isAdminMaster = adminMasterPassword && adminPassword === adminMasterPassword
    
    // Check academy admin password using the same function as login
    let isAcademyAdmin = false
    if (adminPassword) {
      const { data: authResult, error: authError } = await supabase.rpc('authenticate_academy', {
        p_academy_code: academyCode,
        p_password: adminPassword
      })
      
      if (!authError && authResult?.[0]?.success) {
        isAcademyAdmin = true
      }
    }
    
    const isAuthor = await bcrypt.compare(password, post.password_hash)

    if (!isAdminMaster && !isAcademyAdmin && !isAuthor) {
      return NextResponse.json({ success: false, message: '수정 권한이 없습니다' }, { status: 403 })
    }

    // If setting as notice, need admin permission
    if (isNotice && !isAdminMaster && !isAcademyAdmin) {
      return NextResponse.json({ success: false, message: '공지사항 설정 권한이 없습니다' }, { status: 403 })
    }

    // Update post
    const updateData: any = { updated_at: new Date().toISOString() }
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (isNotice !== undefined) updateData.is_notice = isNotice

    const { data: updatedPost, error: updateError } = await supabase
      .from('board_posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single()

    if (updateError) {
      console.error('Post update error:', updateError)
      return NextResponse.json({ success: false, message: '게시글 수정에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '게시글이 수정되었습니다',
      data: updatedPost
    })

  } catch (error) {
    console.error('PUT post error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// DELETE - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ academyCode: string; postId: string }> }
) {
  try {
    const { academyCode, postId } = await params
    const body: DeletePostRequest = await request.json()
    
    const { password, adminPassword } = body

    if (!password && !adminPassword) {
      return NextResponse.json({ success: false, message: '비밀번호가 필요합니다' }, { status: 400 })
    }


    // Get post
    const { data: post, error: postError } = await supabase
      .from('board_posts')
      .select('*')
      .eq('id', postId)
      .eq('academy_code', academyCode)
      .single()

    if (postError || !post) {
      return NextResponse.json({ success: false, message: '게시글을 찾을 수 없습니다' }, { status: 404 })
    }

    // Check password authentication
    const adminMasterPassword = process.env.ADMIN_MASTER_PASSWORD
    const isAdminMaster = adminMasterPassword && adminPassword === adminMasterPassword
    
    // Check academy admin password using the same function as login
    let isAcademyAdmin = false
    if (adminPassword) {
      const { data: authResult, error: authError } = await supabase.rpc('authenticate_academy', {
        p_academy_code: academyCode,
        p_password: adminPassword
      })
      
      if (!authError && authResult?.[0]?.success) {
        isAcademyAdmin = true
      }
    }
    
    const isAuthor = password && await bcrypt.compare(password, post.password_hash)

    if (!isAdminMaster && !isAcademyAdmin && !isAuthor) {
      return NextResponse.json({ success: false, message: '삭제 권한이 없습니다' }, { status: 403 })
    }

    // Delete post (comments will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('board_posts')
      .delete()
      .eq('id', postId)

    if (deleteError) {
      console.error('Post delete error:', deleteError)
      return NextResponse.json({ success: false, message: '게시글 삭제에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '게시글이 삭제되었습니다'
    })

  } catch (error) {
    console.error('DELETE post error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}