import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // בדיקת הגדרות הסביבה
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        message: 'Missing Supabase environment variables',
        env: {
          hasUrl: !!supabaseUrl,
          hasAnonKey: !!supabaseKey,
          hasServiceKey: !!supabaseServiceKey
        }
      }, { status: 500 });
    }

    // בדיקת חיבור לסופאבייס
    const connectionTest = await supabaseAdmin.from('users').select('count').limit(1);
    
    let tableInfo: Record<string, string> = {};
    let userCount = 0;
    let projectCount = 0;
    let sampleUser = null;
    
    // בדיקת מבנה טבלת משתמשים
    const { data: usersTable, error: usersTableError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);
      
    if (!usersTableError) {
      const { data: usersCountData, error: usersCountError } = await supabaseAdmin
        .from('users')
        .select('count');
      
      if (!usersCountError && usersCountData.length > 0) {
        userCount = usersCountData[0].count;
      }
      
      // קבלת דוגמת משתמש אם יש
      if (userCount > 0) {
        const { data: oneUser, error: oneUserError } = await supabaseAdmin
          .from('users')
          .select('*')
          .limit(1)
          .single();
          
        if (!oneUserError) {
          sampleUser = oneUser;
        }
      }
      
      tableInfo.users = usersTable.length > 0 
        ? Object.keys(usersTable[0]).join(', ') 
        : 'טבלה ריקה';
    }
    
    // בדיקת טבלת פרויקטים
    const { data: projectsTable, error: projectsTableError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .limit(1);
      
    if (!projectsTableError) {
      const { data: projectsCountData, error: projectsCountError } = await supabaseAdmin
        .from('projects')
        .select('count');
      
      if (!projectsCountError && projectsCountData.length > 0) {
        projectCount = projectsCountData[0].count;
      }
      
      tableInfo.projects = projectsTable.length > 0 
        ? Object.keys(projectsTable[0]).join(', ') 
        : 'טבלה ריקה';
    } else {
      tableInfo.projects = `שגיאה: ${projectsTableError.message}`;
    }
    
    // בדיקת התצורה של NextAuth
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    const githubId = process.env.GITHUB_CLIENT_ID;
    const githubSecret = process.env.GITHUB_CLIENT_SECRET;
    
    return NextResponse.json({
      success: true,
      connectionStatus: connectionTest.error ? 'כישלון' : 'הצלחה',
      connectionError: connectionTest.error,
      counts: {
        users: userCount,
        projects: projectCount
      },
      tableInfo,
      sampleUser,
      config: {
        supabaseUrl,
        hasAnonKey: !!supabaseKey,
        hasServiceKey: !!supabaseServiceKey,
        nextAuthUrl,
        hasNextAuthSecret: !!nextAuthSecret,
        hasGithubId: !!githubId,
        hasGithubSecret: !!githubSecret
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      message: 'שגיאה בבדיקת סופאבייס',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 