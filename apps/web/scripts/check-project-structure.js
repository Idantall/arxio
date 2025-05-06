const { createClient } = require('@supabase/supabase-js');

// פרטי התחברות לסופאבייס
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure(tableName) {
  console.log(`בודק את מבנה טבלת ${tableName}...`);
  
  try {
    // מנסה להריץ שאילתת SELECT על טבלה ריקה כדי לקבל את מבנה העמודות
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`שגיאה בבדיקת מבנה טבלת ${tableName}:`, error);
      return;
    }
    
    console.log(`מבנה טבלת ${tableName} (מבוסס על מפתחות בשורת נתונים):`);
    
    // אם קיימות שורות, נציג את המבנה
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      columns.forEach(column => {
        const value = data[0][column];
        const type = typeof value;
        console.log(`- ${column}: ${type} ${value === null ? '(null)' : ''}`);
      });
    } else {
      console.log('הטבלה ריקה. לא ניתן לקבוע את מבנה העמודות.');
      
      // מנסה לקבל מידע על העמודות מתוך מטא-דאטה של פוסטגרס
      console.log('מנסה לבדוק את מבנה הטבלה דרך המטא-דאטה...');
      
      // בודק אם הטבלה קיימת בכלל
      const { data: tableExists, error: tableError } = await supabase
        .rpc('pgql', {
          query: `
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = '${tableName}'
            );
          `
        });
      
      if (tableError) {
        console.error('שגיאה בבדיקת קיום הטבלה:', tableError);
        return;
      }
      
      if (!tableExists || !tableExists[0] || !tableExists[0].exists) {
        console.error(`הטבלה ${tableName} לא קיימת!`);
        return;
      }
      
      // מושך מידע על העמודות
      const { data: columnsData, error: columnsError } = await supabase
        .rpc('pgql', {
          query: `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = '${tableName}'
            ORDER BY ordinal_position;
          `
        });
      
      if (columnsError) {
        console.error('שגיאה בשליפת מידע על העמודות:', columnsError);
        return;
      }
      
      if (columnsData && columnsData.length > 0) {
        console.log(`מבנה טבלת ${tableName} (מבוסס על המטא-דאטה של הטבלה):`);
        columnsData.forEach(column => {
          console.log(`- ${column.column_name}: ${column.data_type} ${column.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
      } else {
        console.log('לא נמצא מידע על העמודות.');
      }
    }
  } catch (error) {
    console.error(`שגיאה כללית בבדיקת מבנה טבלת ${tableName}:`, error);
  }
}

async function checkDatabaseStructure() {
  try {
    // בדיקת מבנה טבלת הפרויקטים
    await checkTableStructure('projects');
    
    // בדיקת מבנה טבלת הסריקות
    await checkTableStructure('scans');
    
    // בדיקת הטבלאות הקיימות במסד הנתונים
    const { data: tables, error: tablesError } = await supabase
      .rpc('pgql', {
        query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `
      });
    
    if (tablesError) {
      console.error('שגיאה בשליפת רשימת הטבלאות:', tablesError);
      return;
    }
    
    console.log('\nטבלאות קיימות במסד הנתונים:');
    if (tables && tables.length > 0) {
      tables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    } else {
      console.log('לא נמצאו טבלאות.');
    }
    
  } catch (error) {
    console.error('שגיאה כללית:', error);
  }
}

// הפעלת התוכנית
checkDatabaseStructure(); 