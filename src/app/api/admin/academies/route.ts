import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('Admin academies API 호출됨')
    
    // 환경변수에서 Supabase 설정 가져오기
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('환경변수 확인:')
    console.log('- SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음')
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '없음')
    console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '설정됨' : '없음')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase 환경변수가 설정되지 않았습니다.')
      return NextResponse.json({
        success: false,
        message: 'Supabase 설정 오류입니다.'
      }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('학원 목록 조회 시작...')
    console.log('사용 중인 URL:', supabaseUrl)
    console.log('사용 중인 키 타입:', supabaseKey.includes('service_role') ? 'service_role' : 'anon')
    
    const { data: academies, error } = await supabase
      .from('academies')
      .select('id, name, code, email, phone, created_at')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('학원 목록 조회 오류:', error)
      return NextResponse.json(
        {
          success: false,
          message: '학원 목록을 불러오는데 실패했습니다.'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: academies || []
    })
    
  } catch (error) {
    console.error('학원 목록 API 오류:', error)
    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}