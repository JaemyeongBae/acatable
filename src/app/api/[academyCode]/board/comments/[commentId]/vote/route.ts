import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface VoteRequest {
  type: 'like'
}

// POST - Vote on a comment (only like/공감)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ academyCode: string; commentId: string }> }
) {
  try {
    const { academyCode, commentId } = await params
    const body: VoteRequest = await request.json()
    
    const { type } = body

    if (!type || type !== 'like') {
      return NextResponse.json({ success: false, message: '올바른 투표 타입이 아닙니다' }, { status: 400 })
    }

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwarded?.split(',')[0] || realIp || '127.0.0.1'

    // Check if comment exists and belongs to academy
    const { data: comment, error: commentError } = await supabase
      .from('board_comments')
      .select(`
        id,
        board_posts!inner(academy_code)
      `)
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json({ success: false, message: '댓글을 찾을 수 없습니다' }, { status: 404 })
    }

    const post = comment.board_posts as any
    if (post.academy_code !== academyCode) {
      return NextResponse.json({ success: false, message: '잘못된 접근입니다' }, { status: 403 })
    }

    // Check for existing vote from this IP within cooldown period (30 minutes)
    const cooldownTime = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('board_votes')
      .select('*')
      .eq('ip_address', clientIp)
      .eq('comment_id', commentId)
      .gte('created_at', cooldownTime)
      .maybeSingle()

    if (voteCheckError) {
      console.error('Vote check error:', voteCheckError)
      return NextResponse.json({ success: false, message: '투표 확인 중 오류가 발생했습니다' }, { status: 500 })
    }

    if (existingVote) {
      // If vote exists, toggle it off (remove vote)
      const { error: deleteError } = await supabase
        .from('board_votes')
        .delete()
        .eq('id', existingVote.id)

      if (deleteError) {
        console.error('Vote delete error:', deleteError)
        return NextResponse.json({ success: false, message: '공감 취소에 실패했습니다' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: '공감이 취소되었습니다',
        action: 'removed'
      })
    } else {
      // No existing vote, create new one
      const { error: insertError } = await supabase
        .from('board_votes')
        .insert({
          ip_address: clientIp,
          comment_id: commentId,
          vote_type: type
        })

      if (insertError) {
        console.error('Vote insert error:', insertError)
        return NextResponse.json({ success: false, message: '공감에 실패했습니다' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: '공감이 완료되었습니다',
        action: 'added'
      })
    }

  } catch (error) {
    console.error('Comment vote API error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}