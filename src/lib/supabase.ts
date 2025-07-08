// Supabase 클라이언트 설정
// 목적: Supabase 데이터베이스 연결 및 실시간 기능 지원

import { createClient } from '@supabase/supabase-js'

// 환경 변수 확인 함수
function getSupabaseConfig() {
  // 서버사이드인지 클라이언트사이드인지 확인
  const isServer = typeof window === 'undefined'
  
  if (isServer) {
    // 서버사이드: API Routes에서 사용
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      console.error('서버사이드 Supabase 환경 변수가 설정되지 않았습니다.')
      console.error('필요한 변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    }
    
    return { url, key }
  } else {
    // 클라이언트사이드: 브라우저에서 사용
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      console.error('클라이언트사이드 Supabase 환경 변수가 설정되지 않았습니다.')
      console.error('필요한 변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    
    return { url, key }
  }
}

const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig()

// 기본값 설정 (환경 변수가 없을 때)
const defaultUrl = 'https://zbjgwyhrsjagdbbfkwug.supabase.co'
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpiamd3eWhyc2phZ2RiYmZrd3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NjM5NzAsImV4cCI6MjA2NzQzOTk3MH0.wqlNFkKrh9FEz2Be_NxjTarUPa2vSYUiI9Ld51bf6wc'

// Supabase 클라이언트 인스턴스 생성
export const supabase = createClient(
  supabaseUrl || defaultUrl, 
  supabaseKey || defaultKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)

// 데이터베이스 연결 상태 확인 함수
export async function checkDatabaseConnection() {
  try {
    console.log('데이터베이스 연결 테스트 중...')
    
    // 간단한 쿼리로 연결 테스트
    const { data, error } = await supabase
      .from('academies')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('데이터베이스 연결 오류:', error.message)
      return false
    }
    
    console.log('데이터베이스 연결 성공')
    return true
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error)
    return false
  }
}

// 환경 변수 디버깅 함수
export function debugSupabaseConfig() {
  const isServer = typeof window === 'undefined'
  console.log('=== Supabase 설정 디버깅 ===')
  console.log('실행 환경:', isServer ? '서버' : '클라이언트')
  console.log('SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음')
  console.log('SUPABASE_KEY:', supabaseKey ? '설정됨' : '없음')
  
  if (isServer) {
    console.log('서버 환경 변수들:')
    console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '설정됨' : '없음')
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '없음')
    console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '설정됨' : '없음')
  } else {
    console.log('클라이언트 환경 변수들:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '없음')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '없음')
  }
  console.log('========================')
}