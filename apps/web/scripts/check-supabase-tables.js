#!/usr/bin/env node

// סקריפט לבדיקת טבלאות ומדיניות בסופאבייס
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

async function checkDatabase() {
  try {
    console.log('בודק את מסד הנתונים Supabase...');
    
    // בדיקת טבלת המשתמשים ישירות
    console.log('\n--- בדיקת טבלת משתמשים ---');
    try {
      const { data: users, error: userError, count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact' })
        .limit(3);
      
      if (userError) {
        console.error(`שגיאה בגישה לטבלת users: ${userError.message}`);
        console.log('ייתכן שהטבלה לא קיימת או שאין הרשאות מתאימות.');
      } else {
        console.log(`טבלת users נמצאה! מספר רשומות: ${count}`);
        
        if (users && users.length > 0) {
          console.log('\nדוגמה למבנה רשומת משתמש:');
          const userColumns = Object.keys(users[0]);
          userColumns.forEach(col => {
            console.log(`- ${col}: ${typeof users[0][col]}`);
          });
          
          console.log('\nמספר שדות ברשומה:', userColumns.length);
        } else {
          console.log('לא נמצאו רשומות בטבלת users.');
        }
      }
    } catch (e) {
      console.error('שגיאה בבדיקת טבלת users:', e);
    }
    
    // בדיקת אימות ומשתמשים
    console.log('\n--- בדיקת מערכת האימות של סופאבייס ---');
    
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        console.error(`שגיאה בגישה למערכת האימות: ${error.message}`);
      } else {
        console.log(`מספר משתמשים במערכת האימות: ${data.users.length}`);
        
        if (data.users.length > 0) {
          console.log('\nדוגמה למשתמש ראשון:');
          const firstUser = data.users[0];
          console.log(`- ID: ${firstUser.id}`);
          console.log(`- אימייל: ${firstUser.email}`);
          console.log(`- אומת: ${firstUser.email_confirmed_at ? 'כן' : 'לא'}`);
          console.log(`- תפקיד: ${firstUser.role}`);
          console.log(`- נוצר ב: ${new Date(firstUser.created_at).toLocaleString()}`);
          
          // בדיקת התאמה בין טבלאות
          if (users && users.length > 0) {
            const matchingUser = users.find(u => u.email === firstUser.email);
            if (matchingUser) {
              console.log('\nנמצאה התאמה בין משתמש האימות לטבלת המשתמשים!');
            } else {
              console.error('\nאזהרה: המשתמש במערכת האימות לא נמצא בטבלת users');
              console.error('זו עלולה להיות הסיבה לבעיות ההתחברות.');
            }
          }
        }
      }
    } catch (authError) {
      console.error(`שגיאה בקבלת נתוני משתמשים ממערכת האימות: ${authError.message}`);
    }
    
    // בדיקת קונפיגורציית האימות
    console.log('\n--- בדיקת הגדרות NextAuth ---');
    console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'לא מוגדר'}`);
    console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'מוגדר' : 'לא מוגדר'}`);
    console.log(`GITHUB_CLIENT_ID: ${process.env.GITHUB_CLIENT_ID ? 'מוגדר' : 'לא מוגדר'}`);
    
  } catch (error) {
    console.error('שגיאה בבדיקת מסד הנתונים:', error);
  }
}

checkDatabase()
  .then(() => {
    console.log('\nבדיקת מסד הנתונים הסתיימה!');
    process.exit(0);
  })
  .catch(err => {
    console.error('שגיאה בהרצת הסקריפט:', err);
    process.exit(1);
  }); 