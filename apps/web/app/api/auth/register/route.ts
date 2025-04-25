import { NextResponse } from 'next/server';
import { signUp } from '@/lib/supabase';
import { userRegistrationSchema } from '@arxio/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('בקשת הרשמה התקבלה:', { ...body, password: '***' });
    
    // וידוא תקינות הנתונים
    const validationResult = userRegistrationSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('שגיאת וידוא:', validationResult.error.errors);
      return NextResponse.json(
        { message: 'נתונים לא תקינים', errors: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { email, password, name } = validationResult.data;
    
    // הרשמה באמצעות Supabase
    try {
      const { user, session } = await signUp(email, password, { name });
      
      if (!user) {
        console.error('לא הוחזר משתמש מההרשמה');
        return NextResponse.json(
          { message: 'שגיאה ביצירת המשתמש' },
          { status: 500 }
        );
      }
      
      console.log('משתמש נרשם בהצלחה:', user.id);
      
      // בסביבת פיתוח ללא אימות אימייל, אפשר להחזיר ישירות את נתוני המשתמש
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
    } catch (supabaseError: any) {
      console.error('שגיאת הרשמה בסופאבייס:', supabaseError);
      
      // טיפול בשגיאה שכתובת האימייל כבר קיימת
      if (supabaseError.message?.includes('already exists')) {
        return NextResponse.json(
          { message: 'כתובת האימייל כבר רשומה במערכת' },
          { status: 409 }
        );
      }
      
      throw supabaseError;
    }
    
  } catch (error: any) {
    console.error('שגיאת הרשמה:', error);
    
    return NextResponse.json(
      { message: 'שגיאה ברישום: ' + (error.message || 'אירעה שגיאה לא צפויה') },
      { status: 500 }
    );
  }
} 