const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// פונקציה ליצירת UUID ייחודי
function generateUuid() {
  return crypto.randomUUID();
}

// פרטי התחברות לסופאבייס
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * יצירת פרויקט עבור idanss.com
 */
async function createProject() {
  console.log('יוצר פרויקט עבור idanss.com...');
  
  // מזהה ייחודי לפרויקט
  const projectId = generateUuid();
  
  // נתוני הפרויקט לפי מבנה הטבלה
  const projectData = {
    id: projectId,
    name: 'Idan Software Solutions',
    description: 'אתר החברה של עידן המספק שירותי פיתוח ואבטחת מידע',
    repository_type: 'website',
    repository_url: 'https://idanss.com',
    status: 'active',
    security_status: 'medium'
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
    
    console.log(`פרויקט נוצר בהצלחה! מזהה: ${projectId}`);
    return projectId;
    
  } catch (error) {
    console.error('שגיאה כללית ביצירת פרויקט:', error);
    return null;
  }
}

/**
 * יצירת סריקה עבור הפרויקט
 */
async function createScan(projectId) {
  if (!projectId) {
    console.error('לא ניתן ליצור סריקה ללא מזהה פרויקט');
    return null;
  }
  
  console.log(`יוצר סריקה עבור פרויקט ${projectId}...`);
  
  // מזהה ייחודי לסריקה
  const scanId = generateUuid();
  
  // נתוני הסריקה לפי מבנה הטבלה
  const now = new Date();
  const completedTime = new Date(now.getTime() + 3600000); // שעה אחרי ההתחלה
  
  const scanData = {
    id: scanId,
    project_id: projectId,
    name: 'DAST סריקת אבטחה ראשונית',
    type: 'DAST',  // בסכמה זה "type" ולא "scan_type"
    target: 'https://idanss.com',
    status: 'completed',
    created_at: now.toISOString(),
    start_time: now.toISOString(),
    completed_at: completedTime.toISOString(),
    findings_count: 18, // מספר ולא אובייקט JSON
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
    
    console.log(`סריקה נוצרה בהצלחה! מזהה: ${scanId}`);
    return scanId;
    
  } catch (error) {
    console.error('שגיאה כללית ביצירת סריקה:', error);
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
    },
    {
      scan_id: scanId,
      severity: 'medium',
      rule_id: 'DAST-HEADER-004',
      title: 'הגדרות כותרת אבטחה חסרות',
      description: 'חסרות כותרות אבטחה חשובות כמו Content-Security-Policy שיכולות להגביר את ההגנה מפני התקפות שונות'
    },
    {
      scan_id: scanId,
      severity: 'medium',
      rule_id: 'DAST-SSL-005',
      title: 'שימוש בפרוטוקולי SSL/TLS מיושנים',
      description: 'השרת תומך בפרוטוקולי SSL/TLS מיושנים שאינם בטוחים ועלולים להיות פגיעים להתקפות'
    },
    {
      scan_id: scanId,
      severity: 'medium',
      rule_id: 'DAST-COOKIE-006',
      title: 'חסרים דגלי אבטחה בעוגיות',
      description: 'העוגיות באתר חסרות דגלי אבטחה חשובים כמו HttpOnly ו-Secure'
    },
    {
      scan_id: scanId,
      severity: 'low',
      rule_id: 'DAST-INFO-007',
      title: 'חשיפת מידע רגיש בתגובות שרת',
      description: 'נמצא מידע רגיש בתגובות השרת כמו גרסאות תוכנה וטכנולוגיות'
    },
    {
      scan_id: scanId,
      severity: 'low',
      rule_id: 'DAST-CACHE-008',
      title: 'חסרות הגדרות Cache-Control',
      description: 'חסרות הגדרות Cache-Control עבור תוכן רגיש'
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
    console.log('מתחיל ביצירת פרויקט idanss.com וסריקת DAST...');
    
    // יצירת פרויקט
    const projectId = await createProject();
    if (!projectId) {
      console.log('ניסיון ליצור סריקה ללא פרויקט...');
    }
    
    // יצירת סריקה (אם יש פרויקט או לא)
    const scanId = await createScan(projectId);
    if (!scanId) {
      console.error('הסתיים ללא הצלחה - לא נוצרה סריקה');
      return;
    }
    
    // הוספת ממצאים
    const findingsAdded = await addFindings(scanId);
    
    if (findingsAdded) {
      console.log('\nהתהליך הושלם בהצלחה!');
      if (projectId) {
        console.log(`מזהה פרויקט: ${projectId}`);
      }
      console.log(`מזהה סריקה: ${scanId}`);
      console.log('\nכעת ניתן לצפות בנתונים במערכת.');
    } else {
      console.log('\nהתהליך הושלם חלקית - נוצרה סריקה אך לא נוספו ממצאים.');
    }
    
  } catch (error) {
    console.error('שגיאה כללית במהלך ביצוע התהליך:', error);
  }
}

// הפעלת התוכנית
main(); 