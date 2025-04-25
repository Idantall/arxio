const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env.local' });

// מפתחות סופאבייס מקובץ הסביבה או ערכים קבועים כגיבוי
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTI3Mzk0MSwiZXhwIjoyMDYwODQ5OTQxfQ.mnXnBpFFOytuio-rgjyx_vbthCnPmhaLaFwyH2oXLko';

// יצירת לקוח סופאבייס עם הרשאות אדמין
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// פרטי המשתמש החדש
const userData = {
  email: 'idantal92@gmail.com',
  password: 'Idta1234',
  username: 'idant',
  fullName: 'עידן טל'
};

async function createUser() {
  try {
    console.log('בודק אם המשתמש כבר קיים...');
    
    // בדיקה אם המשתמש כבר קיים
    const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (checkError) {
      console.error('שגיאה בבדיקת משתמשים קיימים:', checkError.message);
      return;
    }

    const existingUser = existingUsers.users.find(u => u.email === userData.email);
    
    if (existingUser) {
      console.log(`משתמש עם האימייל ${userData.email} כבר קיים במערכת.`);
      console.log('מעדכן את הסיסמה...');
      
      // עדכון הסיסמה של המשתמש הקיים
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: userData.password }
      );
      
      if (updateError) {
        console.error('שגיאה בעדכון הסיסמה:', updateError.message);
        return;
      }
      
      console.log('הסיסמה עודכנה בהצלחה!');
      await updateProfile(existingUser.id);
      
    } else {
      console.log(`יוצר משתמש חדש עם האימייל: ${userData.email}...`);
      
      // יצירת משתמש חדש
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true // מאשר את האימייל אוטומטית
      });
      
      if (createError) {
        console.error('שגיאה ביצירת המשתמש:', createError.message);
        return;
      }
      
      console.log(`משתמש חדש נוצר בהצלחה! מזהה: ${newUser.user.id}`);
      await updateProfile(newUser.user.id);
    }
    
  } catch (error) {
    console.error('שגיאה לא צפויה:', error.message);
  }
}

// עדכון פרופיל המשתמש בטבלה users (אם קיימת)
async function updateProfile(userId) {
  try {
    // בדיקה אם טבלת users קיימת
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);
      
    if (tableError && !tableError.message.includes('does not exist')) {
      console.error('שגיאה בבדיקת טבלת users:', tableError.message);
      return;
    }
    
    // אם הטבלה לא קיימת, לא מעדכנים פרופיל
    if (tableError && tableError.message.includes('does not exist')) {
      console.log('טבלת users לא קיימת במסד הנתונים, מדלג על עדכון הפרופיל.');
      printLoginDetails();
      return;
    }
    
    console.log('מעדכן את פרטי הפרופיל בטבלת users...');
    
    // עדכון או הוספת רשומה בטבלת users לפי המבנה הנכון
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        username: userData.fullName, // שדה username מכיל את השם המלא
        email: userData.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (upsertError) {
      console.error('שגיאה בעדכון פרופיל המשתמש:', upsertError.message);
      return;
    }
    
    console.log('פרופיל המשתמש עודכן בהצלחה!');
    printLoginDetails();
    
  } catch (error) {
    console.error('שגיאה לא צפויה בעדכון הפרופיל:', error.message);
  }
}

function printLoginDetails() {
  console.log('\n=== פרטי כניסה ===');
  console.log(`אימייל: ${userData.email}`);
  console.log(`סיסמה: ${userData.password}`);
  console.log(`שם משתמש: ${userData.username}`);
  console.log('==================\n');
}

// הפעלת הפונקציה
createUser(); 