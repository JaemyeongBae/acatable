// 강사 개별 관리 API
// 목적: 특정 강사의 수정, 삭제 작업을 위한 엔드포인트

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 강사 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: instructorId } = await params
    const body = await request.json()
    const { academyId, name, email, phone, specialties } = body

    // 필수 필드 검증
    if (!academyId || !name?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'academyId와 강사명은 필수입니다.'
      }, { status: 400 })
    }

    // 강사 존재 및 권한 확인
    const { data: instructor, error: instructorError } = await supabase
      .from('instructors')
      .select(`
        *,
        users:user_id (id, name, email, phone)
      `)
      .eq('id', instructorId)
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .single()

    if (instructorError || !instructor) {
      return NextResponse.json({
        success: false,
        message: '강사를 찾을 수 없거나 권한이 없습니다.'
      }, { status: 404 })
    }

    // 중복 검사 (같은 학원 내 다른 강사와 이름 중복 방지)
    const { data: existingInstructors } = await supabase
      .from('instructors')
      .select(`
        id,
        users:user_id (name)
      `)
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .neq('id', instructorId)

    const duplicate = existingInstructors?.find((inst: any) => 
      inst.users?.name === name.trim()
    )

    if (duplicate) {
      return NextResponse.json({
        success: false,
        message: '이미 등록된 강사명입니다.'
      }, { status: 400 })
    }

    // 사용자 정보 업데이트
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', instructor.user_id)

    if (userUpdateError) {
      console.error('사용자 정보 업데이트 오류:', userUpdateError)
      return NextResponse.json({
        success: false,
        message: '강사 정보 수정 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    // 강사 프로필 업데이트
    const { error: instructorUpdateError } = await supabase
      .from('instructors')
      .update({
        specialties: specialties?.trim() || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', instructorId)

    if (instructorUpdateError) {
      console.error('강사 프로필 업데이트 오류:', instructorUpdateError)
      return NextResponse.json({
        success: false,
        message: '강사 정보 수정 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '강사 정보가 성공적으로 수정되었습니다.',
      data: {
        id: instructorId,
        name: name.trim(),
        email: email?.trim() || instructor.users.email || null,
        phone: phone?.trim() || instructor.users.phone || null,
        specialties: specialties?.trim() || ''
      }
    })

  } catch (error) {
    console.error('강사 수정 실패:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// 강사 삭제 (소프트 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: instructorId } = await params
    const { searchParams } = new URL(request.url)
    const academyId = searchParams.get('academyId')

    if (!academyId) {
      return NextResponse.json({
        success: false,
        message: 'academyId가 필요합니다.'
      }, { status: 400 })
    }

    // 강사 존재 및 권한 확인
    const { data: instructor, error: instructorError } = await supabase
      .from('instructors')
      .select('id, user_id')
      .eq('id', instructorId)
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .single()

    if (instructorError || !instructor) {
      return NextResponse.json({
        success: false,
        message: '강사를 찾을 수 없거나 권한이 없습니다.'
      }, { status: 404 })
    }

    // 강사가 배정된 시간표 확인
    const { data: schedules } = await supabase
      .from('schedules')
      .select('id')
      .eq('instructor_id', instructorId)
      .eq('is_active', true)

    if (schedules && schedules.length > 0) {
      return NextResponse.json({
        success: false,
        message: '이 강사가 배정된 시간표가 있어 삭제할 수 없습니다. 먼저 시간표를 수정해주세요.'
      }, { status: 400 })
    }

    // 소프트 삭제 (강사 프로필)
    const { error: instructorDeleteError } = await supabase
      .from('instructors')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', instructorId)

    if (instructorDeleteError) {
      console.error('강사 삭제 오류:', instructorDeleteError)
      return NextResponse.json({
        success: false,
        message: '강사 삭제 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    // 소프트 삭제 (사용자)
    const { error: userDeleteError } = await supabase
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', instructor.user_id)

    if (userDeleteError) {
      console.error('사용자 삭제 오류:', userDeleteError)
      // 강사 삭제 롤백
      await supabase
        .from('instructors')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', instructorId)

      return NextResponse.json({
        success: false,
        message: '강사 삭제 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '강사가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('강사 삭제 실패:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}