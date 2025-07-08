// 데이터베이스 연결 테스트 API
// 목적: Supabase 연결 상태 및 마이그레이션 확인

import { NextResponse } from 'next/server'
import { supabase, checkDatabaseConnection, debugSupabaseConfig } from '@/lib/supabase'

export async function GET() {
  try {
    // 디버그 정보 출력
    debugSupabaseConfig()
    
    // 데이터베이스 연결 테스트
    const connectionTest = await checkDatabaseConnection()
    
    const result = {
      timestamp: new Date().toISOString(),
      supabaseConnection: connectionTest,
      tests: [] as Array<{
        name: string
        success: boolean
        error: string | null
        data: any
      }>
    }
    
    // 1. 기본 연결 테스트
    try {
      const { data: academies, error: academiesError } = await supabase
        .from('academies')
        .select('count')
        .limit(1)
      
      result.tests.push({
        name: 'academies 테이블 접근',
        success: !academiesError,
        error: academiesError?.message || null,
        data: academies || null
      })
    } catch (error) {
      result.tests.push({
        name: 'academies 테이블 접근',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      })
    }
    
    // 2. accounts 테이블 확인
    try {
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('count')
        .limit(1)
      
      result.tests.push({
        name: 'accounts 테이블 접근',
        success: !accountsError,
        error: accountsError?.message || null,
        data: accounts || null
      })
    } catch (error) {
      result.tests.push({
        name: 'accounts 테이블 접근',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      })
    }
    
    // 3. 함수 존재 확인
    try {
      const { data: functionTest, error: functionError } = await supabase
        .rpc('search_academies', { p_search_term: 'test' })
      
      result.tests.push({
        name: 'search_academies 함수 호출',
        success: !functionError,
        error: functionError?.message || null,
        data: functionTest || null
      })
    } catch (error) {
      result.tests.push({
        name: 'search_academies 함수 호출',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      })
    }
    
    // 4. 샘플 데이터 확인
    try {
      const { data: sampleData, error: sampleError } = await supabase
        .from('academies')
        .select('id, name, code')
        .limit(5)
      
      result.tests.push({
        name: '샘플 데이터 조회',
        success: !sampleError,
        error: sampleError?.message || null,
        data: sampleData || null
      })
    } catch (error) {
      result.tests.push({
        name: '샘플 데이터 조회',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      })
    }
    
    const overallSuccess = result.tests.every(test => test.success)
    
    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess ? '모든 테스트 통과' : '일부 테스트 실패',
      data: result
    }, { 
      status: overallSuccess ? 200 : 500 
    })
    
  } catch (error) {
    console.error('테스트 API 오류:', error)
    return NextResponse.json({
      success: false,
      message: '테스트 실행 중 오류 발생',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}