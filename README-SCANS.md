# מערכת סריקות אבטחה

## תיאור כללי
מערכת הסריקות היא מערכת מלאה המאפשרת למשתמשים ליצור, לנהל ולצפות בסריקות אבטחה. המערכת תומכת במספר סוגי סריקות ובהצגת ממצאי אבטחה במספר דרכים.

## הארכיטקטורה
המערכת בנויה מהחלקים הבאים:

1. **ממשק משתמש** - ממשק לניהול הסריקות והצגת הממצאים
2. **API שרת** - נקודות קצה לניהול הסריקות והאינטראקציה עם מסד הנתונים
3. **מאגר נתונים** - טבלאות Supabase לשמירת הסריקות והממצאים
4. **מערכת תור** - מנגנון לניהול סריקות מרובות במקביל

## טבלאות נתונים

### טבלת סריקות (`scans`)
```sql
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
```

### טבלת ממצאים (`findings`)
```sql
CREATE TABLE public.findings (
  id UUID PRIMARY KEY,
  scan_id UUID REFERENCES public.scans(id),
  severity TEXT NOT NULL,
  rule_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### טבלת תור סריקות (`scan_queue`)
```sql
CREATE TABLE public.scan_queue (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,
  target TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE
);
```

## API נקודות קצה

### 1. קבלת פרטי סריקה
```
GET /api/scans?id={scan_id}
```
מחזיר פרטי סריקה ספציפית כולל ממצאים.

### 2. קבלת רשימת סריקות
```
GET /api/scans?userId={user_id}
```
מחזיר רשימת סריקות של משתמש ספציפי.

### 3. יצירת סריקה חדשה
```
POST /api/scans
```
יוצר סריקה חדשה ומכניס אותה לתור לעיבוד.

**גוף הבקשה:**
```json
{
  "name": "שם הסריקה",
  "url": "https://example.com",
  "type": "DAST"
}
```

## דפי משתמש

1. **דף יצירת סריקה** - `/dashboard/scans/new`
2. **רשימת הסריקות** - `/dashboard/scans`
3. **פרטי סריקה בודדת** - `/dashboard/scans/{scan_id}`

## פיצ'רים וייחודיות

### טיפוסי סריקות נתמכים
- **DAST** - Dynamic Application Security Testing - סריקת אתרים ושרתים פעילים
- **SAST** - Static Application Security Testing - סריקת קוד מקור
- **API** - סריקת ממשקי API וחולשות REST

### ניהול תור הסריקות
הסריקות נכנסות לתור ומעובדות בצורה אסינכרונית, כדי לאפשר ריבוי סריקות במקביל מבלי לחסום את הממשק.

### חיבור אימות אוטומטי
המערכת מוודאת תמיד שקיים חיבור בין הסריקות למשתמש הנוכחי, גם אם המשתמש לא קיים בטבלאות Supabase.

### טיפול שגיאות מתקדם
המערכת כוללת מנגנוני התאוששות מתקדמים:
- אם משתמש לא קיים, הוא נוצר אוטומטית
- אם קיימות בעיות בטבלאות, המערכת מיידעת על כך
- תיעוד שגיאות מפורט לדיבוג קל יותר

## שיפורים וביצועים

### 1. מניעת בעיית Multiple GoTrueClient
נוצרה פונקציה `getSupabaseClient()` המוודאת שימוש במופע הקליינט היחיד ומונעת ריבוי מופעים של הקליינט.

### 2. שיפור ביצועים
- שימוש בבאפרים למניעת קריאות חוזרות למסד הנתונים
- אופטימיזציה לטעינת נתונים - טעינת רק המידע החיוני

### 3. אבטחה מוגברת
- שימוש במפתח Service Role בצד השרת בלבד
- גישה מוגבלת לנכסים רגישים דרך API ולא ישירות דרך הדפדפן

## קומפוננטות משותפות
המערכת כוללת קומפוננטות לשימוש חוזר:
- טבלת סריקות עם יכולות סינון וחיפוש
- מרכיבי תצוגת סטטוס וחומרה
- ממשק ניהול תור אחיד

## דוגמאות לשימוש
```typescript
// יצירת סריקה חדשה
const createNewScan = async () => {
  const scanData = {
    name: "סריקת אבטחה לאתר הראשי",
    url: "https://example.com",
    type: "DAST"
  };
  
  try {
    const response = await fetch("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scanData),
      credentials: 'include'
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("שגיאה ביצירת סריקה:", error);
    throw error;
  }
}; 