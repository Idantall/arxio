import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// שם כינוי עבור supabaseAdmin כדי לא לשנות את הקוד האחר
const supabase = supabaseAdmin;

// סוגי סריקות אפשריים
type ScanType = 'SAST' | 'DAST' | 'API';

// פונקציה לפרסום הסריקה לתור העבודה
async function publishScanToQueue(scanId: string, scanType: ScanType, target: string, parameters: any = {}) {
  try {
    // בדיקה אם טבלת scan_queue קיימת
    const { error: tableCheckError } = await supabase
      .from('scan_queue')
      .select('id')
      .limit(1);

    // אם יש שגיאה והיא מציינת שהטבלה לא קיימת
    if (tableCheckError && tableCheckError.message.includes('does not exist')) {
      console.error('טבלת scan_queue לא קיימת');
      throw new Error('טבלת scan_queue לא קיימת במסד הנתונים');
    }

    // הוספת הסריקה לתור
    const { data, error } = await supabase
      .from('scan_queue')
      .insert({
        id: scanId,
        scan_type: scanType,
        target,
        parameters,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('שגיאה בהוספת סריקה לתור:', error);
      throw error;
    }
    
    // עדכון סטטוס לממתין לעיבוד
    await supabase
      .from('scans')
      .update({ 
        status: 'pending',
        message: 'ממתין לעיבוד על ידי Worker'
      })
      .eq('id', scanId);
    
    // טיפול מיוחד עבור סריקות DAST
    if (scanType === 'DAST') {
      console.log(`מתחיל סריקת DAST ${scanId} עבור היעד: ${target}`);
      
      // וידוא שהיעד מתחיל ב-http:// או https://
      let validatedTarget = target;
      if (!target.startsWith('http://') && !target.startsWith('https://')) {
        validatedTarget = 'https://' + target;
        console.log(`תיקון יעד סריקת DAST ל: ${validatedTarget}`);
        
        // עדכון היעד בטבלת הסריקות
        await supabase
          .from('scans')
          .update({ target: validatedTarget })
          .eq('id', scanId);
        
        // עדכון גם בטבלת התור
        await supabase
          .from('scan_queue')
          .update({ target: validatedTarget })
          .eq('id', scanId);
      }
    }
    
    console.log(`סריקה ${scanId} הועברה בהצלחה לתור ותתבצע בקרוב על ידי Worker`);
    return true;
  } catch (error) {
    console.error('שגיאה בפרסום בקשת סריקה:', error);
    
    // עדכון סטטוס לשגיאה
    try {
      await supabase
        .from('scans')
        .update({
          status: 'error',
          error_message: error instanceof Error ? error.message : 'שגיאה לא ידועה בהוספה לתור',
          completed_at: new Date().toISOString()
        })
        .eq('id', scanId);
    } catch (updateError) {
      console.error(`שגיאה בעדכון סטטוס שגיאה לסריקה ${scanId}:`, updateError);
    }
    
    return false;
  }
}

// קבלת סריקות לפרויקט ספציפי
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`מנסה לשלוף סריקות עבור פרויקט: ${params.id}`);
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      console.warn("אין משתמש מחובר או אין ID למשתמש");
      return NextResponse.json(
        { message: "לא מורשה" },
        { status: 401 }
      );
    }
    
    // בדיקה אם הפרויקט קיים ושייך למשתמש
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();
    
    if (projectError || !project) {
      console.warn("הפרויקט לא נמצא או לא שייך למשתמש הנוכחי");
      return NextResponse.json(
        { message: "הפרויקט לא נמצא או שאין לך הרשאות לצפות בסריקות שלו" },
        { status: 404 }
      );
    }
    
    // בדיקה אם טבלת הסריקות קיימת
    try {
      // שליפת סריקות מסופאבייס
      const { data: scans, error } = await supabase
        .from('scans')
        .select(`
          id,
          project_id,
          type,
          status,
          started_at,
          completed_at,
          target,
          findings_count
        `)
        .eq('project_id', params.id)
        .order('started_at', { ascending: false });
      
      if (error) {
        // אם יש שגיאה, ייתכן שהטבלה לא קיימת
        console.error("שגיאה בשליפת סריקות:", error);
        
        if (error.message.includes('relation "scans" does not exist')) {
          console.log("טבלת הסריקות לא קיימת, מחזיר מערך ריק");
          return NextResponse.json([]);
        }
        
        return NextResponse.json(
          { message: "שגיאה בשליפת סריקות", error: error.message },
          { status: 500 }
        );
      }
      
      // המרת המידע לפורמט הנדרש בממשק
      const formattedScans = scans.map(scan => ({
        id: scan.id,
        type: scan.type,
        status: scan.status,
        startedAt: scan.started_at,
        completedAt: scan.completed_at || undefined,
        findingsCount: scan.findings_count || {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0
        }
      }));
      
      console.log(`נמצאו ${formattedScans.length} סריקות לפרויקט ${params.id}`);
      return NextResponse.json(formattedScans);
    } catch (error) {
      console.error("שגיאה בשליפת סריקות:", error);
      
      // במקרה של שגיאה, להחזיר מערך ריק כברירת מחדל
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("שגיאה כללית בשליפת סריקות:", error);
    const errorMessage = error instanceof Error ? error.message : "שגיאה כללית";
    return NextResponse.json(
      { message: "שגיאה כללית בשליפת סריקות", error: errorMessage },
      { status: 500 }
    );
  }
}

// יצירת סריקה חדשה לפרויקט
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`מנסה ליצור סריקה חדשה עבור פרויקט: ${params.id}`);
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      console.warn("אין משתמש מחובר או אין ID למשתמש");
      return NextResponse.json(
        { message: "לא מורשה" },
        { status: 401 }
      );
    }
    
    // בדיקה אם הפרויקט קיים ושייך למשתמש
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();
    
    if (projectError || !project) {
      console.warn("הפרויקט לא נמצא או לא שייך למשתמש הנוכחי");
      return NextResponse.json(
        { message: "הפרויקט לא נמצא או שאין לך הרשאות ליצור סריקות עבורו" },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    console.log("נתוני סריקה חדשה:", body);
    
    // וידוא שסוג הסריקה תקין
    const validScanTypes = ['SAST', 'DAST', 'API'];
    if (!body.scanType || !validScanTypes.includes(body.scanType)) {
      return NextResponse.json(
        { message: "סוג סריקה לא תקין" },
        { status: 400 }
      );
    }
    
    // בדיקה אם טבלת הסריקות קיימת והגדרתה אם לא
    try {
      // בדיקה אם הטבלה קיימת
      const { error: tableCheckError } = await supabase
        .from('scans')
        .select('id')
        .limit(1);
      
      if (tableCheckError && tableCheckError.message.includes('relation "scans" does not exist')) {
        console.log("טבלת הסריקות לא קיימת, יוצר אותה");
        
        // יצירת טבלת הסריקות
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.scans (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK (type IN ('SAST', 'DAST', 'API')),
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'error')),
            target TEXT,
            started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            completed_at TIMESTAMP WITH TIME ZONE,
            findings_count JSONB DEFAULT '{"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}'::jsonb,
            results JSONB,
            CONSTRAINT fk_project FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
          );
          
          CREATE TABLE IF NOT EXISTS public.findings_count (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
            critical INTEGER DEFAULT 0,
            high INTEGER DEFAULT 0,
            medium INTEGER DEFAULT 0,
            low INTEGER DEFAULT 0,
            info INTEGER DEFAULT 0,
            CONSTRAINT fk_scan FOREIGN KEY(scan_id) REFERENCES scans(id) ON DELETE CASCADE
          );
          
          ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "משתמשים יכולים לראות את הסריקות של הפרויקטים שלהם" 
            ON public.scans 
            FOR SELECT 
            USING (auth.uid() = user_id);
            
          CREATE POLICY "משתמשים יכולים ליצור סריקות לפרויקטים שלהם" 
            ON public.scans 
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
            
          CREATE POLICY "Service roles יכולים לעשות הכל" 
            ON public.scans 
            USING (auth.role() = 'service_role');
            
          ALTER TABLE public.findings_count ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Service roles יכולים לעשות הכל עם findings_count" 
            ON public.findings_count 
            USING (auth.role() = 'service_role');
            
          CREATE POLICY "משתמשים יכולים לראות את ה-findings של הסריקות שלהם" 
            ON public.findings_count 
            FOR SELECT 
            USING (
              EXISTS (
                SELECT 1 FROM public.scans 
                WHERE scans.id = findings_count.scan_id 
                AND scans.user_id = auth.uid()
              )
            );
        `;
        
        const { error: createError } = await supabase.rpc('pgql', { query: createTableSQL });
        
        if (createError) {
          console.error("שגיאה ביצירת טבלת הסריקות:", createError);
          return NextResponse.json(
            { message: "שגיאה ביצירת טבלת הסריקות", error: createError.message },
            { status: 500 }
          );
        }
        
        console.log("טבלת הסריקות נוצרה בהצלחה");
      }
      
      // הכנת היעד לסריקה בהתאם לסוג הפרויקט
      let target = body.target || '';
      if (!target) {
        if (project.repository_url) {
          target = project.repository_url;
        } else if (project.local_path) {
          target = project.local_path;
        }
      }
      
      // יצירת רשומה לסריקה חדשה
      const { data: newScan, error: insertError } = await supabase
        .from('scans')
        .insert({
          project_id: params.id,
          user_id: session.user.id,
          type: body.scanType,
          status: 'pending',
          target: target,
          started_at: new Date().toISOString(),
          findings_count: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0
          }
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("שגיאה ביצירת סריקה חדשה:", insertError);
        return NextResponse.json(
          { message: "שגיאה ביצירת סריקה חדשה", error: insertError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        message: "סריקה חדשה נוצרה בהצלחה",
        scan: {
          id: newScan.id,
          type: newScan.type,
          status: newScan.status,
          startedAt: newScan.started_at
        }
      });
    } catch (error) {
      console.error("שגיאה כללית ביצירת סריקה חדשה:", error);
      return NextResponse.json(
        { message: "שגיאה כללית ביצירת סריקה חדשה", error: String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("שגיאה כללית ביצירת סריקה חדשה:", error);
    const errorMessage = error instanceof Error ? error.message : "שגיאה כללית";
    return NextResponse.json(
      { message: "שגיאה כללית ביצירת סריקה חדשה", error: errorMessage },
      { status: 500 }
    );
  }
} 