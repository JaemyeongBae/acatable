// 강사 관리 API
// 목적: 학원별 강사 CRUD 작업을 위한 엔드포인트

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 강사 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const academyId = searchParams.get('academyId')

    if (!academyId) {
      return NextResponse.json({
        success: false,
        message: 'academyId가 필요합니다.'
      }, { status: 400 })
    }

    // 강사 목록 조회 (users 테이블과 조인)
    const { data: instructors, error } = await supabase
      .from('instructors')
      .select(`
        *,
        users:user_id (name, email, phone)
      `)
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .order('created_at')

    if (error) {
      console.error('강사 조회 오류:', error)
      return NextResponse.json({
        success: false,
        message: '강사 조회 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    // 응답 데이터 변환
    const responseData = (instructors || []).map((instructor: any) => ({
      id: instructor.id,
      name: instructor.users?.name || '강사 미정',
      email: instructor.users?.email || '',
      phone: instructor.users?.phone || '',
      specialties: instructor.specialties || '',
      bio: instructor.bio || '',
      isActive: instructor.is_active,
      createdAt: instructor.created_at,
      updatedAt: instructor.updated_at
    }))

    return NextResponse.json({
      success: true,
      message: `${responseData.length}명의 강사를 조회했습니다.`,
      data: responseData
    })

  } catch (error) {
    console.error('강사 목록 조회 실패:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// 새 강사 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { academyId, name, email, phone, specialties } = body
    
    console.log('강사 등록 요청 데이터:', { academyId, name, email, phone, specialties })

    // 필수 필드 검증
    if (!academyId || !name?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'academyId와 강사명은 필수입니다.'
      }, { status: 400 })
    }

    // 학원 존재 확인
    const { data: academy, error: academyError } = await supabase
      .from('academies')
      .select('id')
      .eq('id', academyId)
      .single()

    if (academyError || !academy) {
      return NextResponse.json({
        success: false,
        message: '존재하지 않는 학원입니다.'
      }, { status: 404 })
    }

    // 중복 검사 (같은 학원 내 강사명 중복 방지)
    const { data: existingInstructor } = await supabase
      .from('instructors')
      .select(`
        id,
        users:user_id (name)
      `)
      .eq('academy_id', academyId)
      .eq('is_active', true)

    const duplicate = existingInstructor?.find((instructor: any) => 
      instructor.users?.name === name.trim()
    )

    if (duplicate) {
      return NextResponse.json({
        success: false,
        message: '이미 등록된 강사명입니다.'
      }, { status: 400 })
    }

    // 사용자 ID 생성
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
    // 트랜잭션으로 사용자와 강사 레코드 생성
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email?.trim() || null,
        name: name.trim(),
        phone: phone?.trim() || null,
        role: 'INSTRUCTOR',
        academy_id: academyId
      })
      .select()
      .single()

    if (userError) {
      console.error('사용자 생성 오류:', userError)
      return NextResponse.json({
        success: false,
        message: `사용자 생성 오류: ${userError.message}`,
        error: userError
      }, { status: 500 })
    }

    // 강사 ID 생성
    const instructorId = 'instructor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
    const { data: newInstructor, error: instructorError } = await supabase
      .from('instructors')
      .insert({
        id: instructorId,
        user_id: newUser.id,
        academy_id: academyId,
        specialties: specialties?.trim() || '',
        bio: null
      })
      .select()
      .single()

    if (instructorError) {
      // 롤백: 생성된 사용자 삭제
      await supabase
        .from('users')
        .delete()
        .eq('id', newUser.id)

      console.error('강사 프로필 생성 오류:', instructorError)
      return NextResponse.json({
        success: false,
        message: `강사 프로필 생성 오류: ${instructorError.message}`,
        error: instructorError
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '강사가 성공적으로 등록되었습니다.',
      data: {
        id: newInstructor.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        specialties: newInstructor.specialties
      }
    }, { status: 201 })

  } catch (error) {
    console.error('강사 추가 실패:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
} 