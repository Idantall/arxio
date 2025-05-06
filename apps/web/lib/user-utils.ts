import { supabaseAdmin } from './supabase';

/**
 * פונקציית עזר לתיקון בעיות אימות
 * שולחת בקשה לנקודת הקצה fix-auth כדי לשייך משתמש נוכחי למשתמש סופאבייס
 */
export async function fixAuthIssues(email?: string) {
  try {
    console.log('מנסה לתקן בעיות אימות...');
    const response = await fetch('/api/fix-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('שגיאה בתיקון בעיות אימות:', errorData);
      throw new Error(errorData.error || 'שגיאה בלתי צפויה בתיקון אימות');
    }

    const result = await response.json();
    console.log('תוצאות תיקון אימות:', result);
    return result;
  } catch (error) {
    console.error('שגיאה לא מטופלת בתיקון אימות:', error);
    throw error;
  }
}

/**
 * בדיקה אם משתמש קיים בטבלת המשתמשים לפי מזהה
 */
export async function checkUserExists(userId: string) {
  if (!userId) return false;
  
  try {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    return !!data;
  } catch (error) {
    console.error('שגיאה בבדיקת קיום משתמש:', error);
    return false;
  }
}

/**
 * לקבלת פרטי משתמש לפי מזהה
 */
export async function getUserById(userId: string) {
  if (!userId || !isValidUUID(userId)) {
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('שגיאה בחיפוש משתמש לפי מזהה:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('שגיאה לא צפויה בקבלת משתמש לפי מזהה:', error);
    return null;
  }
}

/**
 * בדיקת תקינות מזהה UUID - גרסה משופרת
 * הפונקציה סלחנית יותר כדי לטפל במזהים שונים של NextAuth וסופאבייס
 */
export const isValidUUID = (id: string): boolean => {
  if (!id) return false;
  
  // קודם בודקים אם זה UUID תקני
  const standardUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (standardUuidRegex.test(id)) {
    return true;
  }
  
  // בדיקה חלופית: אם זה לפחות מחרוזת ארוכה ללא רווחים (לאפשר Auth0/Firebase IDs)
  if (id.length >= 20 && !id.includes(' ')) {
    console.log(`מזהה ${id} לא UUID תקני אבל נראה תקין מספיק`);
    return true;
  }
  
  // בדיקה חלופית נוספת: UUID ללא מקפים (לפעמים מתקבל כך)
  const uuidWithoutHyphens = /^[0-9a-f]{32}$/i;
  if (uuidWithoutHyphens.test(id)) {
    console.log(`מזהה ${id} הוא UUID ללא מקפים`);
    return true;
  }
  
  return false;
};

/**
 * פונקציה לאיתור משתמש לפי אימייל 
 */
export async function getUserByEmail(email: string) {
  if (!email) {
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('שגיאה בחיפוש משתמש לפי אימייל:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('שגיאה לא צפויה בקבלת משתמש לפי אימייל:', error);
    return null;
  }
}

/**
 * וידוא קיום משתמש במערכת
 */
export async function ensureUserExists(userId: string, email?: string) {
  if (!userId || !isValidUUID(userId)) {
    console.error('מזהה משתמש חסר או לא תקין');
    return null;
  }

  try {
    // בדיקה אם המשתמש קיים
    const user = await getUserById(userId);
    
    if (user) {
      return user;
    }
    
    // אם המשתמש לא קיים, ננסה ליצור אותו
    console.log(`יוצר משתמש חדש עם מזהה: ${userId}`);
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([{
        id: userId,
        email: email || `user_${userId.substring(0, 8)}@example.com`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .maybeSingle();
      
    if (error) {
      console.error('שגיאה ביצירת משתמש:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('שגיאה לא צפויה בוידוא קיום משתמש:', error);
    return null;
  }
} 