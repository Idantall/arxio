const { createClient } = require('@supabase/supabase-js');

// מפתחות סופאבייס שכבר קיימים במערכת
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTI3Mzk0MSwiZXhwIjoyMDYwODQ5OTQxfQ.mnXnBpFFOytuio-rgjyx_vbthCnPmhaLaFwyH2oXLko';

// יצירת לקוח סופאבייס עם הרשאות אדמין
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// פרטי המשתמש לעדכון
const email = 'idantal92@gmail.com';
const newPassword = 'Idta1234';

async function updateUserPassword() {
  try {
    console.log(`מחפש משתמש עם האימייל: ${email}...`);
    
    // קבלת פרטי המשתמש לפי האימייל
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('שגיאה בקבלת רשימת משתמשים:', userError.message);
      return;
    }
    
    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`לא נמצא משתמש עם האימייל: ${email}`);
      return;
    }
    
    console.log(`נמצא משתמש עם האימייל: ${email}, מזהה: ${user.id}`);
    console.log(`מעדכן את הסיסמה...`);
    
    // עדכון הסיסמה
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );
    
    if (error) {
      console.error('שגיאה בעדכון הסיסמה:', error.message);
      return;
    }
    
    console.log('הסיסמה עודכנה בהצלחה!');
    console.log('פרטי כניסה:');
    console.log(`אימייל: ${email}`);
    console.log(`סיסמה: ${newPassword}`);
    
  } catch (error) {
    console.error('שגיאה לא צפויה:', error.message);
  }
}

// הפעלת הפונקציה
updateUserPassword(); 