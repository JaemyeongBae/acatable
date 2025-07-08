// 과목 API 엔드포인트 (GET, POST)
// 목적: 학원별 과목 조회 및 생성

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 과목 목록 조회 (GET /api/subjects)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const academyId = searchParams.get('academyId')

    console.log('과목 조회 요청:', { academyId })

    if (!academyId) {
      return NextResponse.json({
        success: false,
        message: '학원 ID는 필수입니다.'
      }, { status: 400 })
    }

    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .order('name')

    console.log('과목 조회 결과:', { subjects, error })

    if (error) {
      console.error('과목 조회 오류:', error)
      return NextResponse.json({
        success: false,
        message: '과목 조회 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    // 응답 데이터 변환
    const responseData = (subjects || []).map((subject: any) => ({
      id: subject.id,
      name: subject.name,
      color: subject.color
    }))

    return NextResponse.json({
      success: true,
      message: `${responseData.length}개의 과목을 조회했습니다.`,
      data: responseData
    })

  } catch (error) {
    console.error('과목 조회 중 오류:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

/**
 * 새 과목 생성 (POST /api/subjects)
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('과목 생성 요청:', data)

    // 필수 필드 검증
    if (!data.name || !data.academyId) {
      return NextResponse.json({
        success: false,
        message: '과목명과 학원 ID는 필수입니다.'
      }, { status: 400 })
    }

    // 학원 존재 확인
    const { data: academy, error: academyError } = await supabase
      .from('academies')
      .select('id')
      .eq('id', data.academyId)
      .single()

    if (academyError || !academy) {
      return NextResponse.json({
        success: false,
        message: '존재하지 않는 학원입니다.'
      }, { status: 404 })
    }

    // 같은 학원 내 과목명 중복 확인
    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('academy_id', data.academyId)
      .eq('name', data.name)
      .eq('is_active', true)
      .single()

    if (existingSubject) {
      return NextResponse.json({
        success: false,
        message: '이미 존재하는 과목명입니다.'
      }, { status: 409 })
    }

    // ID 생성
    const subjectId = 'subject_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)

    // 과목 생성
    const { data: newSubject, error } = await supabase
      .from('subjects')
      .insert([{
        id: subjectId,
        name: data.name,
        color: data.color || '#3B82F6',
        academy_id: data.academyId,
        is_active: true
      }])
      .select()
      .single()

    console.log('과목 생성 결과:', { newSubject, error })

    if (error) {
      console.error('과목 생성 오류:', error)
      return NextResponse.json({
        success: false,
        message: '과목 생성 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '과목이 성공적으로 생성되었습니다.',
      data: {
        id: newSubject.id,
        name: newSubject.name,
        color: newSubject.color
      }
    }, { status: 201 })

  } catch (error) {
    console.error('과목 생성 중 오류:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

/**
 * 과목 수정 (PUT /api/subjects)
 */
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('과목 수정 요청:', data)

    // 필수 필드 검증
    if (!data.id || !data.name || !data.academyId) {
      return NextResponse.json({
        success: false,
        message: '과목 ID, 과목명, 학원 ID는 필수입니다.'
      }, { status: 400 })
    }

    // 과목 존재 확인
    const { data: existingSubject, error: checkError } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', data.id)
      .eq('academy_id', data.academyId)
      .eq('is_active', true)
      .single()

    if (checkError || !existingSubject) {
      return NextResponse.json({
        success: false,
        message: '수정할 과목을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 같은 학원 내 과목명 중복 확인 (자기 자신 제외)
    const { data: duplicateSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('academy_id', data.academyId)
      .eq('name', data.name)
      .eq('is_active', true)
      .neq('id', data.id)
      .single()

    if (duplicateSubject) {
      return NextResponse.json({
        success: false,
        message: '이미 존재하는 과목명입니다.'
      }, { status: 409 })
    }

    // 과목 수정
    const { data: updatedSubject, error } = await supabase
      .from('subjects')
      .update({
        name: data.name,
        color: data.color || existingSubject.color,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)
      .select()
      .single()

    console.log('과목 수정 결과:', { updatedSubject, error })

    if (error) {
      console.error('과목 수정 오류:', error)
      return NextResponse.json({
        success: false,
        message: '과목 수정 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '과목이 성공적으로 수정되었습니다.',
      data: {
        id: updatedSubject.id,
        name: updatedSubject.name,
        color: updatedSubject.color
      }
    })

  } catch (error) {
    console.error('과목 수정 중 오류:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

/**
 * 과목 삭제 (DELETE /api/subjects)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const academyId = searchParams.get('academyId')

    console.log('과목 삭제 요청:', { id, academyId })

    if (!id || !academyId) {
      return NextResponse.json({
        success: false,
        message: '과목 ID와 학원 ID는 필수입니다.'
      }, { status: 400 })
    }

    // 과목 존재 확인
    const { data: existingSubject, error: checkError } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .single()

    if (checkError || !existingSubject) {
      return NextResponse.json({
        success: false,
        message: '삭제할 과목을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 과목을 사용하는 스케줄이 있는지 확인
    const { data: relatedSchedules } = await supabase
      .from('schedules')
      .select('id')
      .eq('subject_id', id)
      .eq('is_active', true)
      .limit(1)

    if (relatedSchedules && relatedSchedules.length > 0) {
      return NextResponse.json({
        success: false,
        message: '이 과목을 사용하는 시간표가 있어 삭제할 수 없습니다.'
      }, { status: 409 })
    }

    // 소프트 삭제 (is_active를 false로 변경)
    const { error } = await supabase
      .from('subjects')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    console.log('과목 삭제 결과:', { error })

    if (error) {
      console.error('과목 삭제 오류:', error)
      return NextResponse.json({
        success: false,
        message: '과목 삭제 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '과목이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('과목 삭제 중 오류:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
} 