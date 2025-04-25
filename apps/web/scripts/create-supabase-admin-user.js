const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { join } = require('path');
const fs = require('fs');

// טעינת קובץ הסביבה
const envPath = join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.log('קובץ .env.local לא נמצא, משתמש במשתני סביבה קיימים');
}

// פרטי התחברות ל-Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('אנא הגדר את המשתנים הבאים ב-.env.local:');
  console.error('NEXT_PUBLIC_SUPABASE_URL');
  console.error('SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// פרטי המשתמש - אפשר לשנות כרצונך
const DEFAULT_EMAIL = 'admin@example.com';
const DEFAULT_PASSWORD = 'Password123!';

async function createAdminUser() {
  const userEmail = process.argv[2] || DEFAULT_EMAIL;
  const userPassword = process.argv[3] || DEFAULT_PASSWORD;

  console.log(`מנסה ליצור משתמש אדמין עם דוא"ל: ${userEmail}`);

  try {
    // בדיקה אם המשתמש כבר קיים באמצעות Supabase Auth API
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('שגיאה בבדיקת משתמשים קיימים:', getUserError.message);
      return;
    }

    const existingUser = users.find(user => user.email === userEmail);
    if (existingUser) {
      console.log(`משתמש עם דוא"ל ${userEmail} כבר קיים במערכת.`);
      console.log('פרטי המשתמש:');
      console.log(`דוא"ל: ${userEmail}`);
      console.log(`סיסמה: ${userPassword} (לא השתנתה אם המשתמש קיים)`);
      console.log(`מזהה: ${existingUser.id}`);
      return;
    }

    // יצירת משתמש באמצעות Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
    });

    if (authError) {
      console.error('שגיאה ביצירת משתמש:', authError.message);
      return;
    }

    const userId = authUser.user.id;

    console.log('משתמש אדמין נוצר בהצלחה!');
    console.log('פרטי המשתמש:');
    console.log(`דוא"ל: ${userEmail}`);
    console.log(`סיסמה: ${userPassword}`);
    console.log(`מזהה: ${userId}`);
    console.log('השתמש בפרטים אלה להתחברות למערכת.');
    console.log('\nהערה:');
    console.log('כדי שהמשתמש יפעל באופן מלא, יש ליצור גם את טבלת המשתמשים בסופאבייס ולהכניס את פרטי המשתמש לטבלה.');
    console.log('הריצו את הפקודה SQL הבאה בממשק של סופאבייס:');
    console.log(`
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- הוסף את המשתמש לטבלה
INSERT INTO public.users (id, email, username, created_at, updated_at)
VALUES ('${userId}', '${userEmail}', 'admin', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
    `);

  } catch (error) {
    console.error('שגיאה לא צפויה:', error);
  }
}

createAdminUser(); 