const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// פרטי התחברות לסופאבייס
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * יצירת פרויקט חדש עבור idanss.com
 */
async function createIdanssProject() {
  console.log('יוצר פרויקט חדש עבור idanss.com...');
  
  // מזהה ייחודי לפרויקט
  const projectId = uuidv4();
  
  try {
    // יצירת הפרויקט
    const { data, error } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        name: 'Idan Software Solutions',
        description: 'אתר החברה של עידן. אתר מוצרים ושירותים בתחום פיתוח התוכנה והאבטחה.',
        repository_type: 'website',
        repository_url: 'https://idanss.com',
        target: 'idanss.com',
        status: 'active',
        security_status: 'unknown',
        scan_interval: 'weekly',
        auto_scan: true
      })
      .select();
    
    if (error) {
      console.error('שגיאה ביצירת פרויקט idanss.com:', error);
      return null;
    }
    
    console.log(`פרויקט idanss.com נוצר בהצלחה! מזהה: ${projectId}`);
    return projectId;
  } catch (error) {
    console.error('שגיאה ביצירת פרויקט idanss.com:', error);
    return null;
  }
}

/**
 * יצירת סריקת DAST לפרויקט
 */
async function createDastScan(projectId) {
  if (!projectId) {
    console.error('לא ניתן ליצור סריקה ללא מזהה פרויקט');
    return null;
  }
  
  console.log(`יוצר סריקת DAST לפרויקט ${projectId}...`);
  
  // מזהה ייחודי לסריקה
  const scanId = uuidv4();
  
  try {
    // יצירת סריקה בסטטוס ממתין
    const { data, error } = await supabase
      .from('scans')
      .insert({
        id: scanId,
        project_id: projectId,
        name: 'סריקת DAST ראשונית',
        scan_type: 'DAST',
        target: 'https://idanss.com',
        status: 'pending',
        parameters: {
          scan_depth: 'full',
          include_subdomains: true,
          max_scan_duration: 3600, // שעה אחת
          technologies: ['wordpress', 'php', 'mysql']
        }
      })
      .select();
    
    if (error) {
      console.error('שגיאה ביצירת סריקת DAST:', error);
      return null;
    }
    
    console.log(`סריקת DAST נוצרה בהצלחה! מזהה: ${scanId}`);
    return scanId;
  } catch (error) {
    console.error('שגיאה ביצירת סריקת DAST:', error);
    return null;
  }
}

/**
 * דימוי תהליך ביצוע הסריקה והשלמתה
 */
async function simulateScanExecution(scanId) {
  if (!scanId) {
    console.error('לא ניתן לדמות סריקה ללא מזהה סריקה');
    return;
  }
  
  console.log(`מדמה ביצוע סריקת DAST עבור סריקה ${scanId}...`);
  
  try {
    // עדכון סטטוס לבביצוע
    await supabase
      .from('scans')
      .update({
        status: 'running',
        progress: 10
      })
      .eq('id', scanId);
    
    console.log('סריקה בתהליך ביצוע...');
    
    // דימוי עיכוב של 2 שניות
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // עדכון התקדמות
    await supabase
      .from('scans')
      .update({
        progress: 50
      })
      .eq('id', scanId);
    
    // דימוי עיכוב של 2 שניות נוספות
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // סיום סריקה והוספת תוצאות
    const findings = {
      critical: 1,
      high: 2,
      medium: 3,
      low: 5,
      info: 7
    };
    
    const totalFindings = Object.values(findings).reduce((sum, value) => sum + value, 0);
    
    // עדכון הסריקה עם התוצאות
    const { data, error } = await supabase
      .from('scans')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        findings_count: findings,
        results: {
          summary: {
            ...findings,
            total: totalFindings
          },
          findings: generateSampleFindings()
        }
      })
      .eq('id', scanId)
      .select();
    
    if (error) {
      console.error('שגיאה בעדכון תוצאות הסריקה:', error);
      return;
    }
    
    console.log(`הסריקה הושלמה בהצלחה! נמצאו ${totalFindings} ממצאים.`);
    
    // הוספת ממצאים לטבלת הממצאים
    await addFindingsToDatabase(scanId);
    
  } catch (error) {
    console.error('שגיאה בדימוי ביצוע הסריקה:', error);
  }
}

/**
 * יצירת דוגמאות של ממצאים
 */
function generateSampleFindings() {
  return [
    {
      id: uuidv4(),
      rule_id: 'DAST-XSS-001',
      severity: 'critical',
      title: 'חולשת XSS בטופס יצירת קשר',
      description: 'זוהתה אפשרות להזרקת סקריפט זדוני בטופס יצירת קשר',
      path: '/contact',
      parameter: 'message'
    },
    {
      id: uuidv4(),
      rule_id: 'DAST-INJECTION-002',
      severity: 'high',
      title: 'חולשת SQL Injection במנוע החיפוש',
      description: 'זוהתה אפשרות להזרקת SQL במנוע החיפוש',
      path: '/search',
      parameter: 'q'
    },
    {
      id: uuidv4(),
      rule_id: 'DAST-CSRF-003',
      severity: 'high',
      title: 'חולשת CSRF בעדכון פרופיל',
      description: 'חסר מנגנון הגנה מפני CSRF בטפסי עדכון פרופיל',
      path: '/profile/update',
      parameter: '-'
    },
    {
      id: uuidv4(),
      rule_id: 'DAST-HEADER-004',
      severity: 'medium',
      title: 'הגדרות כותרת אבטחה חסרות',
      description: 'חסרות כותרות אבטחה חשובות כמו Content-Security-Policy',
      path: '/',
      parameter: '-'
    },
    {
      id: uuidv4(),
      rule_id: 'DAST-SSL-005',
      severity: 'medium',
      title: 'שימוש בפרוטוקולי SSL/TLS מיושנים',
      description: 'השרת תומך בפרוטוקולי SSL/TLS מיושנים שאינם בטוחים',
      path: '-',
      parameter: '-'
    }
  ];
}

/**
 * הוספת ממצאים לטבלת הממצאים
 */
async function addFindingsToDatabase(scanId) {
  const sampleFindings = [
    {
      scan_id: scanId,
      rule_id: 'DAST-XSS-001',
      severity: 'critical',
      title: 'חולשת XSS בטופס יצירת קשר',
      description: 'זוהתה אפשרות להזרקת סקריפט זדוני בטופס יצירת קשר באתר. תוקף יכול להשתמש בכך כדי לגנוב מידע רגיש מהמשתמשים.',
      details: {
        path: '/contact',
        parameter: 'message',
        impact: 'גניבת מידע רגיש, ביצוע פעולות מזויפות בשם המשתמש',
        remediation: 'יש לבצע סניטציה לכל קלטי המשתמש לפני הצגתם באתר'
      }
    },
    {
      scan_id: scanId,
      rule_id: 'DAST-INJECTION-002',
      severity: 'high',
      title: 'חולשת SQL Injection במנוע החיפוש',
      description: 'זוהתה אפשרות להזרקת SQL במנוע החיפוש. תוקף יכול להשתמש בכך כדי לגשת למידע לא מורשה במסד הנתונים.',
      details: {
        path: '/search',
        parameter: 'q',
        impact: 'גישה לא מורשית למידע, עדכון/מחיקה של נתונים',
        remediation: 'יש להשתמש בפרמטרים מוכנים (prepared statements) בכל פניות SQL'
      }
    },
    {
      scan_id: scanId,
      rule_id: 'DAST-CSRF-003',
      severity: 'high',
      title: 'חולשת CSRF בעדכון פרופיל',
      description: 'חסר מנגנון הגנה מפני CSRF בטפסי עדכון פרופיל. תוקף יכול לגרום למשתמש לבצע פעולות לא מכוונות.',
      details: {
        path: '/profile/update',
        parameter: '-',
        impact: 'ביצוע פעולות לא מכוונות בשם המשתמש',
        remediation: 'יש להוסיף טוקן CSRF לכל הטפסים ולאמת אותו בצד השרת'
      }
    },
    {
      scan_id: scanId,
      rule_id: 'DAST-HEADER-004',
      severity: 'medium',
      title: 'הגדרות כותרת אבטחה חסרות',
      description: 'חסרות כותרות אבטחה חשובות כמו Content-Security-Policy, שעלולות להגביר את הסיכון לחולשות XSS ואחרות.',
      details: {
        path: '/',
        parameter: '-',
        impact: 'הגברת הסיכון לחולשות אבטחה כמו XSS',
        remediation: 'יש להוסיף כותרות אבטחה מומלצות כמו Content-Security-Policy, X-Content-Type-Options, X-Frame-Options'
      }
    },
    {
      scan_id: scanId,
      rule_id: 'DAST-SSL-005',
      severity: 'medium',
      title: 'שימוש בפרוטוקולי SSL/TLS מיושנים',
      description: 'השרת תומך בפרוטוקולי SSL/TLS מיושנים שאינם בטוחים ועלולים להיות פגיעים להתקפות.',
      details: {
        path: '-',
        parameter: '-',
        impact: 'פגיעות להתקפות man-in-the-middle ולהאזנה לתעבורת הרשת',
        remediation: 'יש לבטל תמיכה בפרוטוקולים מיושנים (TLS 1.0, TLS 1.1) ולהשתמש רק ב-TLS 1.2 ומעלה'
      }
    }
  ];
  
  console.log(`מוסיף ${sampleFindings.length} ממצאים לטבלת הממצאים...`);
  
  let successCount = 0;
  
  for (const finding of sampleFindings) {
    const { error } = await supabase
      .from('findings')
      .insert(finding);
    
    if (error) {
      console.error(`שגיאה בהוספת ממצא ${finding.rule_id}:`, error);
    } else {
      successCount++;
    }
  }
  
  console.log(`נוספו ${successCount} ממצאים בהצלחה`);
}

/**
 * הפונקציה הראשית
 */
async function main() {
  try {
    console.log('מתחיל ביצירת פרויקט idanss.com וסריקת DAST...');
    
    // יצירת פרויקט
    const projectId = await createIdanssProject();
    if (!projectId) {
      console.error('לא ניתן להמשיך ללא מזהה פרויקט');
      return;
    }
    
    // יצירת סריקה
    const scanId = await createDastScan(projectId);
    if (!scanId) {
      console.error('לא ניתן להמשיך ללא מזהה סריקה');
      return;
    }
    
    // דימוי ביצוע הסריקה
    await simulateScanExecution(scanId);
    
    console.log('\nהפרויקט והסריקה נוצרו בהצלחה!');
    console.log(`מזהה פרויקט: ${projectId}`);
    console.log(`מזהה סריקה: ${scanId}`);
    console.log('\nכעת ניתן לצפות בהם במערכת');
    
  } catch (error) {
    console.error('שגיאה כללית:', error);
  }
}

// הפעלת התוכנית
main(); 