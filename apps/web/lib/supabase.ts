import { createClient } from '@supabase/supabase-js';

// מפתחות Supabase האמיתיים
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTI3Mzk0MSwiZXhwIjoyMDYwODQ5OTQxfQ.mnXnBpFFOytuio-rgjyx_vbthCnPmhaLaFwyH2oXLko';

// לקוח עבור פעולות במצב פומבי/אנונימי (למשל בצד הלקוח)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// לקוח עבור פעולות אדמיניסטרטיביות (למשל בצד השרת)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// פונקציית עזר להרשמת משתמשים
export async function signUp(email: string, password: string, userData?: any) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

// פונקציית עזר להתחברות משתמשים
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

// פונקציית עזר להתנתקות
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }

  return true;
}

// פונקציית עזר לקבלת המשתמש הנוכחי
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user;
}

// פונקציית עזר לעדכון פרטי משתמש
export async function updateUserProfile(userId: string, userData: any) {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { user_metadata: userData }
  );

  if (error) {
    throw error;
  }

  return data;
} 