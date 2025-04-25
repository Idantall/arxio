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
  email: 'test@example.com',
  password: 'Test1234!',
  username: 'testuser',
};

async function createUser() {
  try {
    console.log(`מנסה ליצור משתמש: ${USER.email}`);
    
    // בדיקה אם המשתמש כבר קיים
    const { data: existingUsers, error: searchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', USER.email);
    
    if (searchError) {
      throw new Error(`שגיאה בחיפוש משתמש קיים: ${searchError.message}`);
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log(`משתמש עם האימייל ${USER.email} כבר קיים!`);
      console.log('פרטי המשתמש הקיים:');
      console.log(existingUsers[0]);
      
      // בדיקה אם המשתמש קיים גם במערכת האימות של סופרבייס
      console.log('בודק אם המשתמש קיים גם במערכת האימות של סופרבייס...');
      const { data: authUsers, error: authListError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authListError) {
        console.warn(`אזהרה: לא הצלחנו לבדוק אם המשתמש קיים במערכת האימות: ${authListError.message}`);
      } else {
        const authUser = authUsers.users.find(u => u.email === USER.email);
        if (authUser) {
          console.log('המשתמש קיים גם במערכת האימות של סופרבייס:', authUser);
        } else {
          console.log('המשתמש לא קיים במערכת האימות של סופרבייס');
          console.log('מנסה ליצור משתמש במערכת האימות...');
          
          const { data: newAuthUser, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
            email: USER.email,
            password: USER.password,
            email_confirm: true
          });
          
          if (authCreateError) {
            console.warn(`אזהרה: לא הצלחנו ליצור משתמש במערכת האימות: ${authCreateError.message}`);
          } else {
            console.log('משתמש נוצר בהצלחה במערכת האימות:', newAuthUser);
          }
        }
      }
      
      return;
    }
    
    // הצפנת הסיסמה
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(USER.password, salt);
    
    // יצירת משתמש בטבלת המשתמשים
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email: USER.email,
          username: USER.username,
          password: hashedPassword,
          created_at: new Date().toISOString(),
        }
      ])
      .select();
    
    if (insertError) {
      throw new Error(`שגיאה ביצירת משתמש: ${insertError.message}`);
    }
    
    console.log('משתמש נוצר בהצלחה:', newUser);
    
    // בדיקה אם נדרש גם ליצור משתמש באימות של סופרבייס
    console.log('בודק אם נדרשת גם יצירת משתמש במערכת האימות של סופרבייס...');
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: USER.email,
      password: USER.password,
      email_confirm: true
    });
    
    if (authError) {
      console.warn(`אזהרה: לא הצלחנו ליצור משתמש במערכת האימות של סופרבייס: ${authError.message}`);
      console.warn('ייתכן שתצטרך להשתמש באפשרות התחברות עם אישורים מותאמים אישית.');
    } else {
      console.log('משתמש נוצר גם במערכת האימות של סופרבייס:', authUser);
    }
    
  } catch (error) {
    console.error('שגיאה ביצירת משתמש:', error);
    process.exit(1);
  }
}

createUser()
  .then(() => {
    console.log('הסקריפט הסתיים בהצלחה!');
    console.log('פרטי ההתחברות:');
    console.log(`אימייל: ${USER.email}`);
    console.log(`סיסמה: ${USER.password}`);
    process.exit(0);
  })
  .catch(err => {
    console.error('שגיאה בהרצת הסקריפט:', err);
    process.exit(1);
  }); 