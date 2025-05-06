import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// יצירת חיבור ל-Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// פונקציה לתיקון שמות השדות 
async function fixColumnNames() {
  try {
    // בדיקה אם שדה scan_type קיים
    const { data: scanTypeExists, error: checkError } = await supabase
      .rpc('pgql', {
        query: `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'scan_queue' AND column_name = 'scan_type'
        `
      });

    if (checkError) {
      console.error('שגיאה בבדיקת שם עמודה:', checkError);
      return false;
    }

    // אם scan_type קיים, נשנה אותו ל-type
    if (scanTypeExists && scanTypeExists.length > 0) {
      console.log('נמצא עמודה בשם scan_type, מתקן ל-type');
      
      // נבדוק אם גם type קיים (כדי למנוע התנגשות)
      const { data: typeExists, error: typeCheckError } = await supabase
        .rpc('pgql', {
          query: `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'scan_queue' AND column_name = 'type'
          `
        });
        
      if (typeCheckError) {
        console.error('שגיאה בבדיקת קיום עמודת type:', typeCheckError);
        return false;
      }
      
      // אם type כבר קיים, לא מבצעים את השינוי
      if (typeExists && typeExists.length > 0) {
        console.log('עמודת type כבר קיימת, לא מבצע שינוי');
        return true;
      }
      
      // ביצוע השינוי
      const { error: alterError } = await supabase
        .rpc('pgql', {
          query: `
            ALTER TABLE scan_queue RENAME COLUMN scan_type TO type;
          `
        });

      if (alterError) {
        console.error('שגיאה בשינוי שם עמודה:', alterError);
        return false;
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('שגיאה בתיקון שמות עמודות:', error);
    return false;
  }
}

export async function GET() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'חסרים פרטי התחברות ל-Supabase' }, { status: 500 });
  }

  try {
    // בדיקה ותיקון שמות עמודות אם צריך
    const fixResult = await fixColumnNames();
    
    // קבלת כל הרשומות בתור
    const { data: queueItems, error } = await supabase
      .from('scan_queue')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('שגיאה בקבלת תור סריקות:', error);
      return NextResponse.json(
        { error: 'שגיאה בקבלת תור סריקות', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      fixResult,
      queueItems: queueItems || []
    });
  } catch (error) {
    console.error('שגיאה כללית בקבלת תור סריקות:', error);
    return NextResponse.json(
      { error: 'שגיאה כללית בקבלת תור סריקות', details: String(error) },
      { status: 500 }
    );
  }
} 