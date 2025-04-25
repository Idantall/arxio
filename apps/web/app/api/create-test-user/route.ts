import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function GET() {
  // בדיקת קיום פרטי ההתחברות
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({
      success: false,
      message: 'פרטי התחברות ל-Supabase חסרים',
      environment: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'נמצא' : 'חסר',
        SUPABASE_SERVICE_KEY: supabaseServiceKey ? 'נמצא' : 'חסר'
      }
    }, { status: 500 });
  }

  // יצירת לקוח Supabase עם מפתח השירות (הרשאות מלאות)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // פרטי משתמש הבדיקה
    const testUser = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Test123!'
    };
    
    // בדיקה אם המשתמש כבר קיים
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', testUser.email)
      .single();
    
    if (userError && userError.code !== 'PGRST116') { // לא נמצא משתמש
      return NextResponse.json({
        success: false,
        message: 'שגיאה בבדיקת קיום המשתמש',
        error: userError
      }, { status: 500 });
    }
    
    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'משתמש בדיקה כבר קיים',
        user: {
          email: existingUser.email,
          id: existingUser.id
        },
        loginCredentials: {
          email: testUser.email,
          password: testUser.password
        }
      });
    }
    
    // הכנת הסיסמה המוצפנת
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    
    // יצירת המשתמש בטבלת users
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email: testUser.email,
          username: testUser.username,
          password: hashedPassword,
          emailVerified: new Date().toISOString(), // מסמן שהמייל אומת כבר
        }
      ])
      .select('id, email, username')
      .single();
    
    if (createError) {
      return NextResponse.json({
        success: false,
        message: 'שגיאה ביצירת משתמש בדיקה',
        error: createError
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'משתמש בדיקה נוצר בהצלחה',
      user: newUser,
      loginCredentials: {
        email: testUser.email,
        password: testUser.password
      }
    });
  } catch (error) {
    console.error('שגיאה ביצירת משתמש בדיקה:', error);
    return NextResponse.json({
      success: false,
      message: 'שגיאה לא צפויה ביצירת משתמש בדיקה',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 