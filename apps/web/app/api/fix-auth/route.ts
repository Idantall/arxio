import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function GET() {
  // פרטי התחברות לסופרבייס
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({
      success: false,
      message: 'פרטי התחברות לסופרבייס חסרים'
    }, { status: 500 });
  }

  // יצירת לקוח סופרבייס עם הרשאות אדמין
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // פרטי משתמש הבדיקה
    const testUser = {
      email: 'test@example.com',
      password: 'Test1234!',
      username: 'testuser'
    };
    
    // בדיקה 1: האם המשתמש קיים בטבלת המשתמשים
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', testUser.email)
      .single();
    
    if (dbError && dbError.code !== 'PGRST116') {
      return NextResponse.json({
        success: false,
        message: 'שגיאה בבדיקת טבלת משתמשים',
        error: dbError
      }, { status: 500 });
    }
    
    // בדיקה 2: האם המשתמש קיים במערכת האימות של סופרבייס
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      return NextResponse.json({
        success: false,
        message: 'שגיאה בבדיקת מערכת האימות',
        error: authError
      }, { status: 500 });
    }
    
    const authUser = authData.users.find(user => user.email === testUser.email);
    
    // בדיקת מצב: תיקון בהתאם
    let fixActions = [];
    let authUserCreated = false;
    
    // אם המשתמש לא קיים במערכת האימות של סופרבייס, ניצור אותו
    if (!authUser) {
      const { data: newAuth, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          username: testUser.username
        }
      });
      
      if (createError) {
        fixActions.push({
          action: 'create_auth_user',
          status: 'failed',
          error: createError.message
        });
      } else {
        authUserCreated = true;
        fixActions.push({
          action: 'create_auth_user',
          status: 'success',
          user_id: newAuth.user.id
        });
      }
    }
    
    // אם המשתמש לא קיים בטבלת המשתמשים או אם יצרנו משתמש חדש במערכת האימות
    if (!dbUser || authUserCreated) {
      // אם יצרנו משתמש חדש, נשתמש ב-ID שלו, אחרת נשתמש ב-ID של המשתמש הקיים
      const userId = authUserCreated 
        ? fixActions.find(a => a.action === 'create_auth_user')?.user_id 
        : authUser?.id;
      
      if (userId) {
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .upsert({
            id: userId,
            email: testUser.email,
            username: testUser.username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          fixActions.push({
            action: 'create_db_user',
            status: 'failed',
            error: insertError.message
          });
        } else {
          fixActions.push({
            action: 'create_db_user',
            status: 'success',
            user_id: userId
          });
        }
      }
    }
    
    // תוצאות הבדיקה והתיקון
    return NextResponse.json({
      success: true,
      dbUserExists: !!dbUser,
      authUserExists: !!authUser,
      dbUser: dbUser || null,
      authUser: authUser ? {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        last_sign_in: authUser.last_sign_in_at,
        user_metadata: authUser.user_metadata
      } : null,
      fixActions,
      loginCredentials: {
        email: testUser.email,
        password: testUser.password
      },
      loginInstructions: [
        'המערכת משתמשת באימות של Supabase Auth ולא בסיסמה מטבלת המשתמשים',
        'התחבר עם הפרטים לעיל',
        'אם עדיין לא מצליח, בדוק את לוגיקת האימות בקובץ lib/auth.ts'
      ]
    });
    
  } catch (error) {
    console.error('שגיאה לא צפויה:', error);
    return NextResponse.json({
      success: false,
      message: 'שגיאה לא צפויה',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 