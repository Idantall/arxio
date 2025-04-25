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
const DEFAULT_USERNAME = 'admin';

async function createUser() {
  const userEmail = process.argv[2] || DEFAULT_EMAIL;
  const userPassword = process.argv[3] || DEFAULT_PASSWORD;
  const username = process.argv[4] || DEFAULT_USERNAME;

  console.log(`מנסה ליצור משתמש עם דוא"ל: ${userEmail}`);

  try {
    // בדיקה אם המשתמש כבר קיים
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', userEmail)
      .maybeSingle();

    if (existingUser) {
      console.log(`משתמש עם דוא"ל ${userEmail} כבר קיים במסד הנתונים.`);
      return;
    }

    // יצירת משתמש באמצעות Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
    });

    if (authError) {
      console.error('שגיאה ביצירת משתמש במערכת האימות:', authError.message);
      return;
    }

    const userId = authUser.user.id;
    console.log(`משתמש נוצר בהצלחה עם ID: ${userId}`);

    // הוספת פרטי משתמש לטבלת users
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert([{ id: userId, email: userEmail, username, created_at: new Date().toISOString() }]);

    if (profileError) {
      console.error('שגיאה בהוספת פרטי משתמש לטבלה:', profileError.message);
      return;
    }

    console.log('משתמש נוצר בהצלחה! פרטי התחברות:');
    console.log(`דוא"ל: ${userEmail}`);
    console.log(`סיסמה: ${userPassword}`);
    console.log(`שם משתמש: ${username}`);
    console.log('השתמש בפרטים אלה להתחברות למערכת.');

  } catch (error) {
    console.error('שגיאה לא צפויה:', error);
  }
}

createUser(); 