import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

interface UpdateCommentRequest {
  content: string
  password: string
  adminPassword?: string
}

interface DeleteCommentRequest {
  password: string
  adminPassword?: string
}

// PUT - Update comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ academyCode: string; commentId: string }> }
) {
  try {
    const { academyCode, commentId } = await params
    const body: UpdateCommentRequest = await request.json()
    
    const { content, password, adminPassword } = body

    if (!content || !password) {
      return NextResponse.json({ success: false, message: '내용과 비밀번호는 필수입니다' }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, message: 'Supabase 설정 오류' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get comment with post info
    const { data: comment, error: commentError } = await supabase
      .from('board_comments')
      .select(`
        *,
        board_posts!inner(academy_code)
      `)
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json({ success: false, message: '댓글을 찾을 수 없습니다' }, { status: 404 })
    }

    // Check if comment belongs to the academy
    if (comment.board_posts.academy_code !== academyCode) {
      return NextResponse.json({ success: false, message: '잘못된 접근입니다' }, { status: 403 })
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
    
    const isAuthor = await bcrypt.compare(password, comment.password_hash)

    if (!isAdminMaster && !isAcademyAdmin && !isAuthor) {
      return NextResponse.json({ success: false, message: '수정 권한이 없습니다' }, { status: 403 })
    }

    // Update comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('board_comments')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select('id, content, author_nickname, created_at, updated_at')
      .single()

    if (updateError) {
      console.error('Comment update error:', updateError)
      return NextResponse.json({ success: false, message: '댓글 수정에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '댓글이 수정되었습니다',
      data: updatedComment
    })

  } catch (error) {
    console.error('PUT comment error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// DELETE - Delete comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ academyCode: string; commentId: string }> }
) {
  try {
    const { academyCode, commentId } = await params
    const body: DeleteCommentRequest = await request.json()
    
    const { password, adminPassword } = body

    if (!password && !adminPassword) {
      return NextResponse.json({ success: false, message: '비밀번호가 필요합니다' }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, message: 'Supabase 설정 오류' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get comment with post info
    const { data: comment, error: commentError } = await supabase
      .from('board_comments')
      .select(`
        *,
        board_posts!inner(academy_code)
      `)
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json({ success: false, message: '댓글을 찾을 수 없습니다' }, { status: 404 })
    }

    // Check if comment belongs to the academy
    if (comment.board_posts.academy_code !== academyCode) {
      return NextResponse.json({ success: false, message: '잘못된 접근입니다' }, { status: 403 })
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
    
    const isAuthor = password && await bcrypt.compare(password, comment.password_hash)

    if (!isAdminMaster && !isAcademyAdmin && !isAuthor) {
      return NextResponse.json({ success: false, message: '삭제 권한이 없습니다' }, { status: 403 })
    }

    // Delete comment
    const { error: deleteError } = await supabase
      .from('board_comments')
      .delete()
      .eq('id', commentId)

    if (deleteError) {
      console.error('Comment delete error:', deleteError)
      return NextResponse.json({ success: false, message: '댓글 삭제에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '댓글이 삭제되었습니다'
    })

  } catch (error) {
    console.error('DELETE comment error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}