import { NextResponse } from 'next/server';
import { Project, projectSchema } from '@arxio/types';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { randomUUID } from 'crypto';
import { getUserById, isValidUUID } from '@/lib/user-utils';

// פונקציית עזר לבדיקת קיום טבלת פרויקטים ויצירתה אם לא קיימת
async function ensureProjectsTable() {
  try {
    console.log("מתחיל בדיקת טבלת פרויקטים...");
    console.log("מצב חיבור לסופאבייס:", !!supabaseAdmin);
    console.log("משתמש בכתובת:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("קיים מפתח שירות:", !!process.env.SUPABASE_SERVICE_KEY);
    
    // בדיקה אם טבלת projects קיימת
    const { error: tableError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.log("שגיאה בבדיקת טבלה:", tableError.message);
      
      if (tableError.message.includes('relation "projects" does not exist')) {
        console.log("יוצר טבלת פרויקטים...");
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.projects (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            repository_type TEXT NOT NULL,
            repository_url TEXT,
            repository_provider TEXT,
            branch TEXT DEFAULT 'main',
            deployment_url TEXT,
            local_path TEXT,
            status TEXT DEFAULT 'active',
            security_status TEXT DEFAULT 'medium',
            scan_interval TEXT DEFAULT 'weekly',
            auto_scan BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
          );
          
          ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "משתמשים יכולים לראות את הפרויקטים שלהם" 
            ON public.projects 
            FOR SELECT 
            USING (auth.uid() = user_id);
            
          CREATE POLICY "משתמשים יכולים לערוך את הפרויקטים שלהם" 
            ON public.projects 
            FOR UPDATE 
            USING (auth.uid() = user_id);
            
          CREATE POLICY "משתמשים יכולים למחוק את הפרויקטים שלהם" 
            ON public.projects 
            FOR DELETE 
            USING (auth.uid() = user_id);
            
          CREATE POLICY "משתמשים יכולים ליצור פרויקטים" 
            ON public.projects 
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
            
          CREATE POLICY "Service roles יכולים לעשות הכל" 
            ON public.projects 
            USING (auth.role() = 'service_role');
        `;
        
        const { error: createError } = await supabaseAdmin.rpc('pgql', { query: createTableSQL });
        
        if (createError) {
          console.error("שגיאה ביצירת טבלת פרויקטים:", createError);
          throw createError;
        }
      }
    }
  } catch (error) {
    console.error("שגיאה בבדיקת/יצירת טבלת פרויקטים:", error);
    throw error;
  }
}

/**
 * בדיקה אם המשתמש קיים או יצירת משתמש אם לא קיים
 */
async function ensureUserExists(userId: string, email?: string) {
  try {
    if (!userId) {
      console.error("אין מזהה משתמש, לא ניתן להבטיח קיום משתמש");
      return false;
    }
    
    // בדיקה אם המשתמש קיים
    const { data } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (data) {
      console.log("המשתמש קיים במערכת");
      return true;
    }
    
    console.log(`משתמש עם מזהה ${userId} לא קיים, מנסה ליצור אותו`);
    
    // יצירת משתמש חדש
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email || `user_${userId.substring(0, 8)}@example.com`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    if (insertError) {
      console.error("שגיאה ביצירת משתמש:", insertError);
      return false;
    }
    
    console.log("משתמש נוצר בהצלחה");
    return true;
  } catch (error) {
    console.error("שגיאה בבדיקת/יצירת משתמש:", error);
    return false;
  }
}

// שליפת כל הפרויקטים של המשתמש הנוכחי
export async function GET(request: Request) {
  try {
    // לקבל את המשתמש הנוכחי
    console.log("מנסה לקבל את המשתמש הנוכחי");
    const session = await getServerSession();
    
    console.log("מידע על המשתמש:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id || 'אין',
      email: session?.user?.email || 'אין'
    });
    
    // בדיקה אם זו בקשה למזהה פרויקט ספציפי
    const url = new URL(request.url);
    const path = url.pathname;
    
    // אם מדובר בבקשה למזהה ספציפי (לא דרך הניתוב של [id]/route.ts)
    const projectId = url.searchParams.get("id");
    
    if (projectId) {
      console.log("מבקש פרויקט ספציפי:", projectId);
      
      // שליפת פרויקט ספציפי
      const { data: project, error } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) {
        console.error("שגיאה בשליפת פרויקט:", error);
        return NextResponse.json({ error: "פרויקט לא נמצא" }, { status: 404 });
      }
      
      return NextResponse.json(project);
    }
    
    let userId = session?.user?.id;
    
    if (!userId) {
      console.warn("אין משתמש מחובר או אין ID למשתמש - מנסה לאתר לפי אימייל");
      
      // נסיון לאתר משתמש לפי אימייל אם קיים
      if (session?.user?.email) {
        try {
          const { data: users } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', session.user.email.toLowerCase())
            .limit(1);
          
          if (users && users.length > 0) {
            userId = users[0].id;
            console.log(`נמצא משתמש עם אימייל ${session.user.email}: ${userId}`);
          }
        } catch (error) {
          console.error("שגיאה באיתור משתמש לפי אימייל:", error);
        }
      }
      
      // אם עדיין אין משתמש, מחזיר רשימה ריקה
      if (!userId) {
        console.warn("לא נמצא משתמש - מחזיר רשימה ריקה");
        return NextResponse.json([]);
      }
    }
    
    try {
      // וידוא קיום טבלת פרויקטים
      await ensureProjectsTable();
      
      // וידוא קיום המשתמש במערכת
      await ensureUserExists(userId, session?.user?.email);
      
      console.log("טבלת הפרויקטים קיימת, מנסה לשלוף נתונים");
      
      // שליפת פרויקטים מסופאבייס
      const { data: projects, error } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("שגיאה בשליפת פרויקטים:", error);
        return NextResponse.json([]);
      }
      
      console.log(`נמצאו ${projects?.length || 0} פרויקטים`);
      return NextResponse.json(projects || []);
    } catch (error) {
      console.error("שגיאה בשליפת פרויקטים:", error);
      // במקרה של שגיאה, להחזיר מערך ריק כברירת מחדל
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("שגיאה כללית בשליפת פרויקטים:", error);
    return NextResponse.json([]);
  }
}

// יצירת פרויקט חדש
export async function POST(request: Request) {
  try {
    // וידוא קיום טבלת פרויקטים
    await ensureProjectsTable();
    
    // קבלת נתוני המשתמש הנוכחי
    const session = await getServerSession();
    
    console.log("תוכן ה-session:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id || 'אין',
      email: session?.user?.email || 'אין'
    });
    
    // קבלת נתוני הפרויקט מהבקשה
    const body = await request.json();
    
    let userId = session?.user?.id;
    
    // אם אין מזהה משתמש, ננסה לאתר לפי אימייל
    if (!userId && session?.user?.email) {
      console.log(`נמצא אימייל בסשן: ${session.user.email}, מנסה לקבל מזהה תואם`);
      
      try {
        // נסיון לקבל מזהה לפי אימייל מסופאבייס
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', session.user.email.toLowerCase())
          .limit(1);
        
        if (users && users.length > 0) {
          userId = users[0].id;
          console.log(`נמצא מזהה תואם לאימייל: ${userId}`);
        } else {
          // אם לא מצאנו משתמש, ננסה ליצור אחד
          const newUserId = randomUUID();
          console.log(`לא נמצא משתמש, יוצר משתמש חדש עם מזהה: ${newUserId}`);
          
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              id: newUserId,
              email: session.user.email.toLowerCase(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          
          if (!insertError) {
            userId = newUserId;
            console.log(`נוצר משתמש חדש: ${userId}`);
          } else {
            console.error("שגיאה ביצירת משתמש חדש:", insertError);
          }
        }
      } catch (error) {
        console.error("שגיאה בניסיון חיפוש או יצירת משתמש:", error);
      }
    }
    
    // אם עדיין אין מזהה, נחזיר שגיאה
    if (!userId) {
      return NextResponse.json({
        error: "לא מורשה",
        message: "אנא התחבר למערכת ופתח את הבעיה מדף תיקון האימות: /auth/fix",
        code: "SESSION_INVALID"
      }, { status: 401 });
    }
    
    console.log("מידע על המשתמש:", {
      userId: userId,
      email: session?.user?.email || 'אין',
      validUUID: isValidUUID(userId)
    });
    
    // בדיקה שמזהה המשתמש הוא UUID תקני (אבל עכשיו סלחני יותר בפונקציה משופרת)
    if (!isValidUUID(userId)) {
      console.error("מזהה המשתמש אינו UUID תקני", userId);
      // במקום להחזיר שגיאה, ננסה להמיר למזהה תקין
      userId = randomUUID();
      console.log(`יצרתי מזהה תקין חדש: ${userId}`);
      // ומוודא שהמשתמש קיים
      const userExists = await ensureUserExists(userId, session?.user?.email);
      if (!userExists) {
        return NextResponse.json({ 
          error: "שגיאה ביצירת משתמש חדש", 
          code: "USER_CREATION_FAILED"
        }, { status: 500 });
      }
    }
    
    // שימוש בנתוני הפרויקט
    const projectData = body;
    
    // הוספת נתונים נוספים
    const now = new Date().toISOString();
    const projectId = randomUUID();
    
    // יצירת הפרויקט בסופאבייס
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        id: projectId,
        ...projectData,
        repository_type: projectData.repository_type || projectData.type || 'web', // המרה לגמישה יותר
        user_id: userId,
        created_at: now,
        updated_at: now,
        status: 'active'
      })
      .select()
      .single();
    
    if (error) {
      console.error("שגיאה ביצירת פרויקט:", error);
      
      // בדיקה אם השגיאה קשורה ל-repository_type
      if (error.message && error.message.includes('repository_type')) {
        return NextResponse.json({ 
          error: "שגיאה ביצירת פרויקט - שדה repository_type חסר או לא תקין",
          details: error.message,
          solution: "ודא שאתה מספק שדה repository_type תקין בבקשה"
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: "שגיאה ביצירת פרויקט", 
        details: error.message 
      }, { status: 500 });
    }
    
    console.log(`פרויקט חדש נוצר: ${projectId}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error("שגיאה כללית ביצירת פרויקט:", error);
    const errorMessage = error instanceof Error ? error.message : "שגיאה כללית";
    return NextResponse.json({ 
      error: "שגיאה כללית ביצירת פרויקט", 
      details: errorMessage 
    }, { status: 500 });
  }
}

 