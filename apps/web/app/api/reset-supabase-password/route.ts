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
    // פרטי המשתמש לאיפוס
    const userEmail = 'test@example.com';
    const newPassword = 'Test1234!';
    
    // בדיקה אם המשתמש קיים
    const { data: users, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (searchError) {
      return NextResponse.json({
        success: false,
        message: 'שגיאה בחיפוש המשתמש',
        error: searchError
      }, { status: 500 });
    }
    
    const user = users.users.find(u => u.email === userEmail);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'המשתמש לא נמצא במערכת האימות של סופרבייס',
        createUserInstructions: 'גש ל-/api/fix-auth כדי ליצור את המשתמש'
      }, { status: 404 });
    }
    
    // איפוס הסיסמה
    const { data: updateResult, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword, email_confirm: true }
    );
    
    if (updateError) {
      return NextResponse.json({
        success: false,
        message: 'שגיאה באיפוס הסיסמה',
        error: updateError
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'הסיסמה אופסה בהצלחה',
      user: {
        id: user.id,
        email: user.email,
        last_sign_in: user.last_sign_in_at
      },
      loginCredentials: {
        email: userEmail,
        password: newPassword
      },
      instructions: [
        'נסה להתחבר עם פרטי ההתחברות הנ"ל',
        'המערכת משתמשת באימות של Supabase Auth',
        'לא נדרשת עמודת סיסמה בטבלת המשתמשים'
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