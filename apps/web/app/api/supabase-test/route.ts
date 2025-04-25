import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  // בדיקת קיום פרטי ההתחברות
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      success: false,
      message: 'פרטי התחברות ל-Supabase חסרים',
      environment: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'נמצא' : 'חסר',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? 'נמצא' : 'חסר',
        SUPABASE_SERVICE_KEY: supabaseServiceKey ? 'נמצא' : 'חסר',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'לא מוגדר',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'נמצא' : 'חסר'
      }
    }, { status: 500 });
  }

  // יצירת לקוח Supabase עם מפתח אנונימי (ללא הרשאות מיוחדות)
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // בדיקת חיבור פשוטה - ניסיון לבצע שאילתה בסיסית
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' });
    
    if (error) {
      let errorMessage = 'שגיאה בחיבור ל-Supabase';
      let suggestion = '';
      
      // טיפול בשגיאות נפוצות
      if (error.code === '42P01') { // טבלה לא קיימת
        errorMessage = 'טבלת "users" לא קיימת במסד הנתונים';
        suggestion = 'יש ליצור את הטבלאות הנדרשות במסד הנתונים של Supabase';
      } else if (error.code === '42501') { // בעיית הרשאות
        errorMessage = 'אין הרשאות מתאימות לגישה לטבלת "users"';
        suggestion = 'יש לבדוק את ה-Row Level Security והפוליסות בטבלאות';
      }
      
      return NextResponse.json({
        success: false,
        message: errorMessage,
        suggestion,
        error,
        environment: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'נמצא' : 'חסר',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? 'נמצא' : 'חסר',
          SUPABASE_SERVICE_KEY: supabaseServiceKey ? 'נמצא' : 'חסר',
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'לא מוגדר',
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'נמצא' : 'חסר'
        }
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'החיבור ל-Supabase תקין',
      userCount: count,
      environment: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'נמצא' : 'חסר',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? 'נמצא' : 'חסר',
        SUPABASE_SERVICE_KEY: supabaseServiceKey ? 'נמצא' : 'חסר',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'לא מוגדר',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'נמצא' : 'חסר'
      }
    });
  } catch (error) {
    console.error('שגיאה בבדיקת החיבור ל-Supabase:', error);
    return NextResponse.json({
      success: false,
      message: 'שגיאה לא צפויה בבדיקת החיבור ל-Supabase',
      error: error instanceof Error ? error.message : String(error),
      environment: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'נמצא' : 'חסר',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? 'נמצא' : 'חסר',
        SUPABASE_SERVICE_KEY: supabaseServiceKey ? 'נמצא' : 'חסר',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'לא מוגדר',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'נמצא' : 'חסר'
      }
    }, { status: 500 });
  }
} 