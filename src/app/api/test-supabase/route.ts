import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Supabase 연결 테스트 시작 ===')
    
    // 모든 환경변수 확인
    console.log('환경변수 상태:')
    console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '설정됨' : '없음')
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '없음')
    console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '설정됨' : '없음')
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '없음')
    
    // URL과 키 가져오기
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      const errorMsg = `Supabase 환경변수가 없습니다. URL: ${supabaseUrl ? 'OK' : 'MISSING'}, KEY: ${supabaseKey ? 'OK' : 'MISSING'}`
      console.error(errorMsg)
      return NextResponse.json({
        success: false,
        message: errorMsg,
        debug: {
          url_available: !!supabaseUrl,
          key_available: !!supabaseKey,
          env_vars: {
            SUPABASE_URL: !!process.env.SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
            SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
          }
        }
      })
    }
    
    console.log('사용 중인 URL:', supabaseUrl)
    console.log('키 타입:', supabaseKey.includes('service_role') ? 'service_role' : 'anon')
    
    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 1. 간단한 연결 테스트
    console.log('1. 기본 연결 테스트...')
    const { data: testData, error: testError } = await supabase
      .from('academies')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('기본 연결 실패:', testError)
      return NextResponse.json({
        success: false,
        message: '데이터베이스 연결 실패',
        error: testError.message,
        debug: {
          error_code: testError.code,
          error_details: testError.details,
          error_hint: testError.hint
        }
      })
    }
    
    console.log('2. 학원 데이터 조회 테스트...')
    const { data: academies, error: academyError } = await supabase
      .from('academies')
      .select('id, name, code')
      .limit(5)
    
    if (academyError) {
      console.error('학원 데이터 조회 실패:', academyError)
      return NextResponse.json({
        success: false,
        message: '학원 데이터 조회 실패',
        error: academyError.message,
        debug: {
          error_code: academyError.code,
          error_details: academyError.details,
          error_hint: academyError.hint
        }
      })
    }
    
    console.log('조회된 학원 수:', academies?.length || 0)
    console.log('=== Supabase 연결 테스트 완료 ===')
    
    return NextResponse.json({
      success: true,
      message: 'Supabase 연결 성공',
      data: {
        academies_count: academies?.length || 0,
        academies: academies || [],
        connection_info: {
          url: supabaseUrl,
          key_type: supabaseKey.includes('service_role') ? 'service_role' : 'anon'
        }
      }
    })
    
  } catch (error) {
    console.error('예외 발생:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}