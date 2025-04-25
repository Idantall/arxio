import { createClient } from '@supabase/supabase-js';

async function checkLogin(email: string, password: string) {
  // יצירת לקוח Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('חסרים משתני סביבה של Supabase! נא להגדיר NEXT_PUBLIC_SUPABASE_URL ו-NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // ניסיון התחברות
    console.log(`מנסה להתחבר עם: ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('שגיאת התחברות:', error.message);
    } else {
      console.log('התחברות בוצעה בהצלחה!');
      console.log('מידע משתמש:', data.user);
      
      // בדיקת טבלת משתמשים
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user?.id)
        .single();
        
      if (userError) {
        console.log('לא נמצא משתמש בטבלת users:', userError.message);
      } else {
        console.log('נתוני משתמש מטבלת users:', userData);
      }
    }
  } catch (err) {
    console.error('שגיאה לא צפויה:', err);
  }
}

// בדיקת פרמטרים מהקו הפקודה
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('אנא ספק אימייל וסיסמה כפרמטרים');
  console.log('דוגמה: npx tsx check-login.ts example@email.com mypassword');
} else {
  checkLogin(email, password);
} 