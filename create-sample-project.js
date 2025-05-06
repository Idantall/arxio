require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// פרטי התחברות לסופאבייס
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';

const supabase = createClient(supabaseUrl, supabaseKey);

// יצירת פרויקט לדוגמה של idanss.com
async function createSampleProject() {
  console.log('\nיוצר פרויקט לדוגמה של idanss.com...');
  
  const projectId = uuidv4();
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        name: 'Idan Software Solutions',
        description: 'אתר החברה של עידן',
        repository_type: 'website',
        target: 'idanss.com',
        repository_url: 'https://idanss.com',
        status: 'active'
      })
      .select();
    
    if (error) {
      console.error('שגיאה ביצירת פרויקט לדוגמה:', error);
      return null;
    }
    
    console.log('פרויקט לדוגמה נוצר בהצלחה:', projectId);
    return projectId;
  } catch (error) {
    console.error('שגיאה ביצירת פרויקט לדוגמה:', error);
    return null;
  }
}

// יצירת סריקה לדוגמה
async function createSampleScan(projectId) {
  console.log('\nיוצר סריקה לדוגמה של idanss.com...');
  
  if (!projectId) {
    console.error('לא ניתן ליצור סריקה ללא מזהה פרויקט');
    return;
  }
  
  const scanId = uuidv4();
  
  try {
    const { data, error } = await supabase
      .from('scans')
      .insert({
        id: scanId,
        project_id: projectId,
        name: 'DAST סריקת אבטחה ראשונית',
        scan_type: 'DAST',
        target: 'https://idanss.com',
        status: 'completed',
        completed_at: new Date().toISOString(),
        findings_count: {
          critical: 1,
          high: 2,
          medium: 4,
          low: 3,
          info: 8
        },
        results: {
          summary: {
            critical: 1,
            high: 2,
            medium: 4,
            low: 3,
            info: 8,
            total: 18
          },
          findings: [
            {
              id: uuidv4(),
              rule_id: 'DAST-XSS-001',
              severity: 'critical',
              title: 'חולשת XSS אפשרית',
              description: 'זוהתה אפשרות להזרקת סקריפט זדוני בטופס יצירת קשר'
            },
            {
              id: uuidv4(),
              rule_id: 'DAST-INJECTION-002',
              severity: 'high',
              title: 'חולשת SQL Injection',
              description: 'זוהתה אפשרות להזרקת SQL במנוע החיפוש'
            }
          ]
        }
      })
      .select();
    
    if (error) {
      console.error('שגיאה ביצירת סריקה לדוגמה:', error);
      return;
    }
    
    console.log('סריקה לדוגמה נוצרה בהצלחה:', scanId);
    
    // הוספת ממצאים מפורטים
    const findingsInsertData = [
      {
        scan_id: scanId,
        rule_id: 'DAST-XSS-001',
        severity: 'critical',
        title: 'חולשת XSS אפשרית',
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
        title: 'חולשת SQL Injection',
        description: 'זוהתה אפשרות להזרקת SQL במנוע החיפוש. תוקף יכול להשתמש בכך כדי לגשת למידע לא מורשה במסד הנתונים.',
        details: {
          path: '/search',
          parameter: 'q',
          impact: 'גישה לא מורשית למידע, עדכון/מחיקה של נתונים',
          remediation: 'יש להשתמש בפרמטרים מוכנים (prepared statements) בכל פניות SQL'
        }
      }
    ];
    
    for (const finding of findingsInsertData) {
      const { error: findingError } = await supabase
        .from('findings')
        .insert(finding);
      
      if (findingError) {
        console.error('שגיאה בהוספת ממצא:', findingError);
      }
    }
    
    console.log('ממצאים נוספו בהצלחה');
  } catch (error) {
    console.error('שגיאה ביצירת סריקה לדוגמה:', error);
  }
}

// פונקציה ראשית
async function main() {
  try {
    // יצירת פרויקט דוגמה וסריקה
    const projectId = await createSampleProject();
    if (projectId) {
      await createSampleScan(projectId);
    }
    
    console.log('\nהתהליך הסתיים בהצלחה!');
  } catch (error) {
    console.error('שגיאה כללית:', error);
  }
}

// הפעלת התוכנית
main(); 