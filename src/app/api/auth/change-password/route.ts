import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

interface ChangePasswordRequest {
  academyCode: string
  currentPassword?: string
  newPassword: string
  email?: string
  phone?: string
  type: 'current' | 'recovery' // current: 현재 비밀번호로 변경, recovery: 이메일+전화번호로 변경
}

export async function POST(request: NextRequest) {
  console.log('=== 비밀번호 변경 API 시작 ===')
  
  try {
    // 요청 본문 파싱
    console.log('1. 요청 본문 파싱 시작...')
    let body: ChangePasswordRequest
    try {
      body = await request.json()
      console.log('✅ 요청 본문 파싱 성공:', { 
        academyCode: body.academyCode, 
        type: body.type, 
        hasCurrentPassword: !!body.currentPassword,
        hasEmail: !!body.email,
        hasPhone: !!body.phone,
        hasNewPassword: !!body.newPassword
      })
    } catch (parseError) {
      console.error('❌ 요청 본문 파싱 실패:', parseError)
      return NextResponse.json({ 
        success: false, 
        message: '요청 데이터가 올바르지 않습니다' 
      }, { status: 400 })
    }
    
    const { academyCode, currentPassword, newPassword, email, phone, type } = body

    // 필수 필드 검증
    console.log('2. 필수 필드 검증 중...')
    if (!academyCode || !newPassword) {
      console.log('❌ 필수 필드 누락')
      return NextResponse.json({ 
        success: false, 
        message: '학원 코드와 새 비밀번호는 필수입니다' 
      }, { status: 400 })
    }

    // 새 비밀번호 유효성 검사
    console.log('3. 새 비밀번호 유효성 검사 중...')
    if (newPassword.length < 6) {
      console.log('❌ 새 비밀번호 길이 부족')
      return NextResponse.json({ 
        success: false, 
        message: '비밀번호는 최소 6자 이상이어야 합니다' 
      }, { status: 400 })
    }

    // 학원 정보 조회 (academies 테이블에서 이메일/전화번호 확인용)
    console.log('4. 학원 정보 조회 중...')
    let academy, academyError
    try {
      const result = await supabase
        .from('academies')
        .select('*')
        .eq('code', academyCode)
        .single()
      
      academy = result.data
      academyError = result.error
      
      console.log('✅ 학원 조회 결과:', { 
        found: !!academy, 
        hasEmail: !!academy?.email,
        hasPhone: !!academy?.phone,
        error: academyError?.message 
      })
    } catch (dbError) {
      console.error('❌ 학원 조회 중 예외 발생:', dbError)
      return NextResponse.json({ 
        success: false, 
        message: '데이터베이스 연결 중 오류가 발생했습니다' 
      }, { status: 500 })
    }

    if (academyError || !academy) {
      console.error('❌ 학원을 찾을 수 없음:', academyError?.message)
      return NextResponse.json({ 
        success: false, 
        message: '존재하지 않는 학원입니다' 
      }, { status: 404 })
    }

    // 계정 정보 조회 (accounts 테이블에서 실제 비밀번호 확인용)
    console.log('5. 계정 정보 조회 중...')
    let account, accountError
    try {
      const result = await supabase
        .from('accounts')
        .select('*')
        .eq('academy_id', academy.id)
        .single()
      
      account = result.data
      accountError = result.error
      
      console.log('✅ 계정 조회 결과:', { 
        found: !!account, 
        hasPassword: !!account?.password,
        error: accountError?.message 
      })
    } catch (dbError) {
      console.error('❌ 계정 조회 중 예외 발생:', dbError)
      return NextResponse.json({ 
        success: false, 
        message: '계정 정보 조회 중 오류가 발생했습니다' 
      }, { status: 500 })
    }

    if (accountError || !account) {
      console.error('❌ 계정을 찾을 수 없음:', accountError?.message)
      return NextResponse.json({ 
        success: false, 
        message: '계정 정보를 찾을 수 없습니다' 
      }, { status: 404 })
    }

    // 요청 타입에 따른 인증 처리
    console.log('6. 인증 처리 중... 타입:', type)
    
    if (type === 'recovery') {
      console.log('6-1. recovery 타입 처리 중...')
      
      if (!email || !phone) {
        console.log('❌ 이메일 또는 전화번호 누락')
        return NextResponse.json({ 
          success: false, 
          message: '등록된 이메일과 전화번호를 입력해주세요' 
        }, { status: 400 })
      }

      console.log('6-2. 이메일/전화번호 확인:', { 
        academyEmail: academy.email, 
        academyPhone: academy.phone, 
        inputEmail: email, 
        inputPhone: phone 
      })
      
      // 학원에 이메일 또는 전화번호가 등록되지 않은 경우
      if (!academy.email || !academy.phone) {
        console.log('❌ 학원에 이메일 또는 전화번호가 등록되지 않음')
        return NextResponse.json({ 
          success: false, 
          message: '등록된 이메일 또는 전화번호가 없습니다. 관리자에게 문의하세요.' 
        }, { status: 400 })
      }
      
      // 이메일과 전화번호 확인
      if (academy.email !== email || academy.phone !== phone) {
        console.log('❌ 이메일 또는 전화번호 불일치')
        return NextResponse.json({ 
          success: false, 
          message: '등록된 이메일 또는 전화번호가 일치하지 않습니다' 
        }, { status: 401 })
      }
      
      console.log('✅ 이메일/전화번호 확인 완료')
      
    } else if (type === 'current') {
      console.log('6-1. current 타입 처리 중...')
      
      if (!currentPassword) {
        console.log('❌ 현재 비밀번호 누락')
        return NextResponse.json({ 
          success: false, 
          message: '현재 비밀번호를 입력해주세요' 
        }, { status: 400 })
      }

      // 현재 비밀번호 확인 (관리자 비밀번호 또는 Admin 마스터 비밀번호)
      console.log('6-2. 비밀번호 확인 중...', { hasStoredPassword: !!account.password })
      
      // Admin 마스터 비밀번호 확인
      const adminMasterPassword = process.env.ADMIN_MASTER_PASSWORD
      const isAdminPassword = adminMasterPassword && currentPassword === adminMasterPassword
      
      // 일반 비밀번호 확인 (stored password가 있을 때만)
      let isCurrentPasswordValid = false
      if (account.password) {
        try {
          isCurrentPasswordValid = await bcrypt.compare(currentPassword, account.password)
        } catch (bcryptError) {
          console.error('❌ bcrypt 비교 오류:', bcryptError)
          return NextResponse.json({ 
            success: false, 
            message: '비밀번호 확인 중 오류가 발생했습니다' 
          }, { status: 500 })
        }
      }
      
      console.log('✅ 비밀번호 확인 결과:', { isCurrentPasswordValid, isAdminPassword })
      
      if (!isCurrentPasswordValid && !isAdminPassword) {
        console.log('❌ 현재 비밀번호 불일치')
        return NextResponse.json({ 
          success: false, 
          message: '현재 비밀번호가 일치하지 않습니다' 
        }, { status: 401 })
      }
      
    } else {
      console.log('❌ 알 수 없는 요청 타입:', type)
      return NextResponse.json({ 
        success: false, 
        message: '올바르지 않은 요청 유형입니다' 
      }, { status: 400 })
    }

    // 새 비밀번호 해시화
    console.log('7. 새 비밀번호 해시화 중...')
    let hashedNewPassword
    try {
      hashedNewPassword = await bcrypt.hash(newPassword, 10)
      console.log('✅ 새 비밀번호 해시화 완료, 길이:', hashedNewPassword.length)
    } catch (hashError) {
      console.error('❌ 비밀번호 해시화 오류:', hashError)
      return NextResponse.json({ 
        success: false, 
        message: '비밀번호 처리 중 오류가 발생했습니다' 
      }, { status: 500 })
    }

    // 비밀번호 업데이트 (accounts 테이블)
    console.log('8. 데이터베이스 업데이트 중...')
    let updateError
    try {
      const updateResult = await supabase
        .from('accounts')
        .update({ password: hashedNewPassword })
        .eq('id', account.id)
      
      updateError = updateResult.error
      console.log('✅ 데이터베이스 업데이트 결과:', { 
        error: updateError?.message,
        success: !updateError
      })
    } catch (dbUpdateError) {
      console.error('❌ 데이터베이스 업데이트 중 예외 발생:', dbUpdateError)
      return NextResponse.json({ 
        success: false, 
        message: '데이터베이스 업데이트 중 오류가 발생했습니다' 
      }, { status: 500 })
    }

    if (updateError) {
      console.error('❌ 비밀번호 업데이트 실패:', updateError)
      return NextResponse.json({ 
        success: false, 
        message: '비밀번호 변경 중 오류가 발생했습니다' 
      }, { status: 500 })
    }

    // 변경 후 비밀번호 확인 (디버깅용)
    console.log('9. 변경 후 비밀번호 확인 중...')
    try {
      const { data: updatedAccount } = await supabase
        .from('accounts')
        .select('password')
        .eq('id', account.id)
        .single()
      
      console.log('✅ 비밀번호 변경 완료!', { 
        passwordChanged: updatedAccount?.password !== account.password,
        newPasswordLength: updatedAccount?.password?.length || 0
      })
    } catch (verifyError) {
      console.error('⚠️ 변경 후 확인 중 오류 (변경은 성공):', verifyError)
    }
    
    console.log('=== 비밀번호 변경 API 완료 ===')
    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다'
    })

  } catch (error) {
    console.error('❌ 비밀번호 변경 API 전체 오류:', error)
    console.error('❌ 오류 스택:', error instanceof Error ? error.stack : String(error))
    return NextResponse.json({ 
      success: false, 
      message: `서버 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 })
  }
}