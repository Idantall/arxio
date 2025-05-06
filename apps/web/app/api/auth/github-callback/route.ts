import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createClient } from '@supabase/supabase-js';

/**
 * נקודת קצה לטיפול ב־callback לאחר התחברות GitHub
 * מבצעת גם תיקון אימות אוטומטי באמצעות API הקיים
 */
export async function GET(req: NextRequest) {
  try {
    // קבלת ה-session הנוכחי לבדיקה אם המשתמש מחובר
    const session = await getServerSession();
    
    // אם המשתמש לא מחובר, מחזירים שגיאה
    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/login?error=callback_failed', req.url));
    }
    
    // ניסיון לתקן את האימות באמצעות API הקיים
    try {
      const fixAuthResponse = await fetch(new URL('/api/fix-auth', req.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          oldId: session.user.id,
        }),
      });
      
      if (fixAuthResponse.ok) {
        console.log('תיקון אימות אוטומטי הושלם בהצלחה לאחר התחברות GitHub');
      } else {
        console.error('שגיאה בתיקון אימות אוטומטי לאחר התחברות GitHub');
      }
    } catch (fixError) {
      console.error('שגיאה לא צפויה בתיקון אימות אוטומטי:', fixError);
    }
    
    // הפניה לדף הבקרה
    return NextResponse.redirect(new URL('/dashboard', req.url));
  } catch (error) {
    console.error('שגיאה לא צפויה בתהליך callback GitHub:', error);
    return NextResponse.redirect(new URL('/auth/login?error=unknown_error', req.url));
  }
} 