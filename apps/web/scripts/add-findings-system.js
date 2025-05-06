const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// פרטי התחברות לסופאבייס
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
// מפתח ה-service role
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTI3Mzk0MSwiZXhwIjoyMDYwODQ5OTQxfQ.mnXnBpFFOytuio-rgjyx_vbthCnPmhaLaFwyH2oXLko';

// יצירת קליינט סופרבייס עם הרשאות service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * פונקציה להוספת ממצאים למערכת - מיועדת להרצה דרך CRON או מערכת הסריקה
 * @param {string} scanId - מזהה הסריקה
 * @param {Array} findingsData - מערך של ממצאים
 * @returns {Promise<boolean>} - האם ההוספה הצליחה
 */
async function addSystemFindings(scanId, findingsData) {
  if (!scanId) {
    console.error('לא ניתן להוסיף ממצאים ללא מזהה סריקה');
    return false;
  }
  
  if (!findingsData || !Array.isArray(findingsData) || findingsData.length === 0) {
    console.error('לא סופקו ממצאים להוספה');
    return false;
  }
  
  console.log(`[מערכת] מוסיף ${findingsData.length} ממצאים לסריקה ${scanId}...`);
  
  // וידוא שהסריקה קיימת
  const { data: scanExists, error: scanError } = await supabase
    .from('scans')
    .select('id')
    .eq('id', scanId)
    .single();
  
  if (scanError) {
    console.error('שגיאה בבדיקת קיום הסריקה:', scanError.message);
    return false;
  }
  
  if (!scanExists) {
    console.error(`סריקה עם מזהה ${scanId} לא קיימת במערכת`);
    return false;
  }
  
  // מיפוי ממצאים עם מזהה הסריקה
  const formattedFindings = findingsData.map(finding => ({
    id: crypto.randomUUID(),
    scan_id: scanId,
    ...finding,
    created_at: new Date().toISOString()
  }));
  
  // הוספת ממצאים
  const { error: insertError } = await supabase
    .from('findings')
    .insert(formattedFindings);
  
  if (insertError) {
    console.error('שגיאה בהוספת ממצאים:', insertError.message);
    return false;
  }
  
  // עדכון מונה הממצאים בסריקה
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };
  
  // ספירת ממצאים לפי חומרה
  formattedFindings.forEach(finding => {
    const severity = finding.severity.toLowerCase();
    if (severityCounts.hasOwnProperty(severity)) {
      severityCounts[severity]++;
    }
  });
  
  // עדכון הספירה בסריקה
  const { error: updateError } = await supabase
    .from('scans')
    .update({
      findings_count: severityCounts,
      status: 'completed'
    })
    .eq('id', scanId);
  
  if (updateError) {
    console.error('שגיאה בעדכון מונה הממצאים בסריקה:', updateError.message);
  }
  
  console.log(`[מערכת] נוספו ${formattedFindings.length} ממצאים בהצלחה`);
  console.log(`[מערכת] סיכום ממצאים לפי חומרה:`, severityCounts);
  
  return true;
}

/**
 * דוגמה לשימוש - הוספת ממצאים לסריקה קיימת
 */
async function exampleAddFindings() {
  // מזהה הסריקה שיש להוסיף לה ממצאים
  const scanId = process.argv[2];
  
  if (!scanId) {
    console.error('אנא ספק מזהה סריקה כפרמטר ראשון');
    process.exit(1);
  }
  
  // דוגמה לממצאים
  const sampleFindings = [
    {
      rule_id: 'DAST-XSS-001',
      title: 'חולשת XSS בטופס יצירת קשר',
      description: 'זוהתה אפשרות להזרקת סקריפט זדוני בטופס יצירת קשר שעלולה לאפשר לתוקף לגנוב מידע מהמשתמשים',
      severity: 'critical',
      details: {
        path: '/contact',
        parameter: 'message',
        impact: 'גניבת מידע רגיש, ביצוע פעולות מזויפות בשם המשתמש',
        remediation: 'יש לבצע סניטציה לכל קלטי המשתמש לפני הצגתם באתר'
      }
    },
    {
      rule_id: 'DAST-INJECTION-002',
      title: 'חולשת SQL Injection במנוע החיפוש',
      description: 'זוהתה אפשרות להזרקת SQL במנוע החיפוש שעלולה לאפשר לתוקף לגשת לכל המידע במסד הנתונים',
      severity: 'high',
      details: {
        path: '/search',
        parameter: 'q',
        impact: 'גישה לא מורשית למידע, עדכון/מחיקה של נתונים',
        remediation: 'יש להשתמש בפרמטרים מוכנים (prepared statements) בכל פניות SQL'
      }
    },
    {
      rule_id: 'DAST-CSRF-003',
      title: 'חולשת CSRF בעדכון פרופיל',
      description: 'חסר מנגנון הגנה מפני CSRF בטפסי עדכון פרופיל שעלול לאפשר לתוקף לבצע פעולות בשם המשתמש',
      severity: 'high',
      details: {
        path: '/profile/update',
        parameter: '-',
        impact: 'ביצוע פעולות לא מכוונות בשם המשתמש',
        remediation: 'יש להוסיף טוקן CSRF לכל הטפסים ולאמת אותו בצד השרת'
      }
    },
    {
      rule_id: 'DAST-SEC-HEADERS-004',
      title: 'חסר כותרות אבטחה חיוניות',
      description: 'חסרות כותרות אבטחה חיוניות כמו Content-Security-Policy וכותרות X-Frame-Options',
      severity: 'medium',
      details: {
        path: '/',
        parameter: '-',
        impact: 'הגברת הסיכון לחולשות XSS ואחרות',
        remediation: 'יש להוסיף כותרות אבטחה מומלצות לכל התשובות מהשרת'
      }
    },
    {
      rule_id: 'DAST-COOKIE-005',
      title: 'הגדרות לא מאובטחות של עוגיות',
      description: 'העוגיות באתר מוגדרות ללא דגלי HttpOnly ו-Secure, מה שחושף אותן לסכנת גניבה',
      severity: 'medium',
      details: {
        path: '/',
        parameter: '-',
        impact: 'גניבת עוגיות ומידע רגיש',
        remediation: 'יש להגדיר דגלי HttpOnly ו-Secure לכל העוגיות הרגישות'
      }
    },
    {
      rule_id: 'DAST-INFO-LEAK-006',
      title: 'דליפת מידע בשגיאות שרת',
      description: 'הודעות שגיאה חושפות מידע רגיש על מערכת הרקע והקונפיגורציה של השרת',
      severity: 'low',
      details: {
        path: '/error',
        parameter: '-',
        impact: 'איסוף מידע על השרת לצורך התקפות עתידיות',
        remediation: 'יש להגדיר הודעות שגיאה גנריות ללא פרטים טכניים'
      }
    }
  ];
  
  // הוספת הממצאים
  const success = await addSystemFindings(scanId, sampleFindings);
  
  if (success) {
    console.log('הממצאים נוספו בהצלחה!');
  } else {
    console.error('הוספת הממצאים נכשלה');
    process.exit(1);
  }
}

// הרצת דוגמה אם הסקריפט הופעל ישירות
if (require.main === module) {
  exampleAddFindings();
}

// ייצוא הפונקציה לשימוש במודולים אחרים
module.exports = {
  addSystemFindings
}; 