const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

// מפתחות סופאבייס
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTI3Mzk0MSwiZXhwIjoyMDYwODQ5OTQxfQ.mnXnBpFFOytuio-rgjyx_vbthCnPmhaLaFwyH2oXLko';

// יצירת לקוח סופאבייס
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  try {
    console.log('בודק את מבנה הטבלאות במסד הנתונים...');

    // בדיקת המשתמשים המאומתים
    console.log('\n=== משתמשים מאומתים ===');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('שגיאה בקבלת רשימת משתמשים מאומתים:', authError.message);
    } else {
      console.log(`נמצאו ${authUsers.users.length} משתמשים מאומתים.`);
      if (authUsers.users.length > 0) {
        console.log('דוגמה למשתמש מאומת:');
        console.log(JSON.stringify(authUsers.users[0], null, 2));
      }
    }
    
    // בדיקת טבלת users
    console.log('\n=== טבלת users ===');
    try {
      // ניסיון לקבל רשומה אחת כדי לראות את מבנה הטבלה
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from('users')
        .select('*')
        .limit(1);
      
      if (usersError) {
        if (usersError.message.includes('does not exist')) {
          console.log('טבלת users לא קיימת במסד הנתונים.');
        } else {
          console.error('שגיאה בגישה לטבלת users:', usersError.message);
        }
      } else {
        console.log(`נמצאו רשומות בטבלת users.`);
        if (usersData.length > 0) {
          console.log('מבנה הטבלה:');
          console.log(Object.keys(usersData[0]));
          console.log('דוגמה לרשומה:');
          console.log(JSON.stringify(usersData[0], null, 2));
        } else {
          console.log('טבלת users קיימת אך ריקה.');
          
          // ניסיון לקבל את מבנה הטבלה
          const { data: tableInfo, error: tableError } = await supabaseAdmin.rpc('test_users_columns');
          if (tableError) {
            console.error('לא ניתן לקבל את מבנה הטבלה:', tableError.message);
          } else {
            console.log('מבנה הטבלה:');
            console.log(tableInfo);
          }
        }
      }
    } catch (error) {
      console.error('שגיאה לא צפויה בבדיקת טבלת users:', error.message);
    }
    
    // בדיקת טבלאות נוספות
    console.log('\n=== רשימת כל הטבלאות ===');
    const { data: tables, error: tablesError } = await supabaseAdmin.rpc('get_all_tables');
    
    if (tablesError) {
      console.error('שגיאה בקבלת רשימת הטבלאות:', tablesError.message);
      
      // ניסיון אחר לקבלת רשימת הטבלאות
      console.log('מנסה דרך אחרת לקבל את רשימת הטבלאות...');
      
      // ניסיון גישה לטבלאות נפוצות
      const commonTables = ['users', 'profiles', 'projects', 'tasks', 'repositories'];
      
      for (const table of commonTables) {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
          
        if (!error) {
          console.log(`- טבלת ${table} קיימת.`);
        } else if (!error.message.includes('does not exist')) {
          console.log(`- טבלת ${table} קיימת אך יש שגיאת גישה: ${error.message}`);
        }
      }
    } else {
      console.log('רשימת הטבלאות במסד הנתונים:');
      console.log(tables);
    }
    
  } catch (error) {
    console.error('שגיאה לא צפויה:', error.message);
  }
}

// הפעלת הפונקציה
checkTables(); 