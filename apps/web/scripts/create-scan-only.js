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

const supabase = createClient(supabaseUrl, supabaseKey);

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
  console.log('נדרשת התחברות לפני יצירת סריקה...');
  
  const email = await askQuestion('הכנס כתובת אימייל: ');
  const password = await askQuestion('הכנס סיסמה: ');
  
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
    return data.user.id;
  } catch (error) {
    console.error('שגיאה בתהליך ההתחברות:', error);
    return null;
  }
}

/**
 * יצירת סריקה לאתר idanss.com
 */
async function createIdanScan(userId) {
  if (!userId) {
    console.error('לא ניתן ליצור סריקה ללא משתמש מחובר');
    return null;
  }
  
  console.log('מנסה ליצור סריקה לאתר idanss.com...');
  
  const scanId = generateUuid();
  const now = new Date();
  const completedTime = new Date(now.getTime() + 3600000); // שעה אחרי ההתחלה
  
  const scanData = {
    id: scanId,
    name: 'DAST סריקה ראשונית של idanss.com',
    type: 'DAST',
    target: 'https://idanss.com',
    status: 'completed',
    user_id: userId,  // הוספנו את מזהה המשתמש
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
async function addFindings(scanId) {
  if (!scanId) {
    console.error('לא ניתן להוסיף ממצאים ללא מזהה סריקה');
    return false;
  }
  
  console.log(`מוסיף ממצאים לסריקה ${scanId}...`);
  
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
    
    // יצירת סריקה
    const scanId = await createIdanScan(userId);
    if (!scanId) {
      console.error('הסתיים ללא הצלחה - לא נוצרה סריקה');
      return;
    }
    
    // הוספת ממצאים
    const findingsAdded = await addFindings(scanId);
    
    if (findingsAdded) {
      console.log('\nהתהליך הושלם בהצלחה!');
      console.log(`מזהה סריקה: ${scanId}`);
      console.log('\nכעת ניתן לצפות בנתונים במערכת.');
    } else {
      console.log('\nהתהליך הושלם חלקית - נוצרה סריקה אך לא נוספו ממצאים.');
    }
  } catch (error) {
    console.error('שגיאה כללית:', error);
  }
}

// הפעלת התוכנית
main(); 