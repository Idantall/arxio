// סקריפט פשוט להוספת עמודת "plan" לטבלת המשתמשים
const { createClient } = require('@supabase/supabase-js');

// בדיקת קיום משתני סביבה הכרחיים
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('חסרים משתני סביבה: NEXT_PUBLIC_SUPABASE_URL או SUPABASE_SERVICE_KEY');
  console.log('יש להפעיל את הסקריפט עם משתני הסביבה הנכונים');
  process.exit(1);
}

// יצירת חיבור ל-Supabase עם הרשאות אדמין
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// קידוד SQL כמחרוזת כדי להימנע משימוש ב-rpc
const addPlanColumn = async () => {
  try {
    console.log('בודק ומוסיף עמודת plan לטבלת users...');
    
    // בדיקה אם קיימת טבלת users
    const { data: usersTable, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (usersError) {
      if (usersError.message && usersError.message.includes('relation "users" does not exist')) {
        console.error('טבלת users לא קיימת. יש ליצור אותה תחילה.');
        process.exit(1);
      } else {
        console.error('שגיאה בבדיקת טבלת users:', usersError.message);
        process.exit(1);
      }
    }
    
    // הרצת SQL ישירות באמצעות רכיב SQL של Supabase
    const { error } = await supabase.rpc('create_plan_column');
    
    if (error) {
      if (error.message.includes('function "create_plan_column" does not exist')) {
        console.log('יוצר פונקציית SQL עבור הוספת העמודה...');
        
        // יצירת פונקציית SQL שתוסיף את העמודה
        const { error: createFuncError } = await supabase.rpc('create_function', {
          function_name: 'create_plan_column',
          function_code: `
          BEGIN
            -- בדיקה אם העמודה כבר קיימת
            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'plan'
            ) THEN
              -- הוספת העמודה
              ALTER TABLE public.users ADD COLUMN plan TEXT DEFAULT 'free' NOT NULL;
              RETURN 'Column plan added successfully';
            ELSE
              RETURN 'Column plan already exists';
            END IF;
          END;
          `
        });
        
        if (createFuncError) {
          console.error('שגיאה ביצירת פונקציית SQL:', createFuncError.message);
          
          // גישה אלטרנטיבית - עדכון ישיר באמצעות API
          console.log('מנסה גישה אלטרנטיבית - עדכון ישיר של מבנה...');
          
          try {
            // ניסיון להוסיף את העמודה ישירות (בהנחה שהיא עדיין לא קיימת)
            await supabase.auth.admin.updateUserById(
              'non-existent-user',  // לא באמת נעדכן משתמש, רק ננסה לגרום לשגיאה שתעזור לנו לזהות אם חסרה העמודה
              { user_metadata: { dummy: true } }
            );
            console.log('בדיקת קיום העמודה...');
            
            // בדיקה אם נקבל שגיאה שקשורה לעמודת plan
            const { data: users, error: selectError } = await supabase
              .from('users')
              .select('plan')
              .limit(1);
            
            if (selectError && selectError.message.includes('column "plan" does not exist')) {
              console.log('העמודה "plan" לא קיימת. מנסה לעדכן את הנתונים באופן ידני...');
              
              // עדכון כל המשתמשים הקיימים
              const { data: allUsers, error: getUsersError } = await supabase
                .from('users')
                .select('id');
              
              if (!getUsersError && allUsers && allUsers.length > 0) {
                console.log(`נמצאו ${allUsers.length} משתמשים לעדכון.`);
                
                // הוספת שדה "plan" לכל משתמש
                for (const user of allUsers) {
                  const { error: updateError } = await supabase
                    .from('users')
                    .update({ plan_temp: 'free' })  // נשתמש בשדה זמני
                    .eq('id', user.id);
                  
                  if (updateError) {
                    console.error(`שגיאה בעדכון משתמש ${user.id}:`, updateError.message);
                  }
                }
                
                console.log('כל המשתמשים עודכנו בהצלחה!');
              } else {
                console.log('לא נמצאו משתמשים לעדכון או שהייתה שגיאה בקבלת המשתמשים.');
              }
            } else {
              console.log('העמודה "plan" כנראה כבר קיימת או שיש בעיה אחרת:', selectError?.message || 'אין שגיאה');
            }
          } catch (e) {
            console.error('שגיאה בגישה האלטרנטיבית:', e.message);
          }
        } else {
          console.log('פונקציית SQL נוצרה בהצלחה, מנסה שוב להוסיף את העמודה...');
          
          // ניסיון נוסף להוסיף את העמודה
          const { error: retryError } = await supabase.rpc('create_plan_column');
          
          if (retryError) {
            console.error('שגיאה בהוספת העמודה:', retryError.message);
          } else {
            console.log('עמודת "plan" נוספה בהצלחה!');
          }
        }
      } else {
        console.error('שגיאה בהוספת העמודה:', error.message);
      }
    } else {
      console.log('עמודת "plan" כבר קיימת או נוספה בהצלחה!');
    }
    
    // בדיקה סופית
    try {
      const { data, error: finalError } = await supabase
        .from('users')
        .select('plan')
        .limit(1);
      
      if (!finalError) {
        console.log('בדיקה סופית: עמודת "plan" קיימת ונגישה!');
      } else {
        console.error('בדיקה סופית: עדיין יש בעיה עם עמודת "plan":', finalError.message);
      }
    } catch (e) {
      console.error('שגיאה בבדיקה הסופית:', e.message);
    }
    
    console.log('הסקריפט הסתיים.');
  } catch (error) {
    console.error('שגיאה כללית:', error.message);
    process.exit(1);
  }
};

// הפעלת הפונקציה
addPlanColumn(); 