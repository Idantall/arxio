const { createClient } = require('@supabase/supabase-js');

// פרטי התחברות לסופאבייס
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';

// בדיקה שפרטי ההתחברות קיימים
if (!supabaseUrl || !supabaseKey) {
  console.error('שגיאה: חסרים פרטי התחברות לסופאבייס');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkScans() {
  console.log('\n--- בודק טבלת סריקות ---');
  const { data: scans, error } = await supabase
    .from('scans')
    .select('*');

  if (error) {
    console.error('שגיאה בשליפת סריקות:', error);
    return;
  }

  if (!scans || scans.length === 0) {
    console.log('לא נמצאו סריקות בטבלה');
    return;
  }

  console.log(`נמצאו ${scans.length} סריקות:`);
  scans.forEach((scan, index) => {
    console.log(`\nסריקה ${index + 1}:`);
    console.log(`ID: ${scan.id}`);
    console.log(`סוג: ${scan.scan_type || 'לא מוגדר'}`);
    console.log(`מטרה: ${scan.target || 'לא מוגדר'}`);
    console.log(`סטטוס: ${scan.status || 'לא מוגדר'}`);
    console.log(`פרויקט: ${scan.project_id || 'לא משויך'}`);
    console.log(`נוצר: ${scan.created_at || 'לא מוגדר'}`);
    console.log(`הושלם: ${scan.completed_at || 'טרם הושלם'}`);
  });
}

async function checkProjects() {
  console.log('\n--- בודק טבלת פרויקטים ---');
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*');

  if (error) {
    console.error('שגיאה בשליפת פרויקטים:', error);
    return;
  }

  if (!projects || projects.length === 0) {
    console.log('לא נמצאו פרויקטים בטבלה');
    return;
  }

  console.log(`נמצאו ${projects.length} פרויקטים:`);
  projects.forEach((project, index) => {
    console.log(`\nפרויקט ${index + 1}:`);
    console.log(`ID: ${project.id}`);
    console.log(`שם: ${project.name || 'ללא שם'}`);
    console.log(`תיאור: ${project.description || 'אין תיאור'}`);
    console.log(`סוג: ${project.repository_type || 'לא מוגדר'}`);
    console.log(`כתובת: ${project.repository_url || project.target || 'לא מוגדר'}`);
    console.log(`משתמש: ${project.user_id || 'לא משויך'}`);
    console.log(`נוצר: ${project.created_at || 'לא מוגדר'}`);
  });
}

// פונקציה ראשית
async function main() {
  try {
    console.log('בודק את טבלאות סופאבייס...');
    await checkScans();
    await checkProjects();
    console.log('\nהבדיקה הסתיימה בהצלחה');
  } catch (error) {
    console.error('שגיאה כללית:', error);
  } finally {
    process.exit(0);
  }
}

// הפעלה
main(); 