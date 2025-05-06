#!/usr/bin/env node

// יצירת משתמש קשיח בסופאבייס
require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// מפתחות סופאבייס
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('חסרים מפתחות סופרבייס בקובץ .env.local!');
  console.error('נדרשים: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// יצירת לקוח סופאבייס עם הרשאות אדמין
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// פרטי המשתמש הקשיח
const USER = {
  email: 'admin@arxio.io',
  password: 'Aa123456',
  username: 'admin',
  role: 'admin'
};

async function createUser() {
  try {
    // בדיקת מבנה הטבלה
    console.log('בודק את מבנה הטבלה...');
    
    try {
      // קבלת מידע על מבנה טבלת המשתמשים
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('שגיאה בקבלת מבנה הטבלה:', error);
      } else if (data && data.length > 0) {
        console.log('מבנה טבלת המשתמשים:');
        console.log(Object.keys(data[0]));
      } else {
        console.log('טבלת המשתמשים ריקה');
      }
    } catch (e) {
      console.error('שגיאה בבדיקת מבנה הטבלה:', e);
    }
    
    console.log('בודק אם המשתמש כבר קיים...');
    
    // בדיקה אם המשתמש כבר קיים
    const { data: existingUser, error: lookupError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', USER.email)
      .maybeSingle();
    
    if (lookupError) {
      console.error('שגיאה בחיפוש משתמש קיים:', lookupError);
    }
    
    if (existingUser) {
      console.log('משתמש כבר קיים:', existingUser);
      return;
    }
    
    // יצירת גיבוב לסיסמה
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(USER.password, salt);
    
    // ניסיון ליצור משתמש חדש עם שדה password
    console.log('מנסה ליצור משתמש עם שדה password...');
    
    try {
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          email: USER.email,
          username: USER.username,
          password: hashedPassword,
          role: USER.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('שגיאה בניסיון הראשון:', insertError);
      } else {
        console.log('משתמש נוצר בהצלחה:', newUser);
      }
    } catch (e) {
      console.error('שגיאה לא צפויה בניסיון הראשון:', e);
    }
    
    // אם הניסיון הראשון נכשל, ננסה עם auth
    console.log('יוצר משתמש במערכת האימות של Supabase...');
    
    try {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: USER.email,
        password: USER.password,
        email_confirm: true
      });
      
      if (authError) {
        console.error('שגיאה ביצירת המשתמש במערכת האימות:', authError);
      } else {
        console.log('משתמש נוצר בהצלחה במערכת האימות:', authUser);
      }
    } catch (authCreationError) {
      console.error('שגיאה לא צפויה ביצירת משתמש במערכת האימות:', authCreationError);
    }
    
    console.log('\n===== יצירת המשתמש הושלמה =====');
    console.log('כתובת דוא"ל:', USER.email);
    console.log('סיסמה:', USER.password);
    console.log('=================================\n');
    
  } catch (error) {
    console.error('שגיאה ביצירת המשתמש:', error);
    process.exit(1);
  }
}

createUser()
  .then(() => {
    console.log('הסקריפט הסתיים בהצלחה!');
    process.exit(0);
  })
  .catch(err => {
    console.error('שגיאה בהרצת הסקריפט:', err);
    process.exit(1);
  }); 