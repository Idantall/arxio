#!/usr/bin/env node

// יצירת רשומה עבור המשתמש בטבלת users
require('dotenv').config({ path: '.env.local' });
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

// פרטי המשתמש
const USER = {
  email: 'admin@arxio.io',
  username: 'admin',
  avatar_url: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff'
};

async function createUserInTable() {
  try {
    console.log('מחפש את המשתמש במערכת האימות...');
    
    // קבלת ה-UUID של המשתמש ממערכת האימות
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`שגיאה בחיפוש המשתמש במערכת האימות: ${listError.message}`);
    }
    
    const authUser = authUsers.users.find(u => u.email === USER.email);
    
    if (!authUser) {
      throw new Error(`לא נמצא משתמש עם אימייל ${USER.email} במערכת האימות`);
    }
    
    console.log(`נמצא משתמש במערכת האימות עם ID: ${authUser.id}`);
    
    // בדיקה אם המשתמש כבר קיים בטבלה
    const { data: existingUser, error: lookupError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', USER.email)
      .maybeSingle();
    
    if (lookupError) {
      console.error('שגיאה בחיפוש משתמש קיים:', lookupError);
    }
    
    if (existingUser) {
      console.log('משתמש כבר קיים בטבלת users:', existingUser);
      return;
    }
    
    // הוספת רשומה בטבלת המשתמשים
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.id,
        email: USER.email,
        username: USER.username,
        avatar_url: USER.avatar_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      throw new Error(`שגיאה בהוספת משתמש לטבלת users: ${insertError.message}`);
    }
    
    console.log('משתמש נוסף בהצלחה לטבלת users:', newUser);
    
    console.log('\n===== פרטי משתמש מנהל =====');
    console.log('כתובת דוא"ל:', USER.email);
    console.log('סיסמה: Aa123456');
    console.log('שם משתמש:', USER.username);
    console.log('================================\n');
    
  } catch (error) {
    console.error('שגיאה:', error);
    process.exit(1);
  }
}

createUserInTable()
  .then(() => {
    console.log('הסקריפט הסתיים בהצלחה!');
    process.exit(0);
  })
  .catch(err => {
    console.error('שגיאה בהרצת הסקריפט:', err);
    process.exit(1);
  }); 