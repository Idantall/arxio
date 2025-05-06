const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const readline = require('readline');

// פרטי התחברות לסופאבייס
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';
// מפתח ה-service role
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTI3Mzk0MSwiZXhwIjoyMDYwODQ5OTQxfQ.mnXnBpFFOytuio-rgjyx_vbthCnPmhaLaFwyH2oXLko';

// יצירת קליינט סופרבייס
let supabase = createClient(supabaseUrl, supabaseKey);

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
 * מעדכן את מצב הסריקה
 */
async function updateScanStatus(scanId, status, progress = null, message = null) {
  const updates = { status };
  
  if (progress !== null) {
    updates.progress = progress;
  }
  
  if (message) {
    updates.message = message;
  }
  
  const { error } = await supabase
    .from('scans')
    .update(updates)
    .eq('id', scanId);
  
  if (error) {
    console.error(`שגיאה בעדכון סטטוס הסריקה: ${error.message}`);
    return false;
  }
  
  console.log(`סטטוס הסריקה עודכן ל-${status}${progress !== null ? ` (${progress}%)` : ''}`);
  return true;
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
    
    // עדכון ה-supabase client עם טוקן המשתמש
    supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`
        }
      }
    });
    
    return data.user.id;
  } catch (error) {
    console.error('שגיאה בתהליך ההתחברות:', error);
    return null;
  }
}

/**
 * מציג את הפרויקטים של המשתמש
 */
async function showUserProjects(userId) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, description, repository_url')
    .eq('user_id', userId);
  
  if (error) {
    console.error('שגיאה בטעינת הפרויקטים:', error.message);
    return null;
  }
  
  if (!data || data.length === 0) {
    console.log('לא נמצאו פרויקטים עבור המשתמש. צור פרויקט חדש תחילה.');
    return null;
  }
  
  console.log('\nהפרויקטים שלך:');
  data.forEach((project, index) => {
    console.log(`${index + 1}. ${project.name} (${project.id})`);
    console.log(`   תיאור: ${project.description || 'אין תיאור'}`);
    console.log(`   מאגר: ${project.repository_url || 'אין מאגר'}`);
    console.log('-----------------------------------');
  });
  
  const selection = await askQuestion('בחר מספר פרויקט לסריקה: ');
  const index = parseInt(selection) - 1;
  
  if (isNaN(index) || index < 0 || index >= data.length) {
    console.error('בחירה לא תקינה');
    return null;
  }
  
  return data[index];
}

/**
 * יצירת סריקה חדשה
 */
async function createScan(userId, project) {
  if (!userId || !project) {
    console.error('לא ניתן ליצור סריקה ללא משתמש מחובר ופרויקט');
    return null;
  }
  
  const scanType = await askQuestion('סוג הסריקה (DAST/SAST/SCA): ');
  const target = await askQuestion(`כתובת היעד לסריקה [${project.repository_url || 'https://' + project.name}]: `) || 
                  project.repository_url || 'https://' + project.name;
  
  console.log(`\nמנסה ליצור סריקת ${scanType} עבור ${project.name}...`);
  
  const scanId = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const scanData = {
    id: scanId,
    project_id: project.id,
    name: `סריקת ${scanType} - ${project.name}`,
    scan_type: scanType.toUpperCase(),
    target: target,
    status: 'pending',
    user_id: userId,
    created_at: now,
    progress: 0,
    message: 'הסריקה נוצרה, ממתינה לתחילת עיבוד',
    parameters: {
      depth: 'full',
      include_subdomains: true,
      max_scan_duration: 3600
    }
  };
  
  try {
    const { error } = await supabase
      .from('scans')
      .insert(scanData);
    
    if (error) {
      console.error('שגיאה ביצירת סריקה:', error.message);
      return null;
    }
    
    console.log('סריקה נוצרה בהצלחה!');
    console.log(`מזהה: ${scanId}`);
    console.log(`סוג: ${scanType}`);
    console.log(`יעד: ${target}`);
    
    return scanId;
  } catch (error) {
    console.error('שגיאה ביצירת סריקה:', error);
    return null;
  }
}

/**
 * סימולציה של תהליך סריקה
 */
async function simulateScanProcess(scanId) {
  console.log('\nמתחיל סימולציה של תהליך סריקה...');
  
  // עדכון סטטוס ל-"בתהליך"
  await updateScanStatus(scanId, 'in_progress', 5, 'הסריקה החלה');
  
  // סימולציה של שלבי הסריקה
  const steps = [
    { progress: 10, message: 'איסוף מידע ראשוני על היעד', delay: 2000 },
    { progress: 25, message: 'סריקת עמודים', delay: 3000 },
    { progress: 40, message: 'בדיקת פגיעויות XSS', delay: 2000 },
    { progress: 55, message: 'בדיקת פגיעויות SQL Injection', delay: 2500 },
    { progress: 70, message: 'בדיקת הגדרות אבטחה', delay: 2000 },
    { progress: 85, message: 'בדיקת CSRF ופגיעויות אחרות', delay: 2000 },
    { progress: 95, message: 'סיכום ממצאים', delay: 1500 },
  ];
  
  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, step.delay));
    await updateScanStatus(scanId, 'in_progress', step.progress, step.message);
  }
  
  // יצירת ממצאים לדוגמה
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
    }
  ];
  
  try {
    // שימוש במפתח ה-service role הקבוע במקום לבקש מהמשתמש
    console.log('\nמשתמש במפתח service role להוספת ממצאים...');
    
    // יצירת מופע חדש של הקוד שמוסיף ממצאים
    const tempModule = { exports: {} };
    const fn = new Function('module', 'require', 'process', 'serviceKey', 'scanId', 'findings', `
      const { createClient } = require('@supabase/supabase-js');
      const crypto = require('crypto');
      
      const supabase = createClient(
        '${supabaseUrl}',
        serviceKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      
      async function addFindings(scanId, findings) {
        // מיפוי ממצאים עם מזהה הסריקה
        const formattedFindings = findings.map(finding => ({
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
            status: 'completed',
            completed_at: new Date().toISOString(),
            progress: 100,
            message: 'הסריקה הושלמה בהצלחה'
          })
          .eq('id', scanId);
        
        if (updateError) {
          console.error('שגיאה בעדכון מונה הממצאים בסריקה:', updateError.message);
          return false;
        }
        
        return true;
      }
      
      module.exports = addFindings(scanId, findings);
    `);

    // הרצת הפונקציה להוספת ממצאים
    console.log('\nמוסיף ממצאים לבסיס הנתונים...');
    const success = await fn(tempModule, require, process, serviceRoleKey, scanId, sampleFindings);
    
    if (success) {
      console.log('הממצאים נוספו בהצלחה והסריקה הושלמה!');
      return true;
    } else {
      console.error('שגיאה בהוספת ממצאים');
      await updateScanStatus(scanId, 'error', 100, 'שגיאה בהוספת ממצאים לבסיס הנתונים');
      return false;
    }
  } catch (error) {
    console.error('שגיאה בתהליך הסריקה:', error);
    await updateScanStatus(scanId, 'error', 100, `שגיאה בתהליך הסריקה: ${error.message}`);
    return false;
  }
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
    
    // בחירת פרויקט
    const project = await showUserProjects(userId);
    if (!project) {
      console.error('הסתיים ללא הצלחה - לא נבחר פרויקט');
      return;
    }
    
    // יצירת סריקה
    const scanId = await createScan(userId, project);
    if (!scanId) {
      console.error('הסתיים ללא הצלחה - לא נוצרה סריקה');
      return;
    }
    
    // סימולציה של תהליך הסריקה
    const scanSuccess = await simulateScanProcess(scanId);
    
    if (scanSuccess) {
      console.log('\nהתהליך הסתיים בהצלחה!');
      console.log(`מזהה פרויקט: ${project.id}`);
      console.log(`מזהה סריקה: ${scanId}`);
      console.log('\nכעת ניתן לצפות בתוצאות במערכת.');
    } else {
      console.log('\nהתהליך הושלם חלקית - אירעה שגיאה במהלך הסריקה.');
    }
  } catch (error) {
    console.error('שגיאה כללית:', error);
  }
}

// הפעלת התוכנית
if (require.main === module) {
  main();
}

module.exports = {
  createScan,
  updateScanStatus,
  simulateScanProcess
}; 