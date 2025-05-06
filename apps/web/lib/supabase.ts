import { createClient, SupabaseClient } from '@supabase/supabase-js';

// מפתחות Supabase האמיתיים
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// לוג לבדיקת המפתחות בצורה בטוחה (רק אם הם קיימים)
if (process.env.NODE_ENV === 'development' && supabaseUrl && (supabaseAnonKey || supabaseServiceKey)) {
  console.log('הגדרות Supabase:', Object.assign(
    { url: supabaseUrl },
    supabaseAnonKey ? { anonKeyPrefix: supabaseAnonKey.substring(0, 5) + '...' } : {},
    supabaseServiceKey ? { serviceKeyPrefix: supabaseServiceKey.substring(0, 5) + '...' } : {}
  ));
}

// בדיקה האם המפתחות מוגדרים
if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceKey)) {
  if (typeof window !== 'undefined') {
    console.error('חסרים מפתחות Supabase - יש להגדיר NEXT_PUBLIC_SUPABASE_URL ו-NEXT_PUBLIC_SUPABASE_ANON_KEY או SUPABASE_SERVICE_KEY');
  }
}

// שמירת הלקוחות הגלובליים כדי למנוע יצירת מופעים מרובים
let globalSupabaseClient: SupabaseClient | null = null;
let globalSupabaseAdminClient: SupabaseClient | null = null;

// פונקציה ליצירת לקוח בטוחה שלא תיכשל אם המפתחות חסרים
const createSafeClient = (url: string, key: string, options = {}, isAdmin = false): SupabaseClient => {
  // בדיקה האם כבר יצרנו לקוח מתאים
  if (isAdmin && globalSupabaseAdminClient) {
    return globalSupabaseAdminClient;
  } else if (!isAdmin && globalSupabaseClient) {
    return globalSupabaseClient;
  }
  
  // יצירת לקוח רק אם יש מפתחות תקינים
  if (url && key) {
    try {
      const client = createClient(url, key, options);
      
      // שמירת הלקוח במשתנה גלובלי למניעת יצירה מרובה
      if (isAdmin) {
        globalSupabaseAdminClient = client;
      } else {
        globalSupabaseClient = client;
      }
      
      return client;
    } catch (error) {
      console.error('שגיאה ביצירת לקוח Supabase:', error);
      
      // אם בצד הלקוח, החזר לקוח דמה כדי למנוע שגיאות קריסה
      if (typeof window !== 'undefined') {
        return createDummyClient() as unknown as SupabaseClient;
      }
      throw error;
    }
  }
  
  // אם בצד הלקוח והמפתחות חסרים, החזר לקוח דמה
  if (typeof window !== 'undefined') {
    console.warn('משתמש בלקוח Supabase דמה כי המפתחות חסרים');
    return createDummyClient() as unknown as SupabaseClient;
  }
  
  // אם בצד השרת, זרוק שגיאה
  throw new Error('חסרים מפתחות Supabase הנדרשים');
};

// הגדרת טיפוס קמפילמנטרי לשגיאות של Supabase
interface SupabaseError extends Error {
  status?: number;
}

// יצירת לקוח דמה שלא יגרום לקריסת האפליקציה בצד הלקוח
const createDummyClient = () => {
  // אובייקט בסיסי שמחזיר נתונים ריקים ושגיאות מתאימות
  const dummyError = (): SupabaseError => {
    const error = new Error('לקוח דמה - המפתחות חסרים') as SupabaseError;
    error.status = 400;
    return error;
  };
  
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: dummyError() }),
      signInWithPassword: () => Promise.resolve({ data: null, error: dummyError() }),
      signUp: () => Promise.resolve({ data: null, error: dummyError() }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: null, unsubscribe: () => {} }),
      admin: {
        listUsers: () => Promise.resolve({ data: { users: [] }, error: dummyError() }),
        createUser: () => Promise.resolve({ data: { user: null }, error: dummyError() }),
        updateUserById: () => Promise.resolve({ data: { user: null }, error: dummyError() })
      }
    },
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => Promise.resolve({ data: [], error: dummyError() }),
        limit: (count: number) => Promise.resolve({ data: [], error: dummyError() }),
        order: (column: string, options: object) => Promise.resolve({ data: [], error: dummyError() }),
        ilike: (column: string, pattern: string) => Promise.resolve({ data: [], error: dummyError() }),
        maybeSingle: () => Promise.resolve({ data: null, error: dummyError() }),
        single: () => Promise.resolve({ data: null, error: dummyError() })
      }),
      insert: (values: any) => Promise.resolve({ data: null, error: dummyError() }),
      update: (values: any) => ({
        eq: (column: string, value: any) => Promise.resolve({ data: null, error: dummyError() }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => Promise.resolve({ data: null, error: dummyError() }),
      }),
    }),
    rpc: (func: string, params: any) => Promise.resolve({ data: null, error: dummyError() })
  };
};

// לקוח עבור פעולות במצב פומבי/אנונימי (למשל בצד הלקוח)
export const supabase = createSafeClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}, false);

// לקוח עבור פעולות אדמיניסטרטיביות (למשל בצד השרת)
export const supabaseAdmin = createSafeClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
}, true);

/**
 * פונקציה שמספקת גישה ללקוח עקבי של Supabase
 * מונעת יצירה מרובה של לקוחות
 */
export function getSupabaseClient(admin = false): SupabaseClient {
  if (admin) {
    return supabaseAdmin;
  }
  return supabase;
}

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

// פונקציית עזר לבדיקת UUID תקין
export function isValidUUID(str: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// פונקציית עזר לקבלת מזהה המשתמש לפי אימייל
export async function getUserIdByEmail(email: string) {
  if (!email) return null;
  
  console.log('מחפש מזהה משתמש לפי אימייל:', email);
  
  try {
    // חיפוש ב-Supabase Auth
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsers && authUsers.users && authUsers.users.length > 0) {
      // שימוש בהגדרת טיפוס מפורשת כדי לפתור את בעיית ה-never
      type UserWithEmail = { email?: string; id?: string };
      
      const user = authUsers.users.find((u: UserWithEmail) => 
        u.email?.toLowerCase() === email.toLowerCase()
      );
      
      if (user && user.id) {
        console.log('נמצא משתמש ב-Supabase Auth:', user.id);
        return user.id;
      }
    }
    
    // אם לא נמצא ב-Auth, מחפש בטבלת users
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1);
      
    if (error) {
      console.error('שגיאה בחיפוש משתמש לפי אימייל:', error);
      return null;
    }
    
    if (users && users.length > 0) {
      console.log('נמצא משתמש בטבלת users:', users[0].id);
      return users[0].id;
    }
    
    console.log('לא נמצא משתמש עם האימייל:', email);
    return null;
  } catch (error) {
    console.error('שגיאה בחיפוש משתמש לפי אימייל:', error);
    return null;
  }
} 