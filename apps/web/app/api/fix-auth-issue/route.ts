import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function GET() {
  // פרטי התחברות לסופרבייס
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({
      success: false,
      message: 'פרטי התחברות לסופרבייס חסרים',
    }, { status: 500 });
  }

  // יצירת לקוח סופרבייס עם הרשאות מלאות
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // בדיקת מבנה הטבלה הנוכחי
    const { data: tableData, error: tableError } = await supabaseAdmin
      .rpc('table_structure', { table_name: 'users' });
    
    if (tableError) {
      return NextResponse.json({
        success: false,
        message: 'שגיאה בבדיקת מבנה הטבלה',
        error: tableError,
        solution: 'יש ליצור פונקציית RPC בשם table_structure או לשנות את הקוד כדי לבדוק את מבנה הטבלה בדרך אחרת'
      }, { status: 500 });
    }
    
    // חיפוש האם קיימת עמודת סיסמה
    const hasPasswordColumn = tableData?.some(column => column.column_name === 'password');
    
    let alterTableResult = null;
    
    // אם אין עמודת סיסמה, נוסיף אותה
    if (!hasPasswordColumn) {
      const { data: alterData, error: alterError } = await supabaseAdmin
        .rpc('execute_sql', { 
          sql: 'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT' 
        });
      
      if (alterError) {
        return NextResponse.json({
          success: false,
          message: 'שגיאה בהוספת עמודת סיסמה',
          error: alterError,
          solution: 'יש להוסיף עמודת סיסמה באופן ידני דרך ממשק סופרבייס, או ליצור פונקציית RPC בשם execute_sql'
        }, { status: 500 });
      }
      
      alterTableResult = {
        success: true,
        message: 'עמודת סיסמה נוספה בהצלחה'
      };
      
      // עדכון סיסמה למשתמש הבדיקה
      const testUser = {
        email: 'test@example.com',
        password: 'Test1234!'
      };
      
      // הצפנת הסיסמה
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      
      // עדכון רשומת המשתמש עם הסיסמה המוצפנת
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ password: hashedPassword })
        .eq('email', testUser.email);
      
      if (updateError) {
        return NextResponse.json({
          success: false,
          message: 'שגיאה בעדכון סיסמת המשתמש',
          error: updateError
        }, { status: 500 });
      }
    }
    
    // בדיקת מידע על משתמש הבדיקה
    const { data: testUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'test@example.com')
      .single();
    
    if (userError) {
      return NextResponse.json({
        success: false,
        message: 'שגיאה בחיפוש משתמש הבדיקה',
        error: userError
      }, { status: 500 });
    }
    
    // בדיקת קיום משתמש במערכת האימות של סופרבייס
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    let authUser = null;
    if (!authError) {
      authUser = authData.users.find(user => user.email === 'test@example.com');
    }
    
    return NextResponse.json({
      success: true,
      message: 'בדיקת מערכת האימות הושלמה',
      tableStructure: {
        hasPasswordColumn: hasPasswordColumn || (alterTableResult !== null)
      },
      alterTableResult,
      testUser: {
        ...testUser,
        password: testUser?.password ? 'קיימת סיסמה מוצפנת' : 'חסרה סיסמה'
      },
      authUserExists: !!authUser,
      loginCredentials: {
        email: 'test@example.com',
        password: 'Test1234!'
      },
      nextSteps: [
        'נסה להתחבר עם פרטי ההתחברות הנ"ל',
        'בדוק שהמסלול לאימות (lib/auth.ts) משתמש בסיסמה מהטבלה נכון',
        'וודא שהסיסמה מושווה באמצעות bcrypt.compare'
      ]
    });
    
  } catch (error) {
    console.error('שגיאה בטיפול בבעיית האימות:', error);
    return NextResponse.json({
      success: false,
      message: 'שגיאה לא צפויה בטיפול בבעיית האימות',
      error: error instanceof Error ? error.message : String(error),
      manualSolution: [
        '1. הוסף עמודת password לטבלת users דרך ממשק סופרבייס',
        '2. הרץ את הסקריפט create-hardcoded-user.js שוב כדי ליצור משתמש עם סיסמה תקינה',
        '3. וודא שמסלול האימות בקובץ lib/auth.ts משתמש בהשוואת סיסמאות נכונה'
      ]
    }, { status: 500 });
  }
} 