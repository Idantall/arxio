// יצירת פונקציה ליצירת סריקות לדוגמה לכל משתמש
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// הגדרת החיבור ל-Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * פונקציה ליצירת סריקות דוגמה עבור משתמש ו/או פרויקט
 * @param userId מזהה המשתמש
 * @param projectId מזהה הפרויקט (אופציונלי)
 * @returns הצלחה או כישלון
 */
export async function createExampleScans(userId: string, projectId?: string) {
  try {
    console.log(`יוצר סריקות דוגמה למשתמש ${userId}${projectId ? ` ולפרויקט ${projectId}` : ''}`);
    
    // בדיקת תקינות הפרמטרים
    if (!userId) {
      console.error('חסר מזהה משתמש עבור יצירת סריקות דוגמה');
      throw new Error('חסר מזהה משתמש עבור יצירת סריקות דוגמה');
    }
    
    // בדיקת החיבור לסופאבייס
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('חסרים פרטי התחברות ל-Supabase');
      throw new Error('חסרים פרטי התחברות ל-Supabase עבור יצירת סריקות דוגמה');
    }
    
    // בדיקה שטבלת הסריקות קיימת
    try {
      const { error: tableError } = await supabase
        .from('scans')
        .select('id')
        .limit(1);
        
      if (tableError && tableError.message.includes('does not exist')) {
        console.error('טבלת scans לא קיימת, לא ניתן ליצור סריקות דוגמה');
        throw new Error('טבלת scans לא קיימת, נא ליצור את הטבלאות הדרושות תחילה');
      }
    } catch (tableCheckError) {
      console.error('שגיאה בבדיקת טבלת הסריקות:', tableCheckError);
      throw new Error('שגיאה בבדיקת טבלת הסריקות');
    }
    
    // רשימת סריקות לדוגמה - מגוון סוגים ותוצאות
    const exampleScans = [
      {
        name: "סריקת אבטחה SAST לדוגמה",
        type: "SAST",
        target: "https://github.com/example/nodejs-app",
        status: "completed",
        results: {
          vulnerabilities: [
            { severity: "high", title: "חשיפת מידע רגיש", description: "נמצא מידע רגיש בקוד המקור" },
            { severity: "medium", title: "שימוש בספרייה מיושנת", description: "נמצאה ספריית npm פגיעה" }
          ],
          summary: { high: 1, medium: 1, low: 0 }
        }
      },
      {
        name: "סריקת DAST לדוגמה",
        type: "DAST",
        target: "https://example.com/app",
        status: "completed",
        results: {
          vulnerabilities: [
            { severity: "critical", title: "SQL Injection", description: "נמצאה פגיעות SQL Injection בטופס החיפוש" },
            { severity: "high", title: "XSS", description: "נמצאה פגיעות Cross-Site Scripting" },
            { severity: "low", title: "חוסר HTTPS", description: "חלק מהדפים אינם משתמשים ב-HTTPS" }
          ],
          summary: { critical: 1, high: 1, medium: 0, low: 1 }
        }
      },
      {
        name: "סריקת תלויות לדוגמה",
        type: "DEPS",
        target: "package.json",
        status: "completed",
        results: {
          vulnerabilities: [
            { severity: "high", title: "חולשה ב-lodash", description: "גרסת lodash פגיעה להתקפת Prototype Pollution" },
            { severity: "medium", title: "חולשה ב-axios", description: "גרסת axios פגיעה לחשיפת מידע" }
          ],
          summary: { high: 1, medium: 1, low: 0 }
        }
      }
    ];
    
    // יצירת הסריקות לדוגמה בבסיס הנתונים
    const currentTime = new Date().toISOString();
    const scanInserts = exampleScans.map(scan => ({
      id: randomUUID(),
      name: scan.name,
      type: scan.type,
      target: scan.target,
      status: scan.status,
      user_id: userId,
      project_id: projectId,
      created_at: currentTime,
      updated_at: currentTime,
      results: scan.results,
      is_example: true
    }));
    
    console.log(`מנסה להכניס ${scanInserts.length} סריקות דוגמה לבסיס הנתונים`);
    
    // הכנסת כל הסריקות בקריאה אחת
    const { data, error } = await supabase
      .from("scans")
      .insert(scanInserts);
    
    if (error) {
      console.error(`שגיאה ביצירת סריקות לדוגמה: ${error.message}`, error);
      throw new Error(`שגיאה ביצירת סריקות לדוגמה: ${error.message}`);
    }
    
    console.log(`נוצרו ${scanInserts.length} סריקות דוגמה בהצלחה`);
    return true;
  } catch (error) {
    console.error("שגיאה ביצירת סריקות לדוגמה:", error);
    
    // החזרת false במקום לזרוק שגיאה כדי לא לעצור את זרימת העבודה הרגילה
    return false;
  }
} 