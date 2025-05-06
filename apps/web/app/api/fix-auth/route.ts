import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { isValidUUID } from '@/lib/user-utils';
import { randomUUID } from 'crypto';

/**
 * API לתיקון בעיות אימות משתמשים
 * מאפשר יצירה או עדכון של רשומת משתמש עם קישור נכון בין NextAuth ל-Supabase
 */
export async function POST(req: NextRequest) {
  try {
    // קבלת המשתמש המחובר כרגע
    const session = await getServerSession();
    
    // קבלת הנתונים מהבקשה
    const data = await req.json();
    const { email, oldId } = data;
    
    console.log('מקבל בקשה לתיקון אימות:', { email, oldId, sessionUser: session?.user });
    
    if (!email) {
      return NextResponse.json({ 
        error: "נדרש אימייל לתיקון האימות" 
      }, { status: 400 });
    }
    
    // בדיקה אם המשתמש כבר קיים במערכת לפי אימייל
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .limit(1);
    
    // אם קיים משתמש, החזר אותו
    if (existingUsers && existingUsers.length > 0) {
      console.log('נמצא משתמש קיים:', existingUsers[0]);
      return NextResponse.json({ 
        message: "משתמש קיים במערכת",
        userId: existingUsers[0].id 
      });
    }
    
    // אם לא קיים משתמש, יצירת משתמש חדש
    const newUserId = isValidUUID(oldId || '') ? oldId : randomUUID();
    console.log('יוצר משתמש חדש עם מזהה:', newUserId);
    
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert([{
        id: newUserId,
        email: email.toLowerCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('שגיאה ביצירת משתמש:', error);
      return NextResponse.json({ 
        error: `שגיאה ביצירת משתמש: ${error.message}` 
      }, { status: 500 });
    }
    
    console.log('נוצר משתמש חדש:', newUser);
    return NextResponse.json({ 
      message: "נוצר משתמש חדש בהצלחה", 
      userId: newUser.id 
    });
    
  } catch (error) {
    console.error('שגיאה בתיקון אימות:', error);
    const message = error instanceof Error ? error.message : 'שגיאה בלתי צפויה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * עדכון טבלאות קשורות כאשר מחליפים מזהה משתמש
 */
async function updateRelatedTables(oldId: string, newId: string) {
  // רשימת טבלאות לעדכון ושדה המשתמש בהן
  const tables = [
    { name: 'projects', userField: 'user_id' },
    { name: 'scans', userField: 'user_id' },
    { name: 'user_settings', userField: 'user_id' },
    { name: 'licenses', userField: 'user_id' }
  ];
  
  for (const table of tables) {
    try {
      // בדיקה אם הטבלה קיימת
      const { error: checkError } = await supabaseAdmin
        .from(table.name)
        .select('id')
        .limit(1);
      
      // אם הטבלה לא קיימת, דלג
      if (checkError && checkError.message.includes('does not exist')) {
        console.log(`טבלה ${table.name} לא קיימת, מדלג`);
        continue;
      }
      
      // עדכון הרשומות
      const { error } = await supabaseAdmin
        .from(table.name)
        .update({ [table.userField]: newId })
        .eq(table.userField, oldId);
      
      if (error) {
        console.error(`שגיאה בעדכון טבלה ${table.name}:`, error);
      } else {
        console.log(`עודכנה טבלה ${table.name}`);
      }
    } catch (error) {
      console.error(`שגיאה בטיפול בטבלה ${table.name}:`, error);
    }
  }
}

/**
 * קבלת מידע על מצב האימות של המשתמש הנוכחי
 */
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'משתמש לא מחובר' },
        { status: 401 }
      );
    }
    
    const { id, email } = session.user;
    
    return NextResponse.json({
      success: true,
      user: {
        id,
        email,
        isAuthenticated: true
      }
    });
  } catch (error) {
    console.error('שגיאה בקבלת מידע על מצב אימות:', error);
    return NextResponse.json(
      { error: 'שגיאה בקבלת מידע על מצב אימות' },
      { status: 500 }
    );
  }
} 