import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// יצירת חיבור ל-Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('חסרים פרטי התחברות ל-Supabase');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { tables } = await request.json();
    console.log('הגדרת טבלאות מסד נתונים:', tables);
    
    const results: Record<string, any> = {};
    
    // בדיקת ויצירת טבלת סריקות
    if (tables.includes('scans')) {
      try {
        // בדיקה אם הטבלה קיימת
        const { data: scanExists, error: scanCheckError } = await supabase
          .from('scans')
          .select('id')
          .limit(1);
        
        if (scanCheckError && scanCheckError.message.includes('relation "scans" does not exist')) {
          console.log('טבלת scans לא קיימת, יוצר...');
          
          // יצירת טבלת סריקות
          const createScansQuery = `
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
            
            -- מדיניות ביטחון: משתמשים יכולים לראות את הסריקות שלהם
            CREATE POLICY "Users can view their own scans" ON public.scans
              FOR SELECT USING (auth.uid() = user_id);
              
            -- מדיניות ביטחון: משתמשים יכולים ליצור סריקות
            CREATE POLICY "Users can create scans" ON public.scans
              FOR INSERT WITH CHECK (auth.uid() = user_id);
              
            -- מדיניות ביטחון: משתמשים יכולים לעדכן את הסריקות שלהם
            CREATE POLICY "Users can update their own scans" ON public.scans
              FOR UPDATE USING (auth.uid() = user_id);
          `;
          
          // הרצת השאילתה באמצעות פונקציה ייעודית או באמצעות RPC אם זמין
          try {
            // ניסיון להשתמש ב-RPC
            const { error: rpcError } = await supabase.rpc('exec_sql', { query: createScansQuery });
            
            if (rpcError) {
              if (rpcError.message.includes('function "exec_sql" does not exist')) {
                // אם הפונקציה לא קיימת, צריך ליצור אותה או להשתמש בשיטה אחרת
                results.scans = {
                  success: false,
                  error: 'פונקציית exec_sql לא קיימת במסד הנתונים, יש להתקין אותה או להשתמש ב-Supabase SQL Editor באופן ידני'
                };
              } else {
                results.scans = {
                  success: false,
                  error: rpcError.message
                };
              }
            } else {
              results.scans = {
                success: true,
                message: 'טבלת scans נוצרה בהצלחה'
              };
            }
          } catch (createError) {
            results.scans = {
              success: false,
              error: createError instanceof Error ? createError.message : String(createError)
            };
          }
        } else {
          results.scans = {
            success: true,
            message: 'טבלת scans כבר קיימת'
          };
        }
      } catch (error) {
        results.scans = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    // בדיקת ויצירת טבלת ממצאים
    if (tables.includes('findings')) {
      try {
        // בדיקה אם הטבלה קיימת
        const { data: findingsExists, error: findingsCheckError } = await supabase
          .from('findings')
          .select('id')
          .limit(1);
        
        if (findingsCheckError && findingsCheckError.message.includes('relation "findings" does not exist')) {
          console.log('טבלת findings לא קיימת, יוצר...');
          
          // יצירת טבלת ממצאים
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
            
            -- מדיניות ביטחון: משתמשים יכולים לראות את הממצאים של הסריקות שלהם
            CREATE POLICY "Users can view findings from their scans" ON public.findings
              FOR SELECT USING (
                scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid())
              );
          `;
          
          // הרצת השאילתה באמצעות פונקציה ייעודית או באמצעות RPC אם זמין
          try {
            // ניסיון להשתמש ב-RPC
            const { error: rpcError } = await supabase.rpc('exec_sql', { query: createFindingsQuery });
            
            if (rpcError) {
              if (rpcError.message.includes('function "exec_sql" does not exist')) {
                // אם הפונקציה לא קיימת, צריך ליצור אותה או להשתמש בשיטה אחרת
                results.findings = {
                  success: false,
                  error: 'פונקציית exec_sql לא קיימת במסד הנתונים, יש להתקין אותה או להשתמש ב-Supabase SQL Editor באופן ידני'
                };
              } else {
                results.findings = {
                  success: false,
                  error: rpcError.message
                };
              }
            } else {
              results.findings = {
                success: true,
                message: 'טבלת findings נוצרה בהצלחה'
              };
            }
          } catch (createError) {
            results.findings = {
              success: false,
              error: createError instanceof Error ? createError.message : String(createError)
            };
          }
        } else {
          results.findings = {
            success: true,
            message: 'טבלת findings כבר קיימת'
          };
        }
      } catch (error) {
        results.findings = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    // בדיקת ויצירת טבלת scan_queue אם נדרש
    if (tables.includes('scan_queue')) {
      try {
        // בדיקה אם הטבלה קיימת
        const { data: queueExists, error: queueCheckError } = await supabase
          .from('scan_queue')
          .select('id')
          .limit(1);
        
        if (queueCheckError && queueCheckError.message.includes('relation "scan_queue" does not exist')) {
          console.log('טבלת scan_queue לא קיימת, יוצר...');
          
          // יצירת טבלת תור סריקות
          const createQueueQuery = `
            CREATE TABLE IF NOT EXISTS public.scan_queue (
              id TEXT PRIMARY KEY,
              scan_type TEXT NOT NULL,
              target TEXT NOT NULL,
              parameters JSONB DEFAULT '{}'::jsonb,
              status TEXT DEFAULT 'pending' NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              processed_at TIMESTAMP WITH TIME ZONE
            );
            
            -- הגדרת הרשאות
            ALTER TABLE public.scan_queue ENABLE ROW LEVEL SECURITY;
            
            -- מדיניות ביטחון: רק מנהלי מערכת יכולים לגשת לתור
            CREATE POLICY "Only admins can access queue" ON public.scan_queue
              USING (auth.role() = 'service_role');
          `;
          
          // הרצת השאילתה
          try {
            // ניסיון להשתמש ב-RPC
            const { error: rpcError } = await supabase.rpc('exec_sql', { query: createQueueQuery });
            
            if (rpcError) {
              if (rpcError.message.includes('function "exec_sql" does not exist')) {
                results.scan_queue = {
                  success: false,
                  error: 'פונקציית exec_sql לא קיימת במסד הנתונים'
                };
              } else {
                results.scan_queue = {
                  success: false,
                  error: rpcError.message
                };
              }
            } else {
              results.scan_queue = {
                success: true,
                message: 'טבלת scan_queue נוצרה בהצלחה'
              };
            }
          } catch (createError) {
            results.scan_queue = {
              success: false,
              error: createError instanceof Error ? createError.message : String(createError)
            };
          }
        } else {
          results.scan_queue = {
            success: true,
            message: 'טבלת scan_queue כבר קיימת'
          };
        }
      } catch (error) {
        results.scan_queue = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('שגיאה כללית בהגדרת מסד הנתונים:', error);
    return NextResponse.json({ 
      error: `שגיאה כללית: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 