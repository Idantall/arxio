/**
 * סקריפט להוספת עמודת auto_scan לטבלת projects
 * 
 * מה הסקריפט הזה עושה?
 * 1. בודק אם עמודת auto_scan קיימת בטבלת projects
 * 2. אם לא קיימת, מוסיף את העמודה עם ערך ברירת מחדל true
 * 
 * הרצה: 
 * node apps/web/scripts/add-auto-scan-column.js
 */

const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// קריאת משתני סביבה מקובץ .env.local
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      
      envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // הסרת מרכאות אם יש
          envVars[key] = value;
        }
      });
      
      return envVars;
    }
  } catch (error) {
    console.error('שגיאה בקריאת קובץ .env.local:', error);
  }
  
  return {};
}

// טעינת המשתנים
const env = loadEnv();

// הדפסת האם יש משתני סביבה
console.log('NEXT_PUBLIC_SUPABASE_URL קיים:', !!env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY קיים:', !!env.SUPABASE_SERVICE_KEY);

// הצגת הערכים במידת הצורך (לדיבוג)
if (!env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('בבקשה להגדיר את NEXT_PUBLIC_SUPABASE_URL בקובץ .env.local');
}

if (!env.SUPABASE_SERVICE_KEY) {
  console.log('בבקשה להגדיר את SUPABASE_SERVICE_KEY בקובץ .env.local');
}

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
  console.error('חסרים משתני סביבה נדרשים! לא ניתן להמשיך.');
  process.exit(1);
}

// אתחול לקוח סופאבייס עם מפתח השירות לגישה מלאה
const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function addAutoScanColumn() {
  try {
    console.log('בודק אם העמודה auto_scan קיימת בטבלת projects...');
    
    // בדיקה אם העמודה קיימת - ננסה לבחור ממנה
    const { error: columnCheckError } = await supabaseAdmin
      .from('projects')
      .select('auto_scan')
      .limit(1);
    
    // אם אין שגיאה, העמודה כבר קיימת
    if (!columnCheckError) {
      console.log('העמודה auto_scan כבר קיימת בטבלה');
      return;
    }
    
    // הדפסת השגיאה לדיבוג
    console.log('שגיאת בדיקת העמודה:', columnCheckError);
    
    // בדיקה אם השגיאה היא מסוג "שדה לא קיים"
    if (columnCheckError && columnCheckError.message && 
        columnCheckError.message.includes('auto_scan')) {
      console.log('העמודה auto_scan לא קיימת בטבלה, מוסיף אותה...');
      
      // הוספת העמודה באמצעות RPC עם SQL
      const { error: addColumnError } = await supabaseAdmin.rpc('pgql', { 
        query: `
          ALTER TABLE public.projects 
          ADD COLUMN IF NOT EXISTS auto_scan BOOLEAN DEFAULT true;
        `
      });
      
      if (addColumnError) {
        console.error('שגיאה בהוספת העמודה:', addColumnError);
        throw addColumnError;
      }
      
      console.log('העמודה auto_scan נוספה בהצלחה!');
    } else {
      // אם השגיאה היא מסוג אחר (למשל הטבלה לא קיימת)
      console.error('שגיאה בבדיקת העמודה:', columnCheckError);
    }
  } catch (error) {
    console.error('שגיאה כללית בזמן הוספת העמודה:', error);
  }
}

// הרצת הפונקציה הראשית
addAutoScanColumn()
  .then(() => {
    console.log('הסקריפט הסתיים בהצלחה');
    process.exit(0);
  })
  .catch(error => {
    console.error('הסקריפט נכשל:', error);
    process.exit(1);
  }); 