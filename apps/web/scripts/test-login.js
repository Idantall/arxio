const { createClient } = require('@supabase/supabase-js');

// מפתחות סופאבייס שכבר קיימים במערכת
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTI3Mzk0MSwiZXhwIjoyMDYwODQ5OTQxfQ.mnXnBpFFOytuio-rgjyx_vbthCnPmhaLaFwyH2oXLko';

// יצירת לקוח סופאבייס רגיל (לא אדמין)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// פרטי המשתמש לבדיקה
const email = 'idantal92@gmail.com';
const password = 'Idta1234';

async function testLogin() {
  try {
    console.log(`מנסה להתחבר עם המשתמש: ${email}...`);
    
    // ניסיון התחברות ישירות עם סופאבייס
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('שגיאה בהתחברות:', error.message);
      return;
    }
    
    console.log('התחברות הצליחה!');
    console.log('מידע על המשתמש:', data.user);
    console.log('מזהה המשתמש:', data.user.id);
    console.log('אסימון הרשאה:', data.session.access_token.substring(0, 20) + '...');
    
    // יצירת לקוח סופאבייס אדמין לקבלת מידע נוסף
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // בדיקה האם המשתמש קיים במערכת
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      data.user.id
    );
    
    if (userError) {
      console.error('שגיאה בקבלת מידע נוסף על המשתמש:', userError.message);
      return;
    }
    
    console.log('מידע מפורט על המשתמש:');
    console.log(userData);
    
  } catch (error) {
    console.error('שגיאה לא צפויה:', error.message);
  }
}

// הפעלת הפונקציה
testLogin(); 