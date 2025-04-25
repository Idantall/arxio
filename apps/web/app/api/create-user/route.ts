import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * נקודת קצה ליצירת משתמש חדש בסופאבייס.
 * הערה: זוהי נקודת קצה זמנית לצרכי פיתוח בלבד. 
 * יש להסיר אותה בסביבת הייצור.
 */
export async function POST(req: Request) {
  try {
    // בודק אם נמצאים בסביבת פיתוח
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        success: false,
        message: 'נקודת קצה זו זמינה רק בסביבת פיתוח'
      }, { status: 403 });
    }

    // לקבל את הנתונים מהבקשה
    const body = await req.json();
    const { email, password, username } = body;

    // וידוא שכל השדות הנדרשים קיימים
    if (!email || !password || !username) {
      return NextResponse.json({
        success: false,
        message: 'חסרים שדות חובה: אימייל, סיסמה ושם משתמש'
      }, { status: 400 });
    }

    // יצירת משתמש בסופאבייס Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // מאשר את האימייל אוטומטית
    });

    if (authError) {
      return NextResponse.json({
        success: false,
        message: 'שגיאה ביצירת משתמש בסופאבייס Auth',
        error: authError.message
      }, { status: 500 });
    }

    // יצירת רשומת משתמש בטבלת משתמשים
    const userId = authData.user.id;
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: userId,
          email,
          username,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);

    if (userError) {
      // אם נכשלנו ביצירת הרשומה בטבלת המשתמשים, ננסה למחוק את המשתמש מ-Auth
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      return NextResponse.json({
        success: false,
        message: 'שגיאה ביצירת רשומת משתמש',
        error: userError.message
      }, { status: 500 });
    }

    // החזרת תגובה מוצלחת
    return NextResponse.json({
      success: true,
      message: 'משתמש נוצר בהצלחה',
      userId,
      email,
      username
    });
  } catch (error) {
    console.error('שגיאה ביצירת משתמש:', error);
    return NextResponse.json({
      success: false,
      message: 'שגיאה לא צפויה',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 