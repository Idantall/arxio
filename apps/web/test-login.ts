import { createClient } from '@supabase/supabase-js';

// מפתחות Supabase האמיתיים
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';

// יצירת לקוח סופאבייס
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// פונקציה עבור בדיקת התחברות
async function testLogin() {
  try {
    console.log('מנסה להתחבר עם email: idantal92@gmail.com');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'idantal92@gmail.com',
      password: 'Idta1234'
    });
    
    if (error) {
      console.error('שגיאת התחברות:', error.message);
      return;
    }
    
    console.log('התחברות הצליחה!');
    console.log('מידע משתמש:', data.user);
  } catch (err) {
    console.error('שגיאה כללית:', err);
  }
}

// הפעלת הבדיקה
testLogin(); 