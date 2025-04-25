import { NextResponse } from 'next/server';
import { Project, projectSchema } from '@arxio/types';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/lib/auth';

// פונקציית עזר לבדיקת קיום טבלת פרויקטים ויצירתה אם לא קיימת
async function ensureProjectsTable() {
  try {
    // בדיקה אם טבלת projects קיימת
    const { error: tableError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.message.includes('relation "projects" does not exist')) {
      console.log("יוצר טבלת פרויקטים...");
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.projects (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          repository_type TEXT NOT NULL,
          repository_url TEXT,
          branch TEXT,
          local_path TEXT,
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
  } catch (error) {
    console.error("שגיאה בבדיקת/יצירת טבלת פרויקטים:", error);
    throw error;
  }
}

// שליפת כל הפרויקטים של המשתמש הנוכחי
export async function GET(request: Request) {
  try {
    // לקבל את המשתמש הנוכחי
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }
    
    await ensureProjectsTable();
    
    // שליפת פרויקטים מסופאבייס
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("שגיאה בשליפת פרויקטים:", error);
      return NextResponse.json(
        { message: "שגיאה בשליפת פרויקטים" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error("שגיאה כללית בשליפת פרויקטים:", error);
    return NextResponse.json(
      { message: "שגיאה כללית בעת שליפת פרויקטים" },
      { status: 500 }
    );
  }
}

// יצירת פרויקט חדש
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }
    
    const body = await request.json();
    console.log("נתוני פרויקט חדש:", body);
    
    // וידוא תקינות הנתונים
    const validationResult = projectSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("נתוני פרויקט לא תקינים:", validationResult.error);
      return NextResponse.json(
        { message: "נתונים לא תקינים", errors: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    await ensureProjectsTable();
    
    // יצירת הפרויקט בסופאבייס
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: session.user.id,
        name: body.name,
        description: body.description || "",
        repository_type: body.repositoryType,
        repository_url: body.repositoryUrl || null,
        branch: body.branch || "main",
        local_path: body.localPath || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error("שגיאה ביצירת פרויקט:", error);
      return NextResponse.json(
        { message: "שגיאה ביצירת פרויקט" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("שגיאה כללית ביצירת פרויקט:", error);
    return NextResponse.json(
      { message: "שגיאה כללית בעת יצירת פרויקט" },
      { status: 500 }
    );
  }
}

 