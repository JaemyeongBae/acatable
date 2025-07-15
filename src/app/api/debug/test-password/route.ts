import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

interface TestPasswordRequest {
  academyCode: string
  testPassword: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TestPasswordRequest = await request.json()
    const { academyCode, testPassword } = body

    console.log('=== 비밀번호 테스트 API 시작 ===')
    console.log('테스트 대상:', { academyCode, testPasswordLength: testPassword.length })

    if (!academyCode || !testPassword) {
      return NextResponse.json({ 
        success: false, 
        message: '학원 코드와 테스트 비밀번호는 필수입니다' 
      }, { status: 400 })
    }

    // 학원 정보 조회 (academies 테이블에서)
    console.log('1. 학원 정보 조회 중...')
    const { data: academy, error: academyError } = await supabase
      .from('academies')
      .select('*')
      .eq('code', academyCode)
      .single()

    if (academyError || !academy) {
      console.error('❌ 학원을 찾을 수 없음:', academyError?.message)
      return NextResponse.json({ 
        success: false, 
        message: '존재하지 않는 학원입니다' 
      }, { status: 404 })
    }

    // 계정 정보 조회 (accounts 테이블에서)
    console.log('2. 계정 정보 조회 중...')
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('academy_id', academy.id)
      .single()

    if (accountError || !account) {
      console.error('❌ 계정을 찾을 수 없음:', accountError?.message)
      return NextResponse.json({ 
        success: false, 
        message: '계정 정보를 찾을 수 없습니다' 
      }, { status: 404 })
    }

    console.log('3. 비밀번호 테스트 중...')
    console.log('저장된 해시 정보:', {
      hasPassword: !!account.password,
      passwordLength: account.password?.length || 0,
      hashPrefix: account.password?.substring(0, 15) || 'N/A',
      hashSuffix: account.password?.substring(account.password.length - 10) || 'N/A',
      isValidBcryptFormat: account.password?.startsWith('$2') || false
    })
    
    // 비밀번호 확인
    let passwordMatch = false
    if (account.password) {
      try {
        // 새로운 해시 생성하여 비교 (디버깅용)
        const newHash = await bcrypt.hash(testPassword, 10)
        console.log('새로 생성된 해시 정보:', {
          newHashLength: newHash.length,
          newHashPrefix: newHash.substring(0, 15),
          newHashSuffix: newHash.substring(newHash.length - 10)
        })
        
        passwordMatch = await bcrypt.compare(testPassword, account.password)
        console.log('✅ 비밀번호 테스트 완료:', { 
          passwordMatch,
          storedPasswordLength: account.password.length,
          testPasswordLength: testPassword.length
        })
      } catch (error) {
        console.error('❌ bcrypt 비교 오류:', error)
        return NextResponse.json({ 
          success: false, 
          message: '비밀번호 확인 중 오류가 발생했습니다' 
        }, { status: 500 })
      }
    } else {
      console.log('⚠️ 저장된 비밀번호가 없습니다')
    }

    console.log('=== 비밀번호 테스트 API 완료 ===')
    
    return NextResponse.json({
      success: true,
      message: '비밀번호 테스트가 완료되었습니다',
      data: {
        passwordMatch,
        hasStoredPassword: !!account.password,
        academyFound: true,
        accountFound: true,
        storedHashInfo: {
          length: account.password?.length || 0,
          prefix: account.password?.substring(0, 15) || 'N/A',
          isValidFormat: account.password?.startsWith('$2') || false
        }
      }
    })

  } catch (error) {
    console.error('❌ 비밀번호 테스트 API 오류:', error)
    return NextResponse.json({ 
      success: false, 
      message: '서버 오류가 발생했습니다' 
    }, { status: 500 })
  }
}