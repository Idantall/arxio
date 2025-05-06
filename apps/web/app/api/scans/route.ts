import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth/next';

// יצירת חיבור ל-Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('חסרים פרטי התחברות ל-Supabase');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// פונקציה לבדיקה שהטבלאות הדרושות קיימות
async function ensureRequiredTables() {
  const requiredTables = ['scans', 'findings', 'scan_queue', 'projects', 'users'];
  const missingTables = [];
  const tableErrors = {};
  
  console.log("מתחיל בדיקת טבלאות חיוניות:", requiredTables);
  
  // בדיקת כל טבלה דרושה
  for (const table of requiredTables) {
    try {
      console.log(`בודק טבלה: ${table}`);
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
        
      if (error) {
        console.log(`שגיאה בטבלה ${table}:`, error.message);
        if (error.message.includes('does not exist')) {
          missingTables.push(table);
          tableErrors[table] = error.message;
        } else {
          // שגיאה אחרת שאינה העדר טבלה
          tableErrors[table] = error.message;
        }
      } else {
        console.log(`טבלת ${table} קיימת ותקינה`);
      }
    } catch (error) {
      console.error(`שגיאה כללית בבדיקת טבלה ${table}:`, error);
      tableErrors[table] = error instanceof Error ? error.message : String(error);
    }
  }
  
  // תוצאת הבדיקה
  const result = {
    allTablesExist: missingTables.length === 0,
    missingTables,
    tableErrors
  };
  
  console.log("תוצאת בדיקת טבלאות:", result);
  
  if (missingTables.length > 0) {
    console.warn('חסרות הטבלאות הבאות במסד הנתונים:', missingTables);
    console.warn('פרטי שגיאות:', tableErrors);
    
    // יצירת טבלאות חסרות אוטומטית (ב-SQL)
    // הערה: דרך ה-API של סופאבייס אי אפשר ליצור טבלאות, אבל אנחנו יכולים להציע SQL ליצירה ידנית
    
    if (missingTables.includes('scans')) {
      console.log(`
        SQL ליצירת טבלת scans:
        CREATE TABLE public.scans (
          id UUID PRIMARY KEY,
          project_id UUID REFERENCES public.projects(id),
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          target TEXT NOT NULL,
          status TEXT NOT NULL,
          user_id UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          start_time TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          findings_count JSONB DEFAULT '{"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}'::jsonb,
          error_message TEXT,
          parameters JSONB DEFAULT '{}'::jsonb,
          results JSONB DEFAULT '{}'::jsonb,
          is_example BOOLEAN DEFAULT false
        );
        
        COMMENT ON COLUMN public.scans.findings_count IS 'מספר ממצאים לפי רמת חומרה כ-JSONB { critical, high, medium, low, info }';
        COMMENT ON COLUMN public.scans.is_example IS 'האם זו סריקת דוגמה/הדגמה';
      `);
    }
    
    if (missingTables.includes('findings')) {
      console.log(`
        SQL ליצירת טבלת findings:
        CREATE TABLE public.findings (
          id UUID PRIMARY KEY,
          scan_id UUID REFERENCES public.scans(id),
          severity TEXT NOT NULL,
          rule_id TEXT,
          title TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
      `);
    }
    
    if (missingTables.includes('scan_queue')) {
      console.log(`
        SQL ליצירת טבלת scan_queue:
        CREATE TABLE public.scan_queue (
          id UUID PRIMARY KEY,
          type TEXT NOT NULL,
          target TEXT NOT NULL,
          parameters JSONB DEFAULT '{}'::jsonb,
          status TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          processed_at TIMESTAMP WITH TIME ZONE
        );
      `);
    }
    
    if (missingTables.includes('projects')) {
      console.log(`
        SQL ליצירת טבלת projects:
        CREATE TABLE public.projects (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL,
          user_id UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
      `);
    }
  }
  
  return result;
}

// סוגי סריקות אפשריים
type ScanType = 'DAST' | 'SAST' | 'API';

// פונקציה לפרסום בקשת סריקה לשירות
async function publishScanRequest(scanId: string, scanType: ScanType, target: string, parameters: any = {}) {
  try {
    // בדיקה אם טבלת scan_queue קיימת
    const { error: tableCheckError } = await supabase
      .from('scan_queue')
      .select('id')
      .limit(1);

    // אם יש שגיאה והיא מציינת שהטבלה לא קיימת
    if (tableCheckError && tableCheckError.message.includes('does not exist')) {
      console.log('טבלת scan_queue לא קיימת');
      throw new Error('טבלת scan_queue לא קיימת במסד הנתונים');
    }

    // הוספת הסריקה לתור
    const { data, error } = await supabase
      .from('scan_queue')
      .insert({
        id: scanId,
        type: scanType,
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

// הפונקציה מטפלת בבקשת GET לקבלת מידע על סריקה
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scanId = searchParams.get('id');
  const userId = searchParams.get('userId');

  // אם יש מזהה משתמש, מחזירים את כל הסריקות של המשתמש
  if (userId) {
    try {
      // בדיקת קיום הטבלאות הנדרשות
      const { allTablesExist, missingTables } = await ensureRequiredTables();
      
      if (!allTablesExist) {
        return NextResponse.json(
          { 
            error: 'לא ניתן לקבל מידע על סריקות - חסרות טבלאות במסד הנתונים', 
            missingTables,
            requiredAction: 'יש ליצור את הטבלאות החסרות במסד הנתונים לפני המשך השימוש במערכת'
          },
          { status: 500 }
        );
      }

      // קבלת כל הסריקות של המשתמש
      const { data: scans, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('שגיאה בקבלת סריקות המשתמש:', error);
        throw error;
      }

      return NextResponse.json(scans || []);
    } catch (error) {
      console.error('שגיאה בקבלת סריקות המשתמש:', error);
      return NextResponse.json(
        { error: 'שגיאת שרת בקבלת סריקות המשתמש' },
        { status: 500 }
      );
    }
  }

  // אם יש מזהה סריקה, מחזירים את פרטי הסריקה הספציפית
  if (scanId) {
    try {
      // בדיקת קיום הטבלאות הנדרשות
      const { allTablesExist, missingTables } = await ensureRequiredTables();
      
      if (!allTablesExist) {
        return NextResponse.json(
          { 
            error: 'לא ניתן לקבל מידע על סריקות - חסרות טבלאות במסד הנתונים', 
            missingTables,
            requiredAction: 'יש ליצור את הטבלאות החסרות במסד הנתונים לפני המשך השימוש במערכת'
          },
          { status: 500 }
        );
      }

      // מנסה לקבל פרטי סריקה מ-Supabase
      const { data: scan, error } = await supabase
        .from('scans')
        .select('*')
        .eq('id', scanId)
        .single();

      if (error) throw error;

      if (!scan) {
        return NextResponse.json(
          { error: 'סריקה לא נמצאה' },
          { status: 404 }
        );
      }

      // קבלת הממצאים של הסריקה
      const { data: findings, error: findingsError } = await supabase
        .from('findings')
        .select('*')
        .eq('scan_id', scanId);

      if (findingsError) {
        console.error('שגיאה בקבלת ממצאי הסריקה:', findingsError);
        return NextResponse.json(
          { error: 'שגיאה בקבלת ממצאי הסריקה' },
          { status: 500 }
        );
      }

      // החזרת הנתונים המשולבים
      return NextResponse.json({
        ...scan,
        findings: findings || []
      });
    } catch (error) {
      console.error('שגיאה בקבלת פרטי סריקה:', error);
      return NextResponse.json(
        { error: 'שגיאת שרת בקבלת פרטי סריקה' },
        { status: 500 }
      );
    }
  }

  // אם לא נשלח מזהה סריקה או מזהה משתמש
  return NextResponse.json(
    { error: 'נדרש מזהה סריקה או מזהה משתמש' },
    { status: 400 }
  );
}

// פונקציה לוידוא קיום טבלת הסריקות
async function ensureScansTable() {
  try {
    // בדיקה אם הטבלה קיימת
    const { error } = await supabase
      .from('scans')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') { // טבלה לא קיימת
      console.log('טבלת הסריקות לא קיימת, יוצר אותה');
      
      // יצירת הטבלה
      const { error: createError } = await supabase.rpc('create_scans_table');
      
      if (createError) {
        throw new Error(`שגיאה ביצירת טבלת סריקות: ${createError.message}`);
      }
      
      console.log('טבלת הסריקות נוצרה בהצלחה');
    }
    
    return true;
  } catch (error) {
    console.error('שגיאה בבדיקת/יצירת טבלת סריקות:', error);
    throw error;
  }
}

// טיפול בייבוא createExampleScans בדרך מוגנת משגיאות
let createExampleScans: (userId: string, projectId?: string) => Promise<boolean>;
try {
  // ניסיון לייבא את הפונקציה
  const importedModule = require('./createExampleScans');
  createExampleScans = importedModule.createExampleScans;
  console.log('פונקציית createExampleScans נטענה בהצלחה');
} catch (error) {
  console.error('שגיאה בייבוא createExampleScans:', error);
  // פונקציה חלופית במקרה של שגיאה
  createExampleScans = async (userId: string, projectId?: string) => {
    console.log('שימוש בפונקציה חלופית - לא יוצר סריקות לדוגמה');
    return false;
  };
}

// פונקציה עזר לבדיקת תקינות של URL
function isValidUrl(url: string): boolean {
  try {
    // בדיקת פורמט בסיסי
    if (!url || url.trim().length === 0) return false;
    
    // בדיקה אם התחלת ה-URL היא תקינה
    const urlChecked = url.toLowerCase();
    
    // עבור סריקות אתרים, נדרש URL מלא
    return urlChecked.startsWith('http://') || urlChecked.startsWith('https://') || 
           // או תחום פשוט כמו example.com
           /^[a-z0-9]([a-z0-9-]+\.)+[a-z0-9]{2,}$/i.test(urlChecked);
  } catch (error) {
    console.error('שגיאה בבדיקת תקינות URL:', error);
    return false;
  }
}

// פונקציית עזר לבדיקת תקינות של סוג סריקה
function isValidScanType(type: string): type is ScanType {
  return ['DAST', 'SAST', 'API'].includes(type);
}

// הפונקציה מטפלת בבקשת POST להתחלת סריקה חדשה
export async function POST(request: Request) {
  try {
    console.log('התקבלה בקשה ליצירת סריקה חדשה');
    
    // קבלת פרטי המשתמש מהסשן
    const session = await getServerSession();
    
    if (!session?.user) {
      console.log('אין משתמש מחובר בסשן');
      return NextResponse.json(
        { error: 'משתמש לא מחובר' },
        { status: 401 }
      );
    }
    
    const { id: sessionUserId, email } = session.user;
    if (!email) {
      return NextResponse.json(
        { error: 'חסר אימייל בסשן המשתמש' },
        { status: 400 }
      );
    }
    
    console.log('התקבל משתמש מהסשן:', { id: sessionUserId, email });
    
    // קבלת נתוני הסריקה מבקשת ה-POST
    const scanData = await request.json();
    console.log('נתוני סריקה שהתקבלו:', scanData);
    
    // אימות שנתוני הסריקה הדרושים קיימים
    if (!scanData.name) {
      return NextResponse.json(
        { error: 'חסר שם לסריקה' },
        { status: 400 }
      );
    }
    
    if (!scanData.url) {
      return NextResponse.json(
        { error: 'חסרה כתובת יעד לסריקה' },
        { status: 400 }
      );
    }
    
    // בדיקה שסוג הסריקה תקין
    if (!scanData.type || !isValidScanType(scanData.type)) {
      return NextResponse.json(
        { error: 'סוג הסריקה חסר או לא תקין (חייב להיות DAST, SAST או API)' },
        { status: 400 }
      );
    }
    
    // בדיקת URL היעד
    const target = scanData.url;
    if (!isValidUrl(target)) {
      return NextResponse.json(
        { error: 'כתובת היעד אינה תקינה' },
        { status: 400 }
      );
    }
    
    // חיפוש המשתמש בטבלת users
    let userId = scanData.userId || sessionUserId;
    let userEmail = email;
    let userFound = false;
    
    // ניסיון לאתר את המשתמש לפי מזהה
    if (userId) {
      const { data: userById, error } = await supabase
        .from('users')
        .select('id, email, plan')
        .eq('id', userId)
        .maybeSingle();
      
      if (!error && userById) {
        console.log('נמצא משתמש לפי מזהה:', userById);
        userId = userById.id;
        userEmail = userById.email || email;
        userFound = true;
      } else if (error) {
        console.log('שגיאה בחיפוש משתמש לפי מזהה:', error.message);
      }
    }
    
    // אם לא נמצא משתמש, מחפשים לפי אימייל
    if (!userFound) {
      const { data: userByEmail, error } = await supabase
        .from('users')
        .select('id, email, plan')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (!error && userByEmail) {
        console.log('נמצא משתמש לפי אימייל:', userByEmail);
        userId = userByEmail.id;
        userEmail = userByEmail.email || email;
        userFound = true;
      } else if (error) {
        console.log('שגיאה בחיפוש משתמש לפי אימייל:', error.message);
      }
    }
    
    // אם לא מצאנו את המשתמש, ננסה ליצור אותו
    if (!userFound) {
      try {
        // יצירת מזהה חדש אם אין מזהה בסשן
        let newUserId = sessionUserId || randomUUID();
        
        // יצירת משתמש חדש בטבלת users
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: newUserId,
            email: email.toLowerCase(),
            plan: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('שגיאה ביצירת משתמש חדש:', insertError);
          
          // אם לא הצלחנו ליצור משתמש חדש, נשתמש במזהה מהסשן
          userId = sessionUserId || randomUUID();
        } else if (newUser) {
          console.log('נוצר משתמש חדש:', newUser);
          userId = newUser.id;
          userEmail = newUser.email;
          userFound = true;
        }
      } catch (createError) {
        console.error('שגיאה בתהליך יצירת משתמש:', createError);
        // שימוש במזהה מהסשן כגיבוי
        userId = sessionUserId || randomUUID();
      }
    }
    
    // יצירת מזהה ייחודי לסריקה
    const scanId = randomUUID();
    
    // קביעת סוג סריקה - וידוא שהוא אחד מהערכים המותרים
    const scanType = scanData.type as ScanType;
    
    // וידוא שהיעד תקין לפי סוג הסריקה
    let validatedTarget = target;
    if (scanType === 'DAST' && !target.startsWith('http://') && !target.startsWith('https://')) {
      validatedTarget = 'https://' + target;
      console.log(`תיקון יעד סריקת DAST ל: ${validatedTarget}`);
    }
    
    // הכנת נתוני הסריקה לשמירה
    const scanToInsert = {
      id: scanId,
      name: scanData.name,
      type: scanType,
      target: validatedTarget,
      status: 'created',
      user_id: userId,
      created_at: new Date().toISOString(),
      start_time: null,
      completed_at: null,
      findings_count: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      error_message: null,
      parameters: scanData.parameters || {},
      results: {},
      is_example: false
    };
    
    console.log('מנסה ליצור סריקה חדשה:', scanToInsert);
    
    // שמירת הסריקה בטבלת scans
    const { data: newScan, error: scanError } = await supabase
      .from('scans')
      .insert(scanToInsert)
      .select()
      .single();
    
    if (scanError) {
      console.error('שגיאה ביצירת סריקה חדשה:', scanError);
      return NextResponse.json(
        { error: 'שגיאה ביצירת סריקה: ' + scanError.message },
        { status: 500 }
      );
    }
    
    console.log('נוצרה סריקה חדשה בהצלחה:', newScan);
    
    // ניסיון לפרסם את הסריקה לתור
    try {
      await publishScanRequest(
        scanId, 
        scanType, 
        validatedTarget, 
        scanData.parameters || {}
      );
      console.log('הסריקה נוספה לתור בהצלחה');
    } catch (queueError) {
      console.error('שגיאה בהוספת סריקה לתור:', queueError);
      // שגיאה בתור אינה מבטלת את יצירת הסריקה
    }
    
    // עדכון מספר הסריקות של המשתמש (אופציונלי)
    try {
      if (userFound) {
        const { data: userScans } = await supabase
          .from('scans')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .or('status.eq.running');
        
        const activeScansCount = userScans?.length || 0;
        
        await supabase
          .from('users')
          .update({
            active_scans: activeScansCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }
    } catch (updateError) {
      console.error('שגיאה בעדכון מספר הסריקות של המשתמש:', updateError);
      // שגיאה זו אינה קריטית ולכן אנחנו ממשיכים
    }
    
    // החזרת הסריקה החדשה כתגובה
    return NextResponse.json({
      success: true,
      scan: newScan,
      message: 'הסריקה נוצרה בהצלחה ונוספה לתור'
    });
    
  } catch (error) {
    console.error('שגיאה כללית ביצירת סריקה:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת ביצירת סריקה', details: error instanceof Error ? error.message : 'שגיאה לא ידועה' },
      { status: 500 }
    );
  }
} 