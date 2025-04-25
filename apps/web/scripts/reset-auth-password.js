#!/usr/bin/env node

// טעינת משתני סביבה
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// פרטי התחברות לסופרבייס
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('פרטי התחברות לסופרבייס חסרים בקובץ .env.local');
  process.exit(1);
}

// יצירת לקוח סופרבייס עם הרשאות מלאות
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// פרטי המשתמש לאיפוס
const testUser = {
  email: 'test@example.com',
  password: 'Test1234!'
};

async function resetUserPassword() {
  try {
    console.log(`מחפש משתמש עם אימייל: ${testUser.email}...`);
    
    // בדיקה אם המשתמש קיים במערכת האימות של סופרבייס
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('שגיאה בקבלת רשימת משתמשים:', listError);
      return;
    }
    
    // חיפוש המשתמש
    const authUser = authUsers.users.find(user => user.email === testUser.email);
    
    if (!authUser) {
      console.log(`משתמש עם אימייל ${testUser.email} לא נמצא במערכת האימות!`);
      console.log('יוצר משתמש חדש...');
      
      // יצירת משתמש חדש במערכת האימות
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          username: 'testuser'
        }
      });
      
      if (createError) {
        console.error('שגיאה ביצירת משתמש:', createError);
        return;
      }
      
      console.log('משתמש נוצר בהצלחה!');
      console.log('פרטי המשתמש:', {
        id: newUser.user.id,
        email: newUser.user.email
      });
      
      // בדיקה אם המשתמש קיים בטבלת users
      await syncUserWithDB(newUser.user);
      
    } else {
      console.log(`משתמש נמצא! ID: ${authUser.id}`);
      
      // איפוס הסיסמה של המשתמש הקיים
      console.log('מאפס סיסמה...');
      
      const { data: updateResult, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        authUser.id,
        {
          password: testUser.password,
          email_confirm: true
        }
      );
      
      if (updateError) {
        console.error('שגיאה באיפוס הסיסמה:', updateError);
        return;
      }
      
      console.log('סיסמה אופסה בהצלחה!');
      
      // סנכרון עם טבלת users
      await syncUserWithDB(authUser);
    }
    
    console.log('\nפרטי התחברות:');
    console.log(`אימייל: ${testUser.email}`);
    console.log(`סיסמה: ${testUser.password}`);
    console.log('\nהערות חשובות:');
    console.log('- מערכת האימות משתמשת ב-Supabase Auth ולא בטבלת users');
    console.log('- עמודת password בטבלת users לא משמשת לאימות');
    console.log('- תוודא שה-ID של המשתמש זהה בין מערכת האימות לטבלת users');
    
  } catch (error) {
    console.error('שגיאה לא צפויה:', error);
  }
}

// פונקציה לסנכרון משתמש עם טבלת users
async function syncUserWithDB(authUser) {
  try {
    console.log('בודק אם המשתמש קיים בטבלת users...');
    
    // בדיקה אם המשתמש כבר קיים בטבלת users
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', authUser.email)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('שגיאה בבדיקת קיום המשתמש בטבלה:', checkError);
      return;
    }
    
    if (existingUser) {
      console.log('המשתמש קיים בטבלת users עם ID:', existingUser.id);
      
      // אם ה-ID לא תואם, נעדכן אותו
      if (existingUser.id !== authUser.id) {
        console.log('ה-ID בטבלת users לא תואם ל-ID במערכת האימות!');
        console.log(`טבלת users: ${existingUser.id}`);
        console.log(`מערכת אימות: ${authUser.id}`);
        console.log('מעדכן את הרשומה...');
        
        // עדכון ה-ID
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            id: authUser.id,
            updated_at: new Date().toISOString()
          })
          .eq('email', authUser.email);
        
        if (updateError) {
          console.error('שגיאה בעדכון ה-ID:', updateError);
          return;
        }
        
        console.log('ה-ID עודכן בהצלחה!');
      }
    } else {
      console.log('המשתמש לא קיים בטבלת users, יוצר רשומה חדשה...');
      
      // יצירת רשומה חדשה בטבלת users
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          username: authUser.user_metadata?.username || authUser.email.split('@')[0],
          created_at: authUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('שגיאה ביצירת רשומה בטבלת users:', insertError);
        return;
      }
      
      console.log('רשומה נוצרה בהצלחה בטבלת users!');
    }
    
  } catch (error) {
    console.error('שגיאה בסנכרון עם טבלת users:', error);
  }
}

// הפעלת הפונקציה הראשית
resetUserPassword()
  .then(() => {
    console.log('\nהסקריפט הסתיים בהצלחה!');
    process.exit(0);
  })
  .catch(error => {
    console.error('שגיאה בהרצת הסקריפט:', error);
    process.exit(1);
  }); 