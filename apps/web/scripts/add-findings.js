const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// פרטי התחברות לסופאבייס
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
// האזהרה: מפתח זה הוא דוגמה בלבד. בסביבת ייצור יש להשתמש ב-service role key אמיתי ולשמור אותו בסביבה מאובטחת
const serviceRoleKey = 'יש להחליף עם service role key אמיתי';

// יצירת קליינט סופרבייס עם service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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
 * הוספת ממצאים לסריקה
 */
async function addFindings(scanId) {
  if (!scanId) {
    console.error('לא ניתן להוסיף ממצאים ללא מזהה סריקה');
    return false;
  }
  
  console.log(`מוסיף ממצאים לסריקה ${scanId}...`);
  
  // בדיקה האם הסריקה קיימת
  const { data: scanData, error: scanError } = await supabase
    .from('scans')
    .select('id')
    .eq('id', scanId)
    .single();
  
  if (scanError || !scanData) {
    console.error('הסריקה לא נמצאה:', scanError?.message || 'סריקה לא קיימת');
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
    const scanId = await askQuestion('הכנס מזהה סריקה: ');
    if (!scanId) {
      console.error('לא סופק מזהה סריקה');
      return;
    }
    
    // הוספת ממצאים
    const findingsAdded = await addFindings(scanId);
    
    if (findingsAdded) {
      console.log('\nהתהליך הושלם בהצלחה!');
    } else {
      console.log('\nהתהליך נכשל - לא נוספו ממצאים.');
    }
  } catch (error) {
    console.error('שגיאה כללית:', error);
  }
}

// הפעלת התוכנית
main(); 