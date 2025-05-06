const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// פרטי התחברות לסופאבייס
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';

const supabase = createClient(supabaseUrl, supabaseKey);

// פונקציה ליצירת מזהה ייחודי
function generateUuid() {
  return uuidv4();
}

async function createTables() {
  console.log('יוצר טבלאות בסופאבייס...');
  
  try {
    // יצירת טבלת פרויקטים
    console.log('\nיוצר טבלת פרויקטים...');
    await supabase.rpc('pgql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.projects (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID,
          name TEXT NOT NULL,
          description TEXT,
          repository_type TEXT,
          repository_url TEXT,
          repository_provider TEXT,
          branch TEXT DEFAULT 'main',
          deployment_url TEXT,
          local_path TEXT,
          target TEXT,
          status TEXT DEFAULT 'active',
          security_status TEXT DEFAULT 'medium',
          scan_interval TEXT DEFAULT 'weekly',
          auto_scan BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `
    });
    console.log('טבלת פרויקטים נוצרה בהצלחה או שהיא כבר קיימת');
    
    // יצירת טבלת סריקות
    console.log('\nיוצר טבלת סריקות...');
    await supabase.rpc('pgql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.scans (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID,
          name TEXT,
          scan_type TEXT NOT NULL,
          target TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          user_id UUID,
          message TEXT,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          completed_at TIMESTAMP WITH TIME ZONE,
          results JSONB DEFAULT '{}'::jsonb,
          findings_count JSONB DEFAULT '{"critical":0,"high":0,"medium":0,"low":0,"info":0}'::jsonb,
          parameters JSONB DEFAULT '{}'::jsonb,
          progress INTEGER DEFAULT 0
        );
      `
    });
    console.log('טבלת סריקות נוצרה בהצלחה או שהיא כבר קיימת');
    
    // יצירת טבלת ממצאים
    console.log('\nיוצר טבלת ממצאים...');
    await supabase.rpc('pgql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.findings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          scan_id UUID,
          rule_id TEXT,
          title TEXT NOT NULL,
          description TEXT,
          severity TEXT NOT NULL, 
          details JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `
    });
    console.log('טבלת ממצאים נוצרה בהצלחה או שהיא כבר קיימת');
    
    // יצירת טבלת תור סריקות
    console.log('\nיוצר טבלת תור סריקות...');
    await supabase.rpc('pgql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.scan_queue (
          id UUID PRIMARY KEY,
          scan_type TEXT NOT NULL,
          target TEXT NOT NULL,
          parameters JSONB DEFAULT '{}'::jsonb,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          processed_at TIMESTAMP WITH TIME ZONE
        );
      `
    });
    console.log('טבלת תור סריקות נוצרה בהצלחה או שהיא כבר קיימת');
    
    console.log('\nכל הטבלאות נוצרו בהצלחה!');
  } catch (error) {
    console.error('שגיאה ביצירת טבלאות:', error);
  }
}

// יצירת פרויקט לדוגמה
async function createSampleProject() {
  console.log('\nיוצר פרויקט לדוגמה...');
  
  const projectId = generateUuid();
  
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
  console.log('\nיוצר סריקה לדוגמה...');
  
  if (!projectId) {
    console.error('לא ניתן ליצור סריקה ללא מזהה פרויקט');
    return;
  }
  
  const scanId = generateUuid();
  
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
              id: generateUuid(),
              rule_id: 'DAST-XSS-001',
              severity: 'critical',
              title: 'חולשת XSS אפשרית',
              description: 'זוהתה אפשרות להזרקת סקריפט זדוני בטופס יצירת קשר'
            },
            {
              id: generateUuid(),
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
    // יצירת הטבלאות
    await createTables();
    
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