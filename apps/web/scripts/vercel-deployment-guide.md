# מדריך פריסה ל-Vercel עבור Arxio

מסמך זה מכיל הוראות מפורטות להגדרת סביבת הייצור ב-Vercel על מנת שתהליכי ההתחברות והרישום יפעלו כראוי.

## 1. הגדרת משתני הסביבה ב-Vercel

גש ללוח הבקרה של Vercel בכתובת https://vercel.com ובחר את הפרויקט שלך (arxio-web).

עבור אל הגדרות הפרויקט (Settings) ולאחר מכן ל-Environment Variables.

וודא שהמשתנים הבאים מוגדרים בסביבת הייצור:

```
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompanysupabase.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_KEY=eyJh...
NEXTAUTH_SECRET=ערך_מחרוזת_אקראי_וארוך
NEXTAUTH_URL=https://arxio-web.vercel.app
```

**שים לב:** עבור `NEXTAUTH_URL` חשוב להשתמש בכתובת ה-URL המלאה של האתר שלך ב-Vercel, כולל פרוטוקול HTTPS.

## 2. פריסה מחדש לאחר עדכון ההגדרות

לאחר עדכון משתני הסביבה, לחץ על כפתור "Redeploy" בלוח הבקרה של Vercel כדי להחיל את השינויים.

## 3. בדיקת המערכת

לאחר הפריסה המחודשת, בצע את הבדיקות הבאות:

1. נסה להתחבר עם המשתמש שיצרנו קודם בסופאבייס (אם קיים).
2. אם ההתחברות נכשלת, בדוק את הלוגים ב-Vercel דרך לוח הבקרה.
3. נסה להירשם עם משתמש חדש ולאחר מכן להתחבר עם אותו משתמש.

## 4. פתרון בעיות נפוצות

### בעיה: שגיאת 401 Unauthorized בעת ניסיון התחברות

פתרון אפשרי:
- וודא שמפתחות ה-API של Supabase נכונים ומעודכנים.
- בדוק שיש לך משתמש תקף בטבלת המשתמשים בסופאבייס.

### בעיה: בעיות CORS בסביבת הייצור

פתרון אפשרי:
- וודא שה-`NEXTAUTH_URL` מוגדר נכון ומצביע על הדומיין הנכון.
- בדוק את הגדרות ה-CORS בפרויקט הסופאבייס שלך.

### בעיה: רישום משתמשים נכשל

פתרון אפשרי:
- בדוק אם יש שגיאות בלוגים ב-Vercel.
- וודא שטבלת המשתמשים בסופאבייס מוגדרת כראוי.
- ודא שמפתח השירות של Supabase הוא נכון ויש לו הרשאות מלאות.

## 5. בדיקת הקישוריות של Supabase

על מנת לבדוק אם הקישוריות לסופאבייס תקינה, באפשרותך להוסיף נקודת קצה API פשוטה לבדיקה:

1. צור קובץ `apps/web/app/api/supabase-test/route.ts` עם התוכן הבא:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase.from('users').select('email').limit(1);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully connected to Supabase',
      userCount: data ? data.length : 0
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to connect to Supabase', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
```

2. לאחר פריסה מחודשת, גש לכתובת `https://arxio-web.vercel.app/api/supabase-test` לבדיקת הקישוריות.

## 6. יצירת משתמש ישירות בסופאבייס

אם אתה עדיין נתקל בבעיות עם מערכת ההרשמה, ניתן ליצור משתמש ישירות דרך ממשק הניהול של Supabase:

1. היכנס לפרויקט Supabase שלך.
2. נווט ל-"Authentication" > "Users".
3. לחץ על "Add User" והזן את פרטי המשתמש הרצויים.
4. ודא שהמשתמש מופיע גם בטבלת המשתמשים במסד הנתונים.

## 7. מידע נוסף

אם עדיין יש בעיות לאחר יישום השלבים הללו, בדוק את הקוד הבא:

1. `apps/web/lib/auth.ts` - קובץ ההגדרות של NextAuth
2. `apps/web/lib/supabase.ts` - ההגדרות של הקישור לסופאבייס
3. `apps/web/app/api/auth/register/route.ts` - הלוגיקה של הרישום

בהצלחה! 