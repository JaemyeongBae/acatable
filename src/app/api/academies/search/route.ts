// 학원 검색 API
// 목적: 학원명으로 부분 일치 검색하여 등록된 학원 목록 반환

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 검색 결과 타입 정의
interface AcademySearchResult {
  academyId: string
  academyName: string
  academyCode: string
  createdAt: string
}

// 응답 타입 정의
interface SearchResponse {
  success: boolean
  message: string
  data?: AcademySearchResult[]
}

export async function GET(request: NextRequest): Promise<NextResponse<SearchResponse>> {
  try {
    console.log('학원 검색 API 호출됨')
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q')
    console.log('검색어:', searchTerm)
    
    // 검색어 검증
    if (!searchTerm || searchTerm.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: '검색어를 입력해주세요.'
        },
        { status: 400 }
      )
    }
    
    // 검색어 길이 제한 (최소 1자, 최대 50자)
    const trimmedSearchTerm = searchTerm.trim()
    if (trimmedSearchTerm.length > 50) {
      return NextResponse.json(
        {
          success: false,
          message: '검색어는 50자 이하로 입력해주세요.'
        },
        { status: 400 }
      )
    }
    
    // Supabase 함수 호출로 학원 검색
    console.log('Supabase 검색 함수 호출:', trimmedSearchTerm)
    const { data, error } = await supabase.rpc('search_academies', {
      p_search_term: trimmedSearchTerm
    })
    
    console.log('검색 결과:', { data, error })
    
    if (error) {
      console.error('학원 검색 오류:', error)
      return NextResponse.json(
        {
          success: false,
          message: '검색 중 오류가 발생했습니다.'
        },
        { status: 500 }
      )
    }
    
    // 검색 결과 변환
    const searchResults: AcademySearchResult[] = (data || []).map((academy: any) => ({
      academyId: academy.academy_id,
      academyName: academy.academy_name,
      academyCode: academy.academy_code,
      createdAt: academy.created_at
    }))
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      message: `${searchResults.length}개의 학원을 찾았습니다.`,
      data: searchResults
    })
    
  } catch (error) {
    console.error('학원 검색 처리 오류:', error)
    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}