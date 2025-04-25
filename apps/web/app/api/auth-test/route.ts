import { NextResponse } from 'next/server';
import { signIn as supabaseSignIn } from '../../../lib/supabase';
import { auth } from '../../../lib/auth';

export async function GET() {
  try {
    const testEmail = 'test@example.com';
    const testPassword = 'Password123!';
    
    console.log('בדיקת התחברות ישירה דרך Supabase');
    
    try {
      const supabaseResult = await supabaseSignIn(testEmail, testPassword);
      console.log('תוצאת התחברות Supabase:');
      console.log(`- משתמש: ${supabaseResult?.user?.id || 'לא נמצא'}`);
      console.log(`- אימייל: ${supabaseResult?.user?.email || 'לא נמצא'}`);
      console.log(`- סשן: ${supabaseResult?.session?.access_token ? 'קיים' : 'לא קיים'}`);
      
      // בדיקת סביבה
      const env = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
        nextAuthSecret: process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL
      };
      
      return NextResponse.json({ 
        success: true, 
        supabaseAuth: {
          userId: supabaseResult?.user?.id,
          email: supabaseResult?.user?.email,
          hasSession: !!supabaseResult?.session,
        },
        availableUsers: [
          { email: 'test@example.com', password: 'Password123!' },
          { email: 'admin@example.com', password: 'Password123!' },
          { email: 'admin2@example.com', password: 'Password123!' }
        ],
        environment: env
      });
    } catch (error) {
      console.error('שגיאת התחברות Supabase:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'שגיאת התחברות Supabase',
        errorDetails: error instanceof Error ? error.message : String(error),
        availableUsers: [
          { email: 'test@example.com', password: 'Password123!' },
          { email: 'admin@example.com', password: 'Password123!' }, 
          { email: 'admin2@example.com', password: 'Password123!' }
        ],
      }, { status: 500 });
    }
  } catch (error) {
    console.error('שגיאה לא צפויה:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'שגיאה לא צפויה בבדיקת התחברות',
      errorDetails: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 