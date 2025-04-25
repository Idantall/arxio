const { createClient } = require('@supabase/supabase-js');

// מפתחות סופאבייס מהסקריפט
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTI3Mzk0MSwiZXhwIjoyMDYwODQ5OTQxfQ.mnXnBpFFOytuio-rgjyx_vbthCnPmhaLaFwyH2oXLko';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';

// פרטי המשתמש - עם אותיות עבריות לבדיקה נוספת
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Password123!';
const TEST_USERNAME = 'testuser';

// יצירת לקוח סופאבייס לאדמין
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// יצירת לקוח רגיל לניסיון התחברות
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// פונקציה שבודקת אם המשתמש כבר קיים
async function checkUserExists(email) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('שגיאה בבדיקת משתמשים:', error);
      return false;
    }
    
    const existingUser = data.users.find(user => user.email === email);
    return existingUser || false;
  } catch (error) {
    console.error('שגיאה לא צפויה בבדיקת משתמשים:', error);
    return false;
  }
}

// פונקציה ליצירת משתמש חדש
async function createTestUser() {
  try {
    console.log(`בודק אם המשתמש ${TEST_EMAIL} קיים...`);
    const existingUser = await checkUserExists(TEST_EMAIL);
    
    if (existingUser) {
      console.log(`משתמש ${TEST_EMAIL} כבר קיים. מזהה: ${existingUser.id}`);
      return existingUser;
    }
    
    console.log(`יוצר משתמש חדש: ${TEST_EMAIL}`);
    
    // יצירת משתמש חדש
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        username: TEST_USERNAME
      }
    });
    
    if (error) {
      console.error('שגיאה ביצירת משתמש:', error);
      return null;
    }
    
    console.log(`משתמש נוצר בהצלחה! מזהה: ${data.user.id}`);
    return data.user;
  } catch (error) {
    console.error('שגיאה לא צפויה ביצירת משתמש:', error);
    return null;
  }
}

// פונקציה לניסיון התחברות
async function testLogin(email, password) {
  try {
    console.log(`מנסה להתחבר עם ${email}...`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('שגיאה בהתחברות:', error);
      return null;
    }
    
    console.log('התחברות הצליחה!');
    console.log(`מזהה משתמש: ${data.user.id}`);
    console.log(`אסימון הרשאה: ${data.session.access_token.substring(0, 20)}...`);
    
    return data;
  } catch (error) {
    console.error('שגיאה לא צפויה בניסיון התחברות:', error);
    return null;
  }
}

// הרצת הבדיקות
async function runTests() {
  try {
    console.log('=== בודק משתמש קיים לפני יצירת משתמש חדש ===');
    const adminUserExists = await checkUserExists('admin@example.com');
    console.log('משתמש admin@example.com קיים?', adminUserExists ? 'כן' : 'לא');
    
    if (adminUserExists) {
      console.log(`בודק התחברות עם משתמש קיים: admin@example.com`);
      await testLogin('admin@example.com', 'Password123!');
    }
    
    console.log('\n=== יוצר משתמש בדיקה חדש ===');
    const newUser = await createTestUser();
    
    if (newUser) {
      console.log('\n=== בודק התחברות עם משתמש חדש ===');
      await testLogin(TEST_EMAIL, TEST_PASSWORD);
      
      console.log('\nהתחברות לממשק דרך דפדפן:');
      console.log(`דוא"ל: ${TEST_EMAIL}`);
      console.log(`סיסמה: ${TEST_PASSWORD}`);
    }
    
    console.log('\n=== השינויים המומלצים ===');
    console.log('1. נסה להתחבר עם פרטי המשתמש החדש');
    console.log('2. אם עדיין לא עובד, עדכן את קובץ ה-.env.local עם המפתחות המדויקים');
    console.log('3. הפעל מחדש את השרת עם הפקודה: pnpm dev');
    
  } catch (error) {
    console.error('שגיאה לא צפויה בהרצת הבדיקות:', error);
  }
}

// הפעלת הבדיקות
runTests(); 