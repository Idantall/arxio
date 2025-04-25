import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

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
    // 1. בדיקה האם יש עמודת סיסמה בטבלה בשיטה פשוטה יותר
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);
    
    if (userError) {
      return NextResponse.json({
        success: false,
        message: 'שגיאה בבדיקת טבלת המשתמשים',
        error: userError
      }, { status: 500 });
    }
    
    // בדיקה אם יש עמודת password
    const userRecord = userData && userData.length > 0 ? userData[0] : null;
    const hasPasswordColumn = userRecord && 'password' in userRecord;
    
    let addColumnResult = null;
    
    // 2. אם אין עמודת סיסמה, עליך להוסיף אותה ידנית דרך ממשק הניהול של סופרבייס
    if (!hasPasswordColumn) {
      addColumnResult = {
        success: false,
        message: 'עמודת סיסמה חסרה בטבלת users!',
        whatToDo: [
          '1. פתח את לוח הבקרה של Supabase',
          '2. לך לטבלת "users"',
          '3. הוסף עמודה חדשה בשם "password" מסוג TEXT',
          '4. חזור לדף זה ורענן אותו'
        ]
      };
    }
    
    // 3. עדכון סיסמת המשתמש הקיים
    let passwordUpdateResult = null;
    
    if (hasPasswordColumn) {
      // בדיקה אם משתמש הבדיקה קיים
      const { data: testUser, error: findError } = await supabaseAdmin
        .from('users')
        .select('id, email, username')
        .eq('email', 'test@example.com')
        .single();
      
      if (findError && findError.code !== 'PGRST116') {
        return NextResponse.json({
          success: false,
          message: 'שגיאה בחיפוש משתמש הבדיקה',
          error: findError
        }, { status: 500 });
      }
      
      if (testUser) {
        // הצפנת הסיסמה
        const hashedPassword = await bcrypt.hash('Test1234!', 10);
        
        // עדכון רשומת המשתמש עם הסיסמה המוצפנת
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ password: hashedPassword })
          .eq('email', 'test@example.com');
        
        if (updateError) {
          passwordUpdateResult = {
            success: false,
            message: 'שגיאה בעדכון סיסמת המשתמש',
            error: updateError
          };
        } else {
          passwordUpdateResult = {
            success: true,
            message: 'סיסמת המשתמש עודכנה בהצלחה',
            email: 'test@example.com',
            password: 'Test1234!'
          };
        }
      } else {
        passwordUpdateResult = {
          success: false,
          message: 'משתמש הבדיקה לא נמצא'
        };
      }
    }
    
    // 4. בדיקת קיום משתמש במערכת האימות של סופרבייס
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    let authUserExists = false;
    if (!authError && authData) {
      authUserExists = authData.users.some(user => user.email === 'test@example.com');
    }
    
    return NextResponse.json({
      success: true,
      hasPasswordColumn,
      addColumnResult,
      passwordUpdateResult,
      authUserExists,
      testUser: {
        email: 'test@example.com',
        password: 'Test1234!'
      },
      nextSteps: [
        hasPasswordColumn 
          ? 'נסה להתחבר עם הפרטים הנ"ל'
          : 'הוסף עמודת password לטבלת users בסופרבייס ואז רענן דף זה'
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