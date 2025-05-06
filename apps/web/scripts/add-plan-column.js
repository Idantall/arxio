// סקריפט להוספת עמודת "plan" לטבלת המשתמשים
const { createClient } = require('@supabase/supabase-js');

// בדיקת קיום משתני סביבה הכרחיים
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('חסרים משתני סביבה: NEXT_PUBLIC_SUPABASE_URL או SUPABASE_SERVICE_KEY');
  console.log('יש להפעיל את הסקריפט עם משתני הסביבה הנכונים:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/add-plan-column.js');
  process.exit(1);
}

// יצירת חיבור ל-Supabase עם הרשאות אדמין
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const addPlanColumn = async () => {
  try {
    console.log('בודק אם עמודת "plan" כבר קיימת...');
    
    // בדיקה אם העמודה כבר קיימת
    const { error: checkError } = await supabase.rpc('pgql', { 
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'plan'`
    });
    
    if (checkError) {
      console.error('שגיאה בבדיקת קיום העמודה:', checkError.message);
      process.exit(1);
    }
    
    // הוספת העמודה אם היא לא קיימת
    console.log('מוסיף עמודת "plan" לטבלת המשתמשים...');
    
    const addColumnQuery = `
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' NOT NULL;
    `;
    
    const { error: alterError } = await supabase.rpc('pgql', { query: addColumnQuery });
    
    if (alterError) {
      console.error('שגיאה בהוספת העמודה:', alterError.message);
      process.exit(1);
    }
    
    console.log('עמודת "plan" נוספה בהצלחה!');

    // עדכון תכניות ברירת מחדל לכל המשתמשים הקיימים
    console.log('מעדכן את כל המשתמשים הקיימים לתכנית "free"...');
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ plan: 'free' })
      .is('plan', null);
    
    if (updateError) {
      console.error('שגיאה בעדכון ערכי ברירת מחדל:', updateError.message);
    } else {
      console.log('כל המשתמשים עודכנו בהצלחה!');
    }
    
  } catch (error) {
    console.error('שגיאה כללית:', error.message);
    process.exit(1);
  }
};

// הפעלת הפונקציה
addPlanColumn(); 