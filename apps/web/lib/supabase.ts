import { createClient } from '@supabase/supabase-js';

// מפתחות Supabase האמיתיים
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sahiuqlyojjjvijzbfqt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzM5NDEsImV4cCI6MjA2MDg0OTk0MX0.4i0Av6P-Ol8R-Zs9xIJtlhrEnsH_CsubbgcWNLfGTZM';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaGl1cWx5b2pqanZpanpiZnF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTI3Mzk0MSwiZXhwIjoyMDYwODQ5OTQxfQ.mnXnBpFFOytuio-rgjyx_vbthCnPmhaLaFwyH2oXLko';

// לוג לבדיקת המפתחות
console.log('הגדרות Supabase:', { 
  url: supabaseUrl, 
  anonKeyPrefix: supabaseAnonKey.substring(0, 10) + '...',
  serviceKeyPrefix: supabaseServiceKey.substring(0, 10) + '...' 
});

// לקוח עבור פעולות במצב פומבי/אנונימי (למשל בצד הלקוח)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// לקוח עבור פעולות אדמיניסטרטיביות (למשל בצד השרת)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true
  }
});

// פונקציית עזר להרשמת משתמשים
export async function signUp(email: string, password: string, userData?: any) {
  console.log('מתחיל תהליך הרשמה למשתמש:', email);
  console.log('כתובת Supabase:', supabaseUrl);
  console.log('משתמש במפתח אנונימי:', supabaseAnonKey.substring(0, 20) + '...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) {
      console.error('שגיאת הרשמה ב-Supabase:', error);
      throw error;
    }

    console.log('משתמש נרשם בהצלחה:', data.user?.id);
    return data;
  } catch (error) {
    console.error('שגיאה בלתי צפויה בהרשמה:', error);
    throw error;
  }
}

// פונקציית עזר להתחברות משתמשים
export async function signIn(email: string, password: string) {
  console.log('מנסה להתחבר למשתמש באמצעות Supabase:', email);
  console.log('משתמש בכתובת:', supabaseUrl);
  console.log('משתמש בקידומת מפתח:', supabaseAnonKey.substring(0, 15) + '...');
  
  try {
    console.log('קורא ל-Supabase auth.signInWithPassword...');
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    const { data, error } = result;
    
    if (error) {
      console.error('פרטי שגיאת התחברות Supabase:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      
      // מידע מפורט יותר על השגיאה
      if (error.message.includes('Invalid login credentials')) {
        console.error('ההתחברות נכשלה: אימייל או סיסמה שגויים');
      } else if (error.message.includes('Email not confirmed')) {
        console.error('ההתחברות נכשלה: האימייל לא אומת');
      }
      
      throw error;
    }

    if (!data.user) {
      console.error('ההתחברות הצליחה אבל לא הוחזר משתמש');
      throw new Error('לא הוחזרו נתוני משתמש מ-Supabase');
    }

    console.log('המשתמש התחבר בהצלחה:', data.user.id);
    console.log('אימייל המשתמש:', data.user.email);
    console.log('מטא-דאטה של המשתמש:', data.user.user_metadata);
    console.log('הסשן פג תוקף ב:', data.session?.expires_at);
    
    return data;
  } catch (error) {
    console.error('שגיאת התחברות בלתי צפויה:');
    if (error instanceof Error) {
      console.error('הודעת שגיאה:', error.message);
      console.error('מחסנית שגיאה:', error.stack);
    } else {
      console.error('סוג שגיאה לא ידוע:', error);
    }
    throw error;
  }
}

// פונקציית עזר להתנתקות
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('שגיאת התנתקות Supabase:', error);
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