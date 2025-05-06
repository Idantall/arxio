// סקריפט לוידוא קיום טבלת הסריקות עם כל העמודות הנדרשות
const { createClient } = require('@supabase/supabase-js');

// בדיקת קיום משתני סביבה הכרחיים
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('חסרים משתני סביבה: NEXT_PUBLIC_SUPABASE_URL או SUPABASE_SERVICE_KEY');
  console.log('יש להפעיל את הסקריפט עם משתני הסביבה הנכונים:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/ensure-scans-table.js');
  process.exit(1);
}

// יצירת חיבור ל-Supabase עם הרשאות אדמין
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ensureScansTable = async () => {
  try {
    console.log('בודק אם טבלת "scans" קיימת...');
    
    // בדיקה אם הטבלה קיימת
    const { data: tableExists, error: checkError } = await supabase.rpc('pgql', { 
      query: `SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'scans'
      );`
    });
    
    if (checkError) {
      console.error('שגיאה בבדיקת קיום הטבלה:', checkError.message);
      process.exit(1);
    }
    
    // יצירת הטבלה אם היא לא קיימת
    if (!tableExists || !tableExists[0] || !tableExists[0].exists) {
      console.log('טבלת "scans" לא קיימת. יוצר טבלה חדשה...');
      
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS public.scans (
          id TEXT PRIMARY KEY,
          project_id TEXT,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          target TEXT NOT NULL,
          status TEXT DEFAULT 'pending' NOT NULL,
          user_id UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          start_time TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          error_message TEXT,
          findings_count INTEGER DEFAULT 0,
          parameters JSONB DEFAULT '{}'::jsonb
        );
        
        -- הגדרת הרשאות
        ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
        
        -- מדיניות בטחון: משתמשים יכולים לראות את הסריקות שלהם
        CREATE POLICY "Users can view their own scans" ON public.scans
          FOR SELECT USING (auth.uid() = user_id);
          
        -- מדיניות בטחון: משתמשים יכולים ליצור סריקות
        CREATE POLICY "Users can create scans" ON public.scans
          FOR INSERT WITH CHECK (auth.uid() = user_id);
          
        -- מדיניות בטחון: משתמשים יכולים לעדכן את הסריקות שלהם
        CREATE POLICY "Users can update their own scans" ON public.scans
          FOR UPDATE USING (auth.uid() = user_id);
      `;
      
      const { error: createError } = await supabase.rpc('pgql', { query: createTableQuery });
      
      if (createError) {
        console.error('שגיאה ביצירת טבלת הסריקות:', createError.message);
        process.exit(1);
      } else {
        console.log('טבלת "scans" נוצרה בהצלחה!');
      }
    } else {
      console.log('טבלת "scans" כבר קיימת');
      
      // בדיקת קיום העמודות החיוניות והוספה אם חסרות
      const columnsToEnsure = [
        { name: 'id', type: 'TEXT PRIMARY KEY' },
        { name: 'project_id', type: 'TEXT' },
        { name: 'name', type: 'TEXT NOT NULL' },
        { name: 'type', type: 'TEXT NOT NULL' },
        { name: 'target', type: 'TEXT NOT NULL' },
        { name: 'status', type: "TEXT DEFAULT 'pending' NOT NULL" },
        { name: 'user_id', type: 'UUID REFERENCES auth.users(id)' },
        { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' },
        { name: 'start_time', type: 'TIMESTAMP WITH TIME ZONE' },
        { name: 'completed_at', type: 'TIMESTAMP WITH TIME ZONE' },
        { name: 'error_message', type: 'TEXT' },
        { name: 'findings_count', type: 'INTEGER DEFAULT 0' },
        { name: 'parameters', type: "JSONB DEFAULT '{}'::jsonb" }
      ];
      
      console.log('בודק אם כל העמודות הנדרשות קיימות...');
      
      for (const column of columnsToEnsure) {
        const { data: columnExists, error: columnCheckError } = await supabase.rpc('pgql', { 
          query: `SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'scans' AND column_name = '${column.name}'
          );`
        });
        
        if (columnCheckError) {
          console.error(`שגיאה בבדיקת קיום העמודה ${column.name}:`, columnCheckError.message);
          continue;
        }
        
        if (!columnExists || !columnExists[0] || !columnExists[0].exists) {
          console.log(`מוסיף עמודה חסרה: ${column.name}`);
          
          const addColumnQuery = `
            ALTER TABLE public.scans
            ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};
          `;
          
          const { error: addColumnError } = await supabase.rpc('pgql', { query: addColumnQuery });
          
          if (addColumnError) {
            console.error(`שגיאה בהוספת העמודה ${column.name}:`, addColumnError.message);
          } else {
            console.log(`העמודה ${column.name} נוספה בהצלחה!`);
          }
        }
      }
    }

    // בדיקה ויצירת טבלת ממצאים (findings)
    console.log('בודק אם טבלת "findings" קיימת...');
    
    const { data: findingsExists, error: findingsCheckError } = await supabase.rpc('pgql', { 
      query: `SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'findings'
      );`
    });
    
    if (findingsCheckError) {
      console.error('שגיאה בבדיקת קיום טבלת הממצאים:', findingsCheckError.message);
    } else if (!findingsExists || !findingsExists[0] || !findingsExists[0].exists) {
      console.log('טבלת "findings" לא קיימת. יוצר טבלה חדשה...');
      
      const createFindingsQuery = `
        CREATE TABLE IF NOT EXISTS public.findings (
          id TEXT PRIMARY KEY,
          scan_id TEXT REFERENCES public.scans(id) ON DELETE CASCADE,
          severity TEXT NOT NULL,
          rule_id TEXT,
          title TEXT NOT NULL,
          description TEXT,
          location TEXT,
          code TEXT,
          cwe TEXT,
          remediation TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- הגדרת הרשאות
        ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
        
        -- מדיניות בטחון: משתמשים יכולים לראות את הממצאים של הסריקות שלהם
        CREATE POLICY "Users can view findings from their scans" ON public.findings
          FOR SELECT USING (
            scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid())
          );
      `;
      
      const { error: createFindingsError } = await supabase.rpc('pgql', { query: createFindingsQuery });
      
      if (createFindingsError) {
        console.error('שגיאה ביצירת טבלת הממצאים:', createFindingsError.message);
      } else {
        console.log('טבלת "findings" נוצרה בהצלחה!');
      }
    } else {
      console.log('טבלת "findings" כבר קיימת');
    }
    
    console.log('הבדיקה והיצירה של טבלאות הסריקות הסתיימה בהצלחה!');
    
  } catch (error) {
    console.error('שגיאה כללית:', error.message);
    process.exit(1);
  }
};

// הפעלת הפונקציה
ensureScansTable(); 