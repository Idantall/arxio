#!/usr/bin/env node

// יצירת משתמש ופרויקט לדוגמה בסופאבייס
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// מפתחות סופאבייס
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('חסרים מפתחות סופאבייס בקובץ .env.local!');
  console.error('נדרשים: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// יצירת לקוח סופאבייס עם הרשאות אדמין
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// יצירת פרויקט לדוגמה
async function createExampleProject() {
  try {
    console.log('מחפש משתמשים קיימים...');
    
    // שליפת משתמשים מאימות של סופאבייס
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('שגיאה בקבלת רשימת משתמשים:', authError);
      return;
    }
    
    if (!authUsers || !authUsers.users || authUsers.users.length === 0) {
      console.log('לא נמצאו משתמשים במערכת!');
      return;
    }
    
    // נשתמש במשתמש הראשון ברשימה
    const userId = authUsers.users[0].id;
    console.log(`נמצא משתמש לדוגמה: ${userId}`);
    
    // בדיקה אם יש כבר פרויקטים למשתמש זה
    try {
      console.log('בודק אם כבר יש פרויקטים למשתמש זה...');
      const { data: existingProjects, error: projectCheckError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('user_id', userId);
      
      if (!projectCheckError && existingProjects && existingProjects.length > 0) {
        console.log(`נמצאו ${existingProjects.length} פרויקטים קיימים למשתמש. לא יוצר פרויקט חדש.`);
        return;
      }
    } catch (err) {
      // ייתכן שהטבלה לא קיימת, נמשיך ליצירת פרויקט
      console.log('הטבלה כנראה לא קיימת, ממשיך ליצירה...');
    }
    
    console.log('יוצר פרויקט לדוגמה למשתמש...');
    
    // יצירת פרויקט לדוגמה
    const projectData = {
      user_id: userId,
      name: 'פרויקט לדוגמה',
      description: 'פרויקט ראשון שנוצר אוטומטית',
      repository_type: 'web',
      repository_url: 'https://example.com',
      branch: 'main',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // ניסיון ליצור פרויקט באמצעות API רגיל
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert([projectData])
      .select();
    
    if (projectError) {
      // אם יש שגיאה מסוג "relation does not exist", ננסה ליצור את הטבלה באמצעות האימות API
      if (projectError.message && projectError.message.includes('relation "projects" does not exist')) {
        console.log('טבלת projects לא קיימת. יוצר טבלה באמצעות הוספת מידע למשתמש...');
        
        // במקום ליצור טבלה, נשמור את המידע כמטה-דאטה של המשתמש
        const { data: userUpdate, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { 
            user_metadata: { 
              projects: [projectData] 
            } 
          }
        );
        
        if (updateError) {
          console.error('שגיאה בשמירת נתוני פרויקט למטה-דאטה של המשתמש:', updateError);
        } else {
          console.log('פרויקט נשמר כמטה-דאטה של המשתמש:', userUpdate);
        }
      } else {
        console.error('שגיאה ביצירת פרויקט:', projectError);
      }
    } else {
      console.log('פרויקט לדוגמה נוצר בהצלחה:', project);
    }
  } catch (error) {
    console.error('שגיאה כללית:', error);
  }
}

// הצגת פרטי המשתמש הקיים
async function showExistingUser() {
  try {
    console.log('מציג פרטי משתמש לדוגמה...');
    
    // שליפת משתמשים מאימות של סופאבייס
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('שגיאה בקבלת רשימת משתמשים:', authError);
      return;
    }
    
    if (!authUsers || !authUsers.users || authUsers.users.length === 0) {
      console.log('לא נמצאו משתמשים במערכת!');
      return;
    }
    
    const user = authUsers.users[0];
    console.log('פרטי משתמש לדוגמה:');
    console.log('ID:', user.id);
    console.log('אימייל:', user.email);
    console.log('אימייל מאומת:', user.email_confirmed_at ? 'כן' : 'לא');
    console.log('הרשאות:', user.role);
    console.log('מטה-דאטה:', user.user_metadata);
    
    return user;
  } catch (error) {
    console.error('שגיאה בהצגת פרטי משתמש:', error);
  }
}

// הצגת מה יש בבסיס הנתונים
async function showDatabaseTables() {
  try {
    console.log('מציג טבלאות בבסיס הנתונים...');
    
    // ננסה לקרוא נתונים מכמה טבלאות נפוצות
    const tables = ['users', 'profiles', 'projects', 'scans'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(3);
        
        if (error) {
          console.log(`טבלה '${table}' לא קיימת או שאין גישה אליה:`, error.message);
        } else {
          console.log(`טבלה '${table}' קיימת, מספר שורות:`, data?.length || 0);
          if (data && data.length > 0) {
            console.log(`דוגמה מטבלה '${table}':`, data[0]);
          }
        }
      } catch (e) {
        console.log(`שגיאה בבדיקת טבלה '${table}':`, e.message);
      }
    }
  } catch (error) {
    console.error('שגיאה בהצגת טבלאות:', error);
  }
}

// הרצת כל הפונקציות
async function main() {
  try {
    // הצגת פרטי המשתמש הקיים
    const user = await showExistingUser();
    
    if (!user) {
      console.error('לא נמצא משתמש! יש ליצור משתמש תחילה באמצעות הסקריפט create-hardcoded-user.js');
      process.exit(1);
    }
    
    // הצגת טבלאות קיימות בבסיס הנתונים
    await showDatabaseTables();
    
    // יצירת פרויקט לדוגמה
    await createExampleProject();
    
    console.log('הסקריפט הסתיים בהצלחה!');
  } catch (error) {
    console.error('שגיאה בהרצת הסקריפט:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('שגיאה בלתי צפויה:', err);
    process.exit(1);
  }); 