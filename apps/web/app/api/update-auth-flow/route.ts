import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({
      success: false,
      message: 'פרטי התחברות לסופרבייס חסרים'
    }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // בדיקת פרטי משתמש הבדיקה במערכת האימות של סופרבייס
    const testUser = {
      email: 'test@example.com',
      password: 'Test1234!',
      username: 'testuser'
    };
    
    const { data: authList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      return NextResponse.json({
        success: false,
        message: 'שגיאה בקבלת רשימת משתמשים מסופרבייס',
        error: listError
      }, { status: 500 });
    }
    
    // בדיקה אם המשתמש קיים במערכת האימות
    let existingAuthUser = authList.users.find(user => user.email === testUser.email);
    
    let authActions = [];
    
    // אם המשתמש לא קיים, ניצור אותו
    if (!existingAuthUser) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          username: testUser.username
        }
      });
      
      if (createError) {
        authActions.push({
          action: 'create_user',
          status: 'failed',
          error: createError.message
        });
      } else {
        authActions.push({
          action: 'create_user',
          status: 'success',
          user: {
            id: newUser.user.id,
            email: newUser.user.email
          }
        });
        
        // המשתמש נוצר בהצלחה - נשתמש בו בהמשך
        existingAuthUser = newUser.user;
      }
    } else {
      // המשתמש קיים - ננסה לעדכן את הסיסמה שלו
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAuthUser.id,
        {
          password: testUser.password
        }
      );
      
      if (updateError) {
        authActions.push({
          action: 'update_password',
          status: 'failed',
          error: updateError.message
        });
      } else {
        authActions.push({
          action: 'update_password',
          status: 'success'
        });
      }
    }
    
    // בדיקה אם המשתמש קיים בטבלת users
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', testUser.email)
      .single();
    
    if (dbError && dbError.code !== 'PGRST116') {
      return NextResponse.json({
        success: false,
        message: 'שגיאה בבדיקת טבלת המשתמשים',
        error: dbError
      }, { status: 500 });
    }
    
    // אם המשתמש לא קיים בטבלת users או שה-ID שלו לא תואם למערכת האימות, נעדכן אותו
    if (!dbUser || (dbUser && existingAuthUser && dbUser.id !== existingAuthUser.id)) {
      const userData: any = {
        id: existingAuthUser?.id,
        email: testUser.email,
        username: testUser.username,
        updated_at: new Date().toISOString()
      };
      
      if (!dbUser) {
        userData.created_at = new Date().toISOString();
      }
      
      const { error: upsertError } = await supabaseAdmin
        .from('users')
        .upsert(userData);
      
      if (upsertError) {
        authActions.push({
          action: 'sync_db_user',
          status: 'failed',
          error: upsertError.message
        });
      } else {
        authActions.push({
          action: 'sync_db_user',
          status: 'success'
        });
      }
    }
    
    // איסוף ההסברים לעדכון מערכת האימות
    const authUpdateExplanation = [
      'המערכת צריכה להשתמש באימות של Supabase Auth באופן עקבי',
      'קובץ auth.ts כבר משתמש ב-supabase.auth.signInWithPassword, שזה הנכון',
      'וודא שטבלת users מסונכרנת עם מערכת האימות של סופרבייס (UUID זהה)',
      'השתמש בפונקציית syncUserWithUsersTable בקובץ auth.ts כדי לוודא סנכרון',
      'עמודת password בטבלת users לא משמשת לאימות ולכן לא חיונית',
    ];
    
    return NextResponse.json({
      success: true,
      message: 'בדיקת מערכת האימות הושלמה והמשתמש עודכן',
      authUser: existingAuthUser ? {
        id: existingAuthUser.id,
        email: existingAuthUser.email,
        last_sign_in: existingAuthUser.last_sign_in_at,
        created_at: existingAuthUser.created_at
      } : null,
      dbUser: dbUser || null,
      authActions,
      authUpdateExplanation,
      loginCredentials: {
        email: testUser.email,
        password: testUser.password
      },
      nextSteps: [
        'התחבר עם פרטי ההתחברות הנ"ל',
        'אם האימות נכשל, נסה להתחבר באמצעות טופס ההרשמה ולא טופס ההתחברות',
        'אם עדיין לא עובד, יש לבדוק את הלוגים בקונסולה כדי להבין את הסיבה'
      ],
      debugInfo: {
        nextauthUrl: process.env.NEXTAUTH_URL,
        nextauthSecret: process.env.NEXTAUTH_SECRET ? 'קיים' : 'חסר'
      }
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