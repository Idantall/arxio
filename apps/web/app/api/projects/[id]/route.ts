import { NextResponse } from 'next/server';
import { projectSchema } from '@arxio/types';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// קבלת פרויקט לפי מזהה
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`מנסה לשלוף פרויקט עם מזהה: ${params.id}`);
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      console.warn("אין משתמש מחובר או אין ID למשתמש");
      return NextResponse.json(
        { message: "לא מורשה" },
        { status: 401 }
      );
    }
    
    // שליפת הפרויקט מסופאבייס
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();
    
    if (error) {
      console.error("שגיאה בשליפת פרויקט:", error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: "הפרויקט לא נמצא" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { message: "שגיאה בשליפת פרויקט", error: error.message },
        { status: 500 }
      );
    }
    
    if (!project) {
      return NextResponse.json(
        { message: "הפרויקט לא נמצא" },
        { status: 404 }
      );
    }
    
    console.log(`פרויקט נמצא: ${project.id}`);
    return NextResponse.json(project);
  } catch (error) {
    console.error("שגיאה כללית בשליפת פרויקט:", error);
    const errorMessage = error instanceof Error ? error.message : "שגיאה כללית";
    return NextResponse.json(
      { message: "שגיאה כללית בשליפת פרויקט", error: errorMessage },
      { status: 500 }
    );
  }
}

// עדכון פרויקט
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`מנסה לעדכן פרויקט עם מזהה: ${params.id}`);
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      console.warn("אין משתמש מחובר או אין ID למשתמש");
      return NextResponse.json(
        { message: "לא מורשה" },
        { status: 401 }
      );
    }
    
    // בדיקה אם הפרויקט קיים ושייך למשתמש
    const { data: existingProject, error: checkError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();
    
    if (checkError || !existingProject) {
      console.warn("הפרויקט לא נמצא או לא שייך למשתמש הנוכחי");
      return NextResponse.json(
        { message: "הפרויקט לא נמצא או שאין לך הרשאות לערוך אותו" },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    console.log("נתוני עדכון פרויקט:", body);
    
    // וידוא תקינות הנתונים
    const validationResult = projectSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("נתונים לא תקינים:", validationResult.error);
      return NextResponse.json(
        { message: "נתונים לא תקינים", errors: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    // עדכון הפרויקט בסופאבייס
    const { data: updatedProject, error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        name: body.name,
        description: body.description || "",
        repository_type: body.repositoryType,
        repository_url: body.repositoryUrl || null,
        branch: body.branch || "main",
        local_path: body.localPath || null,
        status: body.status || 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error("שגיאה בעדכון פרויקט:", updateError);
      return NextResponse.json(
        { message: "שגיאה בעדכון פרויקט", error: updateError.message },
        { status: 500 }
      );
    }
    
    console.log(`פרויקט עודכן בהצלחה: ${updatedProject.id}`);
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("שגיאה כללית בעדכון פרויקט:", error);
    const errorMessage = error instanceof Error ? error.message : "שגיאה כללית";
    return NextResponse.json(
      { message: "שגיאה כללית בעדכון פרויקט", error: errorMessage },
      { status: 500 }
    );
  }
}

// מחיקת פרויקט
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`מנסה למחוק פרויקט עם מזהה: ${params.id}`);
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      console.warn("אין משתמש מחובר או אין ID למשתמש");
      return NextResponse.json(
        { message: "לא מורשה" },
        { status: 401 }
      );
    }
    
    // בדיקה אם הפרויקט קיים ושייך למשתמש
    const { data: existingProject, error: checkError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();
    
    if (checkError || !existingProject) {
      console.warn("הפרויקט לא נמצא או לא שייך למשתמש הנוכחי");
      return NextResponse.json(
        { message: "הפרויקט לא נמצא או שאין לך הרשאות למחוק אותו" },
        { status: 404 }
      );
    }
    
    // מחיקת הפרויקט מסופאבייס
    const { error: deleteError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id);
    
    if (deleteError) {
      console.error("שגיאה במחיקת פרויקט:", deleteError);
      return NextResponse.json(
        { message: "שגיאה במחיקת פרויקט", error: deleteError.message },
        { status: 500 }
      );
    }
    
    console.log(`פרויקט נמחק בהצלחה: ${params.id}`);
    return NextResponse.json(
      { message: "הפרויקט נמחק בהצלחה" },
      { status: 200 }
    );
  } catch (error) {
    console.error("שגיאה כללית במחיקת פרויקט:", error);
    const errorMessage = error instanceof Error ? error.message : "שגיאה כללית";
    return NextResponse.json(
      { message: "שגיאה כללית במחיקת פרויקט", error: errorMessage },
      { status: 500 }
    );
  }
} 