import { NextResponse } from 'next/server';
import { signUp } from '@/lib/supabase';
import { userRegistrationSchema } from '@arxio/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // וידוא תקינות הנתונים
    const validationResult = userRegistrationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'נתונים לא תקינים', errors: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { email, password, name } = validationResult.data;
    
    // הרשמה באמצעות Supabase
    const { user, session } = await signUp(email, password, { name });
    
    if (!user) {
      return NextResponse.json(
        { message: 'שגיאה ביצירת המשתמש' },
        { status: 500 }
      );
    }
    
    // בסביבת פיתוח ללא אימייל אימות, אפשר להחזיר ישירות את נתוני המשתמש
    return NextResponse.json(
      { 
        message: 'ההרשמה בוצעה בהצלחה', 
        user: { 
          id: user.id, 
          email: user.email,
          name: user.user_metadata?.name 
        } 
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // טיפול בשגיאה שכתובת האימייל כבר קיימת
    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { message: 'כתובת האימייל כבר רשומה במערכת' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { message: 'שגיאה ברישום: ' + error.message },
      { status: 500 }
    );
  }
} 