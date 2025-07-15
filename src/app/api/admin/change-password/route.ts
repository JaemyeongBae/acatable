import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

interface AdminChangePasswordRequest {
  academyCode: string
  newPassword: string
  adminPassword: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AdminChangePasswordRequest = await request.json()
    const { academyCode, newPassword, adminPassword } = body

    if (!academyCode || !newPassword || !adminPassword) {
      return NextResponse.json({ 
        success: false, 
        message: '모든 필드를 입력해주세요' 
      }, { status: 400 })
    }

    // Admin 마스터 비밀번호 확인
    const adminMasterPassword = process.env.ADMIN_MASTER_PASSWORD
    if (!adminMasterPassword || adminPassword !== adminMasterPassword) {
      return NextResponse.json({ 
        success: false, 
        message: 'Admin 마스터 비밀번호가 일치하지 않습니다' 
      }, { status: 401 })
    }

    // 새 비밀번호 유효성 검사
    if (newPassword.length < 6) {
      return NextResponse.json({ 
        success: false, 
        message: '비밀번호는 최소 6자 이상이어야 합니다' 
      }, { status: 400 })
    }

    // 학원 존재 확인
    const { data: academy, error: academyError } = await supabase
      .from('academies')
      .select('code, name')
      .eq('code', academyCode)
      .single()

    if (academyError || !academy) {
      return NextResponse.json({ 
        success: false, 
        message: '존재하지 않는 학원입니다' 
      }, { status: 404 })
    }

    // 새 비밀번호 해시화
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // 비밀번호 업데이트
    const { error: updateError } = await supabase
      .from('academies')
      .update({ password: hashedNewPassword })
      .eq('code', academyCode)

    if (updateError) {
      console.error('Admin password update error:', updateError)
      return NextResponse.json({ 
        success: false, 
        message: '비밀번호 변경 중 오류가 발생했습니다' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${academy.name} (${academyCode})의 비밀번호가 성공적으로 변경되었습니다`
    })

  } catch (error) {
    console.error('Admin change password API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: '서버 오류가 발생했습니다' 
    }, { status: 500 })
  }
}