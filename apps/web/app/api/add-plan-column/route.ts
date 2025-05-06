import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// יצירת חיבור ל-Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('חסרים פרטי התחברות ל-Supabase');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST() {
  try {
    console.log('הוספת עמודת plan לטבלת users...');
    
    // בדיקה אם הטבלה קיימת
    const { data: tableExists, error: tableError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.message.includes('relation "users" does not exist')) {
      return NextResponse.json({ error: 'טבלת users לא קיימת' }, { status: 404 });
    }
    
    try {
      // ניסיון להוסיף את העמודה ישירות
      const query = `
        ALTER TABLE public.users 
        ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' NOT NULL;
      `;
      
      // שימוש ב-PostgreSQL RAW Query (ישירות מסופאבייס)
      const { error: alterError } = await supabase.rpc('exec_sql', { query });
      
      if (alterError) {
        // אם יש שגיאה שהפונקציה לא קיימת, ננסה גישה אחרת
        if (alterError.message.includes('function "exec_sql" does not exist')) {
          // בדיקה אם כבר יש עמודת plan
          try {
            const { data, error: selectError } = await supabase
              .from('users')
              .select('plan')
              .limit(1);
            
            // אם אין שגיאה, סימן שהעמודה כבר קיימת
            if (!selectError) {
              return NextResponse.json({ 
                success: true, 
                message: 'עמודת plan כבר קיימת' 
              });
            }
            
            // אם יש שגיאה שהעמודה לא קיימת
            if (selectError.message.includes('column "plan" does not exist')) {
              return NextResponse.json({ 
                error: 'לא ניתן להוסיף את העמודה באמצעות API זה, נא להשתמש בכלי ניהול ישיר של Supabase' 
              }, { status: 500 });
            }
          } catch (e) {
            console.error('שגיאה בבדיקת קיום עמודת plan:', e);
          }
        }
        
        console.error('שגיאה בהוספת עמודת plan:', alterError);
        return NextResponse.json({ error: `שגיאה בהוספת עמודת plan: ${alterError.message}` }, { status: 500 });
      }
      
      // בדיקה שהעמודה אכן נוספה
      const { error: checkError } = await supabase
        .from('users')
        .select('plan')
        .limit(1);
      
      if (checkError) {
        console.error('שגיאה בבדיקת הוספת עמודת plan:', checkError);
        return NextResponse.json({ 
          error: `שגיאה בבדיקת הוספת עמודת plan: ${checkError.message}` 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'עמודת plan נוספה בהצלחה' 
      });
    } catch (error) {
      console.error('שגיאה כללית בהוספת עמודת plan:', error);
      return NextResponse.json({ 
        error: `שגיאה כללית בהוספת עמודת plan: ${error instanceof Error ? error.message : String(error)}` 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('שגיאה כללית:', error);
    return NextResponse.json({ 
      error: `שגיאה כללית: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 