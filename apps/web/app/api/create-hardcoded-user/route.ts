import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// משתמש מוקשח - שנה את הפרטים לפי הצורך
const HARDCODED_USER = {
  email: 'test@example.com',
  password: 'Test123!',
  name: 'משתמש בדיקה'
};

export async function GET() {
  try {
    // יצירת המשתמש בשירות האימות של סופאבייס
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: HARDCODED_USER.email,
      password: HARDCODED_USER.password,
      email_confirm: true, // מאשר את האימייל אוטומטית
    });

    if (authError) {
      return NextResponse.json({
        success: false,
        message: 'Failed to create auth user',
        error: authError
      }, { status: 500 });
    }

    // בדיקה אם המשתמש כבר קיים בטבלת משתמשים
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', HARDCODED_USER.email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = לא נמצא
      return NextResponse.json({
        success: false,
        message: 'Error checking for existing user',
        error: checkError
      }, { status: 500 });
    }

    // אם המשתמש כבר קיים בטבלת users
    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists in users table',
        user: {
          auth: authUser,
          db: existingUser
        }
      });
    }

    // יצירת רשומה בטבלת המשתמשים
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: authUser.user.id, // חשוב - להשתמש באותו ID מהאימות
          email: HARDCODED_USER.email,
          name: HARDCODED_USER.name,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({
        success: false,
        message: 'Created auth user but failed to create DB user',
        error: dbError,
        authUser
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully created hardcoded user',
      user: {
        auth: authUser,
        db: dbUser
      },
      loginDetails: {
        email: HARDCODED_USER.email,
        password: HARDCODED_USER.password
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 