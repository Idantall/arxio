const { createClient } = require('@supabase/supabase-js');

// מפתחות סופאבייס שכבר קיימים במערכת
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTI3Mzk0MSwiZXhwIjoyMDYwODQ5OTQxfQ.mnXnBpFFOytuio-rgjyx_vbthCnPmhaLaFwyH2oXLko';

// יצירת לקוח סופאבייס עם הרשאות אדמין
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// פרטי המשתמש לפי בקשת המשתמש
const email = 'idantal92@gmail.com';
const password = 'Idta1234';
const userData = {
  name: 'Idan Tal',
  role: 'admin'
};

async function createUser() {
  try {
    // יצירת המשתמש
    console.log(`מנסה ליצור משתמש עם האימייל: ${email}`);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // מאשר את האימייל אוטומטית
      user_metadata: userData
    });

    if (error) {
      console.error('שגיאה ביצירת המשתמש:', error.message);
      return;
    }

    console.log('המשתמש נוצר בהצלחה!');
    console.log('מזהה המשתמש:', data.user.id);
    console.log('התחבר עם:');
    console.log(`אימייל: ${email}`);
    console.log(`סיסמה: ${password}`);
  } catch (error) {
    console.error('שגיאה לא צפויה:', error.message);
  }
}

// הפעלת הפונקציה
createUser(); 