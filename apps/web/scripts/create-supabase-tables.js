const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { join } = require('path');
const fs = require('fs');

// טעינת קובץ הסביבה
const envPath = join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.log('קובץ .env.local לא נמצא, משתמש במשתני סביבה קיימים');
}

// פרטי התחברות ל-Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('אנא הגדר את המשתנים הבאים ב-.env.local:');
  console.error('NEXT_PUBLIC_SUPABASE_URL');
  console.error('SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTables() {
  try {
    console.log('מתחיל ביצירת טבלאות במסד הנתונים...');

    // בדיקה אם טבלת המשתמשים קיימת
    const { data: usersExists, error: usersExistsError } = await supabaseAdmin.from('_tables')
      .select('*')
      .eq('name', 'users')
      .eq('schema', 'public')
      .single();

    if (!usersExists || usersExistsError) {
      console.log('טבלת משתמשים לא קיימת, יוצר אותה...');
      
      // יצירת פונקציות SQL קסטומיות
      const { error: sqlFunctionError } = await supabaseAdmin.rpc('exec_sql', {
        sql_string: `
          -- יצירת טבלת משתמשים
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- הפעלת RLS על טבלת המשתמשים
          ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

          -- יצירת פוליסי שמאפשר לכל משתמש לראות את המידע שלו בלבד
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own data'
            ) THEN
              CREATE POLICY "Users can view their own data" 
              ON public.users 
              FOR SELECT 
              USING (auth.uid() = id);
            END IF;
          END $$;

          -- יצירת פוליסי שמאפשר לכל משתמש לעדכן את המידע שלו בלבד
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policy WHERE polname = 'Users can update their own data'
            ) THEN
              CREATE POLICY "Users can update their own data" 
              ON public.users 
              FOR UPDATE 
              USING (auth.uid() = id);
            END IF;
          END $$;
        `
      });

      if (sqlFunctionError) {
        console.error('שגיאה ביצירת טבלת משתמשים:', sqlFunctionError);
        
        // אם הפונקציה exec_sql לא קיימת, ננסה ליצור את הפונקציה
        if (sqlFunctionError.message.includes('function exec_sql') || sqlFunctionError.message.includes('does not exist')) {
          console.log('הפונקציה exec_sql לא קיימת, יוצר אותה...');
          
          console.log('לא ניתן לייצר את הטבלה באמצעות הסקריפט. יש ליצור את הטבלה באופן ידני דרך ממשק סופאבייס:');
          console.log(`
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- הפעלת RLS על טבלת המשתמשים
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- יצירת פוליסי שמאפשר לכל משתמש לראות את המידע שלו בלבד
CREATE POLICY "Users can view their own data" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- יצירת פוליסי שמאפשר לכל משתמש לעדכן את המידע שלו בלבד
CREATE POLICY "Users can update their own data" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);
          `);
        }
      } else {
        console.log('טבלת משתמשים נוצרה בהצלחה');
      }
    } else {
      console.log('טבלת משתמשים קיימת');
    }

    // בדיקה אם טבלת הפרויקטים קיימת
    const { data: projectsExists, error: projectsExistsError } = await supabaseAdmin.from('_tables')
      .select('*')
      .eq('name', 'projects')
      .eq('schema', 'public')
      .single();

    if (!projectsExists || projectsExistsError) {
      console.log('טבלת פרויקטים לא קיימת, יוצר אותה...');
      
      const { error: projectsSqlError } = await supabaseAdmin.rpc('exec_sql', {
        sql_string: `
          -- יצירת טבלת פרויקטים
          CREATE TABLE IF NOT EXISTS public.projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            repo_url TEXT,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- הפעלת RLS על טבלת הפרויקטים
          ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

          -- יצירת פוליסי שמאפשר לכל משתמש לראות ולנהל את הפרויקטים שלו בלבד
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policy WHERE polname = 'Users can manage their own projects'
            ) THEN
              CREATE POLICY "Users can manage their own projects" 
              ON public.projects 
              FOR ALL 
              USING (auth.uid() = user_id);
            END IF;
          END $$;
        `
      });

      if (projectsSqlError) {
        console.error('שגיאה ביצירת טבלת פרויקטים:', projectsSqlError);
        
        console.log('לא ניתן לייצר את הטבלה באמצעות הסקריפט. יש ליצור את הטבלה באופן ידני דרך ממשק סופאבייס:');
        console.log(`
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- הפעלת RLS על טבלת הפרויקטים
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- יצירת פוליסי שמאפשר לכל משתמש לראות ולנהל את הפרויקטים שלו בלבד
CREATE POLICY "Users can manage their own projects" 
ON public.projects 
FOR ALL 
USING (auth.uid() = user_id);
        `);
      } else {
        console.log('טבלת פרויקטים נוצרה בהצלחה');
      }
    } else {
      console.log('טבלת פרויקטים קיימת');
    }

    console.log('סיום יצירת טבלאות במסד הנתונים');
  } catch (error) {
    console.error('שגיאה לא צפויה:', error);
  }
}

createTables(); 