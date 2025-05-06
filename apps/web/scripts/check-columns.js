const { createClient } = require('@supabase/supabase-js');

// פרטי התחברות לסופאבייס
const supabaseUrl = 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * ניסיון לקבל מידע על המבנה של טבלה
 */
async function getTableInfo(tableName) {
  console.log(`מנסה לקבל מידע על מבנה הטבלה ${tableName}...`);
  
  try {
    // יצירת רשומה פשוטה ביותר לבדיקה
    const testRecord = { name: 'test_record' };
    
    const { error: insertError } = await supabase
      .from(tableName)
      .insert(testRecord);
    
    if (insertError) {
      console.log(`שגיאת הוספה: ${insertError.message}`);
      
      // אם השגיאה מכילה מידע על קולומנות חסרות או לא תקינות
      if (insertError.message.includes('column') || insertError.message.includes('violates')) {
        console.log('מנתח את השגיאה לקבלת מידע על הקולומנות...');
        
        const columnMatch = insertError.message.match(/column "([^"]+)"/);
        if (columnMatch) {
          console.log(`נמצאה התייחסות לקולומנה: ${columnMatch[1]}`);
        }
      }
    }
    
    // ניסיון לקבל שגיאות נוספות לגבי קולומנות אחרות
    const testWithMoreColumns = {
      name: 'test_record',
      scan_type: 'test',
      target: 'test',
      status: 'pending',
      user_id: '00000000-0000-0000-0000-000000000000',
      findings_count: { critical: 0 }
    };
    
    const { error: insertError2 } = await supabase
      .from(tableName)
      .insert(testWithMoreColumns);
    
    if (insertError2) {
      console.log(`שגיאת הוספה 2: ${insertError2.message}`);
    }
    
  } catch (error) {
    console.error(`שגיאה בבדיקת מבנה הטבלה ${tableName}:`, error);
  }
}

/**
 * פונקציה ראשית
 */
async function main() {
  try {
    await getTableInfo('scans');
  } catch (error) {
    console.error('שגיאה כללית:', error);
  }
}

// הפעלת התוכנית
main(); 