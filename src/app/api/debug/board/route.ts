import { NextRequest, NextResponse } from 'next/server'
import { supabase, debugSupabaseConfig } from '@/lib/supabase'

// Debug endpoint to check board configuration
export async function GET(request: NextRequest) {
  try {
    // Debug environment variables
    debugSupabaseConfig()
    
    // Test database connection
    const { data: testQuery, error: testError } = await supabase
      .from('board_posts')
      .select('id')
      .limit(1)
    
    // Check board tables exist
    let tables = null
    let tablesError = null
    try {
      const result = await supabase
        .rpc('get_table_info', {
          table_names: ['board_posts', 'board_comments', 'board_votes']
        })
        .single()
      tables = result.data
      tablesError = result.error
    } catch (e) {
      tablesError = 'RPC function not found'
    }
    
    // Get sample academy
    const { data: academy, error: academyError } = await supabase
      .from('academies')
      .select('code, name')
      .limit(1)
      .single()
    
    return NextResponse.json({
      success: true,
      debug: {
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
        database: {
          connected: !testError,
          boardTableExists: !testError,
          testError: testError?.message || null,
          sampleAcademy: academy || null,
          academyError: academyError?.message || null
        },
        tables: tables || 'Unable to check table info',
        tablesError: tablesError || null
      }
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 })
  }
}