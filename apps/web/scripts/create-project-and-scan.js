const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const readline = require('readline');

// פונקציה ליצירת UUID ייחודי
function generateUuid() {
  return crypto.randomUUID();
}

// פרטי התחברות לסופאבייס
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';

// יצירת קליינט סופרבייס
let supabase = createClient(supabaseUrl, supabaseKey);

// פרמטרים מוגדרים מראש
const EMAIL = process.env.SUPABASE_EMAIL || ""; // יש למלא או להגדיר כמשתנה סביבה
const PASSWORD = process.env.SUPABASE_PASSWORD || ""; // יש למלא או להגדיר כמשתנה סביבה
const PROJECT_NAME = "idanss.com";
const PROJECT_DESC = "אתר הבית של עידן סטריק";
const REPO_TYPE = "git";
const REPO_URL = "https://github.com/idantall/idanss";
const BRANCH = "main";
const PROVIDER = "github";

/**
 * מעדכן את הסשן של סופרבייס לאחר התחברות
 */
async function updateSupabaseClient(session) {
  if (session) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    });
    console.log('עודכן קליינט סופרבייס עם טוקן המשתמש');
  }
}

/**
 * שואל את המשתמש לקלט באמצעות שורת הפקודה
 */
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

/**
 * מבצע התחברות לסופאבייס
 */
async function login() {
  console.log('נדרשת התחברות לפני יצירת פרויקט וסריקה...');
  
  // אם קיימים פרטים מוגדרים מראש, השתמש בהם
  let email = EMAIL;
  let password = PASSWORD;
  
  // אחרת, שאל את המשתמש
  if (!email) {
    email = await askQuestion('הכנס כתובת אימייל: ');
  }
  
  if (!password) {
    password = await askQuestion('הכנס סיסמה: ');
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('שגיאת התחברות:', error.message);
      return null;
    }
    
    console.log(`התחברת בהצלחה כמשתמש: ${data.user.email}`);
    await updateSupabaseClient(data.session);
    return data.user.id;
  } catch (error) {
    console.error('שגיאה בתהליך ההתחברות:', error);
    return null;
  }
}

/**
 * יצירת פרויקט חדש
 */
async function createProject(userId) {
  if (!userId) {
    console.error('לא ניתן ליצור פרויקט ללא משתמש מחובר');
    return null;
  }
  
  console.log(`מנסה ליצור פרויקט עבור ${PROJECT_NAME}...`);
  
  const projectId = generateUuid();
  const now = new Date().toISOString();
  
  const projectData = {
    id: projectId,
    user_id: userId,
    name: PROJECT_NAME,
    description: PROJECT_DESC,
    repository_type: REPO_TYPE,
    repository_url: REPO_URL,
    branch: BRANCH,
    repository_provider: PROVIDER,
    status: 'active',
    created_at: now,
    updated_at: now,
  };
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select();
    
    if (error) {
      console.error('שגיאה ביצירת פרויקט:', error.message);
      return null;
    }
    
    console.log('פרויקט נוצר בהצלחה!');
    console.log(`מזהה: ${projectId}`);
    console.log(`שם: ${PROJECT_NAME}`);
    return projectId;
  } catch (error) {
    console.error('שגיאה ביצירת פרויקט:', error);
    return null;
  }
}

/**
 * יצירת סריקה עבור פרויקט
 */
async function createScan(userId, projectId) {
  if (!userId || !projectId) {
    console.error('לא ניתן ליצור סריקה ללא משתמש מחובר ופרויקט');
    return null;
  }
  
  console.log(`מנסה ליצור סריקת DAST עבור ${PROJECT_NAME}...`);
  
  const scanId = generateUuid();
  const now = new Date();
  const completedTime = new Date(now.getTime() + 3600000); // שעה אחרי ההתחלה
  
  const scanData = {
    id: scanId,
    project_id: projectId,
    name: `DAST סריקה ראשונית - ${PROJECT_NAME}`,
    type: 'DAST',
    target: `https://${PROJECT_NAME}`,
    status: 'completed',
    user_id: userId,
    created_at: now.toISOString(),
    start_time: now.toISOString(),
    completed_at: completedTime.toISOString(),
    findings_count: 18,
    parameters: {
      depth: 'full',
      include_subdomains: true,
      max_scan_duration: 3600
    }
  };
  
  try {
    const { data, error } = await supabase
      .from('scans')
      .insert(scanData)
      .select();
    
    if (error) {
      console.error('שגיאה ביצירת סריקה:', error.message);
      return null;
    }
    
    console.log('סריקה נוצרה בהצלחה!');
    console.log(`מזהה: ${scanId}`);
    return scanId;
  } catch (error) {
    console.error('שגיאה ביצירת סריקה:', error);
    return null;
  }
}

/**
 * הוספת ממצאים לסריקה
 */
async function addFindings(scanId, userId) {
  if (!scanId) {
    console.error('לא ניתן להוסיף ממצאים ללא מזהה סריקה');
    return false;
  }
  
  console.log(`מוסיף ממצאים לסריקה ${scanId}...`);
  
  // בדיקה האם הסריקה שייכת למשתמש הנוכחי
  const { data: scanData, error: scanError } = await supabase
    .from('scans')
    .select('id, user_id')
    .eq('id', scanId)
    .single();
  
  if (scanError || !scanData) {
    console.error('הסריקה לא נמצאה:', scanError?.message || 'סריקה לא קיימת');
    return false;
  }
  
  if (scanData.user_id !== userId) {
    console.error('הסריקה אינה שייכת למשתמש הנוכחי');
    return false;
  }
  
  // רשימת ממצאים לדוגמה
  const findings = [
    {
      scan_id: scanId,
      severity: 'critical',
      rule_id: 'DAST-XSS-001',
      title: 'חולשת XSS בטופס יצירת קשר',
      description: 'זוהתה אפשרות להזרקת סקריפט זדוני בטופס יצירת קשר שעלולה לאפשר לתוקף לגנוב מידע מהמשתמשים'
    },
    {
      scan_id: scanId,
      severity: 'high',
      rule_id: 'DAST-INJECTION-002',
      title: 'חולשת SQL Injection במנוע החיפוש',
      description: 'זוהתה אפשרות להזרקת SQL במנוע החיפוש שעלולה לאפשר לתוקף לגשת לכל המידע במסד הנתונים'
    },
    {
      scan_id: scanId,
      severity: 'high',
      rule_id: 'DAST-CSRF-003',
      title: 'חולשת CSRF בעדכון פרופיל',
      description: 'חסר מנגנון הגנה מפני CSRF בטפסי עדכון פרופיל שעלול לאפשר לתוקף לבצע פעולות בשם המשתמש'
    },
    {
      scan_id: scanId,
      severity: 'medium',
      rule_id: 'DAST-SEC-HEADERS-004',
      title: 'חסר כותרות אבטחה חיוניות',
      description: 'חסרות כותרות אבטחה חיוניות כמו Content-Security-Policy וכותרות X-Frame-Options'
    },
    {
      scan_id: scanId,
      severity: 'medium',
      rule_id: 'DAST-COOKIE-005',
      title: 'הגדרות לא מאובטחות של עוגיות',
      description: 'העוגיות באתר מוגדרות ללא דגלי HttpOnly ו-Secure, מה שחושף אותן לסכנת גניבה'
    },
    {
      scan_id: scanId,
      severity: 'low',
      rule_id: 'DAST-INFO-LEAK-006',
      title: 'דליפת מידע בשגיאות שרת',
      description: 'הודעות שגיאה חושפות מידע רגיש על מערכת הרקע והקונפיגורציה של השרת'
    }
  ];
  
  let successCount = 0;
  
  for (const finding of findings) {
    try {
      const { error } = await supabase
        .from('findings')
        .insert(finding);
      
      if (error) {
        console.error(`שגיאה בהוספת ממצא ${finding.rule_id}:`, error.message);
      } else {
        successCount++;
      }
    } catch (error) {
      console.error(`שגיאה כללית בהוספת ממצא ${finding.rule_id}:`, error);
    }
  }
  
  console.log(`נוספו ${successCount} מתוך ${findings.length} ממצאים בהצלחה`);
  return successCount > 0;
}

/**
 * פונקציה ראשית
 */
async function main() {
  try {
    // התחברות למערכת
    const userId = await login();
    if (!userId) {
      console.error('הסתיים ללא הצלחה - ההתחברות נכשלה');
      return;
    }
    
    // יצירת פרויקט
    const projectId = await createProject(userId);
    if (!projectId) {
      console.error('הסתיים ללא הצלחה - לא נוצר פרויקט');
      return;
    }
    
    // יצירת סריקה
    const scanId = await createScan(userId, projectId);
    if (!scanId) {
      console.error('הסתיים ללא הצלחה - לא נוצרה סריקה');
      return;
    }
    
    // הוספת ממצאים
    const findingsAdded = await addFindings(scanId, userId);
    
    if (findingsAdded) {
      console.log('\nהתהליך הושלם בהצלחה!');
      console.log(`מזהה פרויקט: ${projectId}`);
      console.log(`מזהה סריקה: ${scanId}`);
      console.log('\nכעת ניתן לצפות בנתונים במערכת.');
    } else {
      console.log('\nהתהליך הושלם חלקית - נוצרו פרויקט וסריקה אך לא נוספו ממצאים.');
    }
  } catch (error) {
    console.error('שגיאה כללית:', error);
  }
}

// הפעלת התוכנית
main(); 