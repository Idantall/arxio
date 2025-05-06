import { NextRequest, NextResponse } from 'next/server';
import { getUserIdByEmail, supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { isValidUUID } from '@/lib/user-utils';

/**
 * API Handler לקבלת מזהה משתמש לפי אימייל או מהסשן הנוכחי
 * משמש כדי לקשר בין מערכת האימות לזיהוי משתמש בסופאבייס
 */
export async function GET(req: NextRequest) {
  try {
    // בדיקת אימות: רק משתמש מחובר יכול לבקש פרטים
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
    }
    
    // קבלת האימייל מהפרמטרים (אופציונלי)
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get('email') || session.user.email;
    
    // אם חסר אימייל בסשן וגם לא סופק בבקשה
    if (!email) {
      return NextResponse.json({ error: "לא נמצא אימייל" }, { status: 400 });
    }
    
    // בדיקה שהמשתמש מבקש מידע על עצמו או שהוא מנהל
    if (email.toLowerCase() !== session.user.email?.toLowerCase()) {
      // בעתיד אפשר להוסיף כאן בדיקה אם המשתמש הוא מנהל
      return NextResponse.json({ error: "אין הרשאה לצפות במידע של משתמשים אחרים" }, { status: 403 });
    }
    
    // אם יש כבר מזהה בסשן, נבדוק את התקינות שלו
    if (session.user.id) {
      // האם זה UUID תקני
      const validUUID = isValidUUID(session.user.id);
      
      // בדיקה אם המזהה קיים בטבלת משתמשים בסופאבייס
      const { data: userExists } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();
      
      // אם המזהה תקין וקיים, נחזיר אותו
      if (validUUID && userExists) {
        return NextResponse.json({ 
          userId: session.user.id,
          email: email,
          valid: true
        });
      }
      
      // אחרת, נציין שיש מזהה אבל הוא לא תקין או לא קיים
      return NextResponse.json({ 
        userId: session.user.id,
        email: email,
        valid: false,
        needFix: true,
        reason: !validUUID ? "מזהה לא תקני" : "משתמש לא קיים בבסיס הנתונים"
      });
    }
    
    // חיפוש המזהה לפי אימייל
    const userId = await getUserIdByEmail(email);
    
    if (!userId) {
      return NextResponse.json({ 
        error: "לא נמצא משתמש עם האימייל המבוקש",
        email: email,
        needFix: true
      }, { status: 404 });
    }
    
    // החזרת המזהה
    return NextResponse.json({ 
      userId: userId,
      email: email,
      valid: true,
      sessionId: session.user.id || 'אין'
    });
  } catch (error) {
    console.error('שגיאה בקבלת מזהה משתמש:', error);
    return NextResponse.json(
      { error: "אירעה שגיאה בעיבוד הבקשה" },
      { status: 500 }
    );
  }
} 