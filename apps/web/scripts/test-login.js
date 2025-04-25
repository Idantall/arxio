const { createClient } = require('@supabase/supabase-js');

// מפתחות סופאבייס שכבר קיימים במערכת
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTI3Mzk0MSwiZXhwIjoyMDYwODQ5OTQxfQ.mnXnBpFFOytuio-rgjyx_vbthCnPmhaLaFwyH2oXLko';

// יצירת לקוח סופאבייס רגיל (לא אדמין)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// לקוח אדמין
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true
  }
});

// פרטי המשתמש לבדיקה
const email = 'idantal92@gmail.com';
const password = 'Idta1234';

async function verifySupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    // בדיקה של החיבור לשירות האימות של סופאבייס
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase auth connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('Unexpected error testing connection:', error);
    return false;
  }
}

async function listAllUsers() {
  try {
    console.log('\nFetching all users from Supabase...');
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log(`Found ${data.users.length} users in the system:`);
    data.users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id})`);
    });
  } catch (error) {
    console.error('Unexpected error listing users:', error);
  }
}

async function testLogin() {
  try {
    // תחילה נבדוק שאנחנו מצליחים להתחבר לסופאבייס
    const connectionOk = await verifySupabaseConnection();
    if (!connectionOk) {
      console.error('Failed to connect to Supabase. Aborting login test.');
      return;
    }
    
    // נרשימת את כל המשתמשים במערכת
    await listAllUsers();
    
    console.log(`\nמנסה להתחבר עם המשתמש: ${email}...`);
    
    // ניסיון התחברות ישירות עם סופאבייס
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('שגיאה בהתחברות:', error.message);
      if (error.message.includes('Invalid login credentials')) {
        console.log('\nהמלצות לפתרון:');
        console.log('1. וודא שהמשתמש באמת קיים במערכת הסופאבייס');
        console.log('2. וודא שהסיסמה נכונה');
        console.log('3. נסה ליצור את המשתמש מחדש עם הסקריפט create-user.js');
      }
      return;
    }
    
    console.log('התחברות הצליחה!');
    console.log('מידע על המשתמש:', data.user);
    console.log('מזהה המשתמש:', data.user.id);
    console.log('אסימון הרשאה:', data.session.access_token.substring(0, 20) + '...');
    
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
    
    console.log('\nהנחיות להמשך:');
    console.log('1. בסביבת הייצור, וודא שהגדרות ה-.env הוגדרו נכון בפאנל של Vercel');
    console.log('2. וודא ש-NEXTAUTH_URL מכוון ל-https://arxio-web.vercel.app');
    console.log('3. וודא שהתחברות עובדת מול סופאבייס בסביבת הייצור');
    console.log('\nמשתנים סביבתיים נדרשים לסביבת ייצור:');
    console.log(`NEXTAUTH_URL=https://arxio-web.vercel.app`);
    console.log(`NEXTAUTH_SECRET=super_secret_random_long_string_for_github_auth`);
    console.log(`GITHUB_CLIENT_ID=Iv23lilRpILDJ1O5enls`);
    console.log(`GITHUB_CLIENT_SECRET=3823653945db788d4cf53ad06caecaf59068d044`);
    console.log(`GITHUB_APP_ID=1225175`);
    console.log(`NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`);
    console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}`);
    console.log(`SUPABASE_SERVICE_KEY=${supabaseServiceKey}`);
    
  } catch (error) {
    console.error('שגיאה לא צפויה:', error.message);
  }
}

// הפעלת הפונקציה
testLogin(); 