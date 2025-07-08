// 강의실 API 엔드포인트 (GET, POST)
// 목적: 학원별 강의실 조회 및 생성

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 강의실 목록 조회 (GET /api/classrooms)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const academyId = searchParams.get('academyId')

    console.log('강의실 조회 요청:', { academyId })

    if (!academyId) {
      return NextResponse.json({
        success: false,
        message: '학원 ID는 필수입니다.'
      }, { status: 400 })
    }

    const { data: classrooms, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .order('floor', { ascending: true })
      .order('name', { ascending: true })

    console.log('강의실 조회 결과:', { classrooms, error })

    if (error) {
      console.error('강의실 조회 오류:', error)
      return NextResponse.json({
        success: false,
        message: '강의실 조회 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    // 응답 데이터 변환
    const responseData = (classrooms || []).map((classroom: any) => ({
      id: classroom.id,
      name: classroom.name,
      capacity: classroom.capacity,
      equipment: classroom.equipment,
      floor: classroom.floor,
      location: classroom.location,
      isActive: classroom.is_active,
      createdAt: classroom.created_at,
      updatedAt: classroom.updated_at
    }))

    return NextResponse.json({
      success: true,
      message: `${responseData.length}개의 강의실을 조회했습니다.`,
      data: responseData
    })

  } catch (error) {
    console.error('강의실 조회 중 오류:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

/**
 * 새 강의실 생성 (POST /api/classrooms)
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('강의실 생성 요청:', data)

    // 필수 필드 검증
    if (!data.name || !data.academyId) {
      return NextResponse.json({
        success: false,
        message: '강의실명과 학원 ID는 필수입니다.'
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

    // 같은 학원 내 강의실명 중복 확인
    const { data: existingClassroom } = await supabase
      .from('classrooms')
      .select('id')
      .eq('academy_id', data.academyId)
      .eq('name', data.name)
      .eq('is_active', true)
      .single()

    if (existingClassroom) {
      return NextResponse.json({
        success: false,
        message: '이미 존재하는 강의실명입니다.'
      }, { status: 409 })
    }

    // ID 생성
    const classroomId = 'classroom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)

    // 강의실 생성
    const { data: newClassroom, error } = await supabase
      .from('classrooms')
      .insert([{
        id: classroomId,
        name: data.name,
        capacity: data.capacity || null,
        equipment: data.equipment || null,
        floor: data.floor || null,
        location: data.location || null,
        academy_id: data.academyId,
        is_active: true
      }])
      .select()
      .single()

    console.log('강의실 생성 결과:', { newClassroom, error })

    if (error) {
      console.error('강의실 생성 오류:', error)
      return NextResponse.json({
        success: false,
        message: '강의실 생성 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '강의실이 성공적으로 생성되었습니다.',
      data: {
        id: newClassroom.id,
        name: newClassroom.name,
        capacity: newClassroom.capacity,
        equipment: newClassroom.equipment,
        floor: newClassroom.floor,
        location: newClassroom.location
      }
    }, { status: 201 })

  } catch (error) {
    console.error('강의실 생성 중 오류:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

 