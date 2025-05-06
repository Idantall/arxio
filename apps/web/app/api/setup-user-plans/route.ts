import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET() {
  try {
    // בדיקה אם עמודת plan קיימת בטבלת users
    const checkColumnSQL = `
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'plan'
      ) as has_plan_column;
    `;
    
    const { data: columnCheck, error: columnCheckError } = await supabaseAdmin.rpc('pgql', { query: checkColumnSQL });
    
    if (columnCheckError) {
      return NextResponse.json({
        success: false,
        message: 'שגיאה בבדיקת קיום עמודת plan',
        error: columnCheckError.message
      }, { status: 500 });
    }
    
    const hasPlanColumn = columnCheck?.[0]?.has_plan_column || false;
    
    if (hasPlanColumn) {
      // אם העמודה כבר קיימת, נבדוק את המשתמשים הקיימים
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email, plan')
        .limit(10);
      
      if (usersError) {
        return NextResponse.json({
          success: false,
          message: 'שגיאה בקריאת נתוני משתמשים',
          error: usersError.message
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'עמודת plan כבר קיימת בטבלת המשתמשים',
        columnExists: true,
        sampleUsers: users || []
      });
    }
    
    // הוספת עמודת plan לטבלת המשתמשים
    const addColumnSQL = `
      DO $$
      BEGIN
        -- הוספת עמודת plan אם לא קיימת
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'plan'
        ) THEN
          ALTER TABLE users ADD COLUMN plan VARCHAR(20) DEFAULT 'free' NOT NULL;
          
          -- יצירת אינדקס לחיפוש מהיר
          CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
          
          -- עדכון כל המשתמשים הקיימים לתוכנית חינמית כברירת מחדל
          UPDATE users SET plan = 'free' WHERE plan IS NULL;
          
          -- יצירת פונקציה לעדכון משתמשים אוטומטית
          CREATE OR REPLACE FUNCTION update_user_plan() RETURNS TRIGGER AS
          $$
          BEGIN
            -- אם מדובר בהוספת משתמש חדש ולא צוין plan, נגדיר כברירת מחדל 'free'
            IF NEW.plan IS NULL THEN
              NEW.plan := 'free';
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          -- הפעלת הטריגר על טבלת המשתמשים
          DROP TRIGGER IF EXISTS tr_user_plan ON users;
          CREATE TRIGGER tr_user_plan
            BEFORE INSERT OR UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_user_plan();
        END IF;
      END
      $$;
    `;
    
    const { error: alterError } = await supabaseAdmin.rpc('pgql', { query: addColumnSQL });
    
    if (alterError) {
      return NextResponse.json({
        success: false,
        message: 'שגיאה בהוספת עמודת plan',
        error: alterError.message,
        sql: addColumnSQL
      }, { status: 500 });
    }
    
    // בדיקת כמה משתמשים קיימים עם כל תוכנית
    const countPlansSQL = `
      SELECT plan, COUNT(*) as count
      FROM users
      GROUP BY plan
      ORDER BY count DESC;
    `;
    
    const { data: plansCount, error: countError } = await supabaseAdmin.rpc('pgql', { query: countPlansSQL });
    
    return NextResponse.json({
      success: true,
      message: 'עמודת plan נוספה בהצלחה לטבלת המשתמשים',
      columnAdded: true,
      plansCount: plansCount || []
    });
    
  } catch (error) {
    console.error('שגיאה בהוספת עמודת plan:', error);
    return NextResponse.json({
      success: false,
      message: 'שגיאה בהוספת עמודת plan',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, plan } = body;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'חסר מזהה משתמש',
      }, { status: 400 });
    }
    
    if (!plan || !['free', 'pro', 'enterprise'].includes(plan)) {
      return NextResponse.json({
        success: false,
        message: 'תוכנית לא חוקית. ערכים מותרים: free, pro, enterprise',
      }, { status: 400 });
    }
    
    // בדיקה אם המשתמש קיים
    const { data: userExistsCheck, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (userCheckError || !userExistsCheck) {
      return NextResponse.json({
        success: false,
        message: 'המשתמש לא נמצא',
        error: userCheckError?.message || 'User not found'
      }, { status: 404 });
    }
    
    // עדכון תוכנית המשתמש
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ plan, updated_at: new Date() })
      .eq('id', userId);
    
    if (updateError) {
      return NextResponse.json({
        success: false,
        message: 'שגיאה בעדכון תוכנית המשתמש',
        error: updateError.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `תוכנית המשתמש עודכנה ל-${plan}`,
      userId,
      plan
    });
    
  } catch (error) {
    console.error('שגיאה בעדכון תוכנית משתמש:', error);
    return NextResponse.json({
      success: false,
      message: 'שגיאה בעדכון תוכנית משתמש',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 