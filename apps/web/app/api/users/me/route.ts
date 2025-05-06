import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { randomUUID } from 'crypto';

// יצירת חיבור ל-Supabase עם הרשאת service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('חסרים פרטי התחברות ל-Supabase עבור service role');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * נקודת קצה API להחזרת נתוני המשתמש המחובר
 * מקבלת את המזהה מהסשן ומחזירה את נתוני המשתמש מטבלת users
 */
export async function GET(request: Request) {
  try {
    console.log('התקבלה בקשת GET למידע על המשתמש הנוכחי');
    
    // קבלת פרטי המשתמש מהסשן
    const session = await getServerSession();
    
    if (!session?.user) {
      console.log('אין משתמש מחובר בסשן');
      return NextResponse.json(
        { error: 'משתמש לא מחובר' },
        { status: 401 }
      );
    }
    
    const { id, email } = session.user;
    console.log('התקבל משתמש מהסשן:', { id, email });
    
    if (!email) {
      return NextResponse.json(
        { error: 'חסר אימייל בסשן המשתמש' },
        { status: 400 }
      );
    }
    
    // חיפוש המשתמש לפי מזהה או אימייל
    let userData = null;
    
    // ניסיון 1: חיפוש לפי UUID (מזהה של next-auth)
    if (id) {
      try {
        const { data: userById, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (!error && userById) {
          console.log('משתמש נמצא לפי מזהה:', userById);
          userData = userById;
        } else if (error) {
          console.log('שגיאה בחיפוש לפי מזהה:', error.message);
        }
      } catch (error) {
        console.error('שגיאה בחיפוש משתמש לפי מזהה:', error);
      }
    }
    
    // ניסיון 2: חיפוש לפי אימייל (אם לא נמצא לפי מזהה)
    if (!userData) {
      try {
        const { data: userByEmail, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase())
          .maybeSingle();
        
        if (!error && userByEmail) {
          console.log('משתמש נמצא לפי אימייל:', userByEmail);
          userData = userByEmail;
        } else {
          console.log('משתמש לא נמצא גם לפי אימייל, או שהייתה שגיאה:', error?.message);
        }
      } catch (error) {
        console.error('שגיאה בחיפוש משתמש לפי אימייל:', error);
      }
    }
    
    // ניסיון 3: אם לא נמצא משתמש, ניצור אחד חדש
    if (!userData) {
      try {
        console.log('משתמש לא נמצא, יוצר משתמש חדש עם מזהה מהסשן');
        
        // יצירת מזהה חדש אם אין מזהה בסשן
        const userId = id || randomUUID();
        
        // יצירת משתמש חדש בטבלת users
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: email.toLowerCase(),
            plan: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (insertError) {
          console.error('שגיאה ביצירת משתמש חדש בטבלת users:', insertError);
          // אם יש בעיה ביצירה, נחזיר את המידע הבסיסי
          return NextResponse.json({
            id: userId,
            email: email,
            plan: 'free',
            scans_this_month: 0,
            active_scans: 0,
            isFromSession: true,
            error: insertError.message
          });
        } else if (newUser) {
          console.log('נוצר משתמש חדש בטבלה:', newUser);
          userData = newUser;
        }
      } catch (createError) {
        console.error('שגיאה ביצירת משתמש:', createError);
        // במקרה של שגיאה, נחזיר את המידע הבסיסי
        return NextResponse.json({
          id: id || randomUUID(),
          email: email,
          plan: 'free',
          scans_this_month: 0,
          active_scans: 0,
          isFromSession: true,
          createError: true
        });
      }
    }
    
    if (!userData) {
      console.log('לא נמצא משתמש בשום מקום, מחזיר תשובה בסיסית עם מזהה מהסשן');
      
      // אם לא נמצא משתמש בשום מקום, מחזירים את הנתונים מהסשן
      return NextResponse.json({
        id: id,
        email: email,
        plan: 'free',
        scans_this_month: 0,
        active_scans: 0,
        isFromSession: true
      });
    }
    
    // החזרת נתוני המשתמש שנמצאו
    return NextResponse.json(userData);
  
  } catch (error) {
    console.error('שגיאה כללית בקבלת נתוני משתמש:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת בקבלת נתוני משתמש' },
      { status: 500 }
    );
  }
} 