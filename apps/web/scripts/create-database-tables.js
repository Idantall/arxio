const { createClient } = require('@supabase/supabase-js');

// פרטי התחברות לסופאבייס
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * בדיקה אם טבלה קיימת
 */
async function checkIfTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST204') {
      // הטבלה לא קיימת
      return false;
    }
    
    // הטבלה קיימת
    return true;
  } catch (error) {
    console.error(`שגיאה בבדיקה אם טבלת ${tableName} קיימת:`, error);
    return false;
  }
}

/**
 * ניסיון להוסיף פרויקט פשוט
 */
async function createSimpleProject() {
  console.log('מנסה ליצור פרויקט פשוט...');
  
  const projectData = {
    name: 'Idan Software Solutions',
    description: 'חברת פיתוח התוכנה של עידן'
  };
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select();
    
    if (error) {
      console.error('שגיאה ביצירת פרויקט פשוט:', error);
      return null;
    }
    
    console.log('פרויקט נוצר בהצלחה:', data);
    return data[0].id;
  } catch (error) {
    console.error('שגיאה ביצירת פרויקט פשוט:', error);
    return null;
  }
}

/**
 * ניסיון להוסיף סריקה פשוטה
 */
async function createSimpleScan(projectId) {
  if (!projectId) {
    console.error('לא ניתן ליצור סריקה ללא מזהה פרויקט');
    return null;
  }
  
  console.log('מנסה ליצור סריקה פשוטה...');
  
  const scanData = {
    project_id: projectId,
    name: 'DAST סריקה ראשונית',
    scan_type: 'DAST',
    target: 'https://idanss.com',
    status: 'completed',
    completed_at: new Date().toISOString(),
    findings_count: {
      critical: 1,
      high: 2,
      medium: 3,
      low: 5,
      info: 7
    }
  };
  
  try {
    const { data, error } = await supabase
      .from('scans')
      .insert(scanData)
      .select();
    
    if (error) {
      console.error('שגיאה ביצירת סריקה פשוטה:', error);
      return null;
    }
    
    console.log('סריקה נוצרה בהצלחה:', data);
    return data[0].id;
  } catch (error) {
    console.error('שגיאה ביצירת סריקה פשוטה:', error);
    return null;
  }
}

/**
 * בדיקה פשוטה של טבלאות
 */
async function checkTables() {
  console.log('בודק אם הטבלאות קיימות...');
  
  // בדיקת טבלת הפרויקטים
  const projectsExist = await checkIfTableExists('projects');
  console.log(`טבלת projects ${projectsExist ? 'קיימת' : 'לא קיימת'}`);
  
  // בדיקת טבלת הסריקות
  const scansExist = await checkIfTableExists('scans');
  console.log(`טבלת scans ${scansExist ? 'קיימת' : 'לא קיימת'}`);
  
  // בדיקת טבלת הממצאים
  const findingsExist = await checkIfTableExists('findings');
  console.log(`טבלת findings ${findingsExist ? 'קיימת' : 'לא קיימת'}`);
  
  return {
    projectsExist,
    scansExist,
    findingsExist
  };
}

/**
 * יצירת פרויקט וסריקה לידן
 */
async function createIdanProject() {
  console.log('\nיוצר פרויקט וסריקה של idanss.com...');
  
  // יצירת פרויקט
  const projectId = await createSimpleProject();
  if (!projectId) {
    console.error('לא ניתן להמשיך ללא מזהה פרויקט');
    return;
  }
  
  // יצירת סריקה
  const scanId = await createSimpleScan(projectId);
  if (!scanId) {
    console.error('לא ניתן להמשיך ללא מזהה סריקה');
    return;
  }
  
  console.log('\nנוצר בהצלחה פרויקט וסריקה לאתר idanss.com!');
  console.log(`מזהה פרויקט: ${projectId}`);
  console.log(`מזהה סריקה: ${scanId}`);
}

/**
 * פונקציה ראשית
 */
async function main() {
  try {
    // בדיקת קיום הטבלאות
    const { projectsExist, scansExist, findingsExist } = await checkTables();
    
    if (projectsExist && scansExist) {
      // הטבלאות קיימות, ננסה ליצור פרויקט וסריקה
      await createIdanProject();
    } else {
      console.error('\nחלק מהטבלאות חסרות! יש ליצור אותן לפני שניתן להוסיף נתונים.');
      console.log('יש להריץ את ה-SQL ביצירת הטבלאות בקונסול של סופאבייס:');
      console.log('https://supabase.com/dashboard/project/sahiuqlyojjjvijzbfqt/sql');
    }
  } catch (error) {
    console.error('שגיאה כללית:', error);
  }
}

// הפעלת התוכנית
main(); 