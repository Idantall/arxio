# Arxio - מערכת לסריקת אבטחה

Arxio היא מערכת מקיפה לסריקת אבטחה של אפליקציות, API ואתרי אינטרנט. המערכת מאפשרת לארגונים לזהות ולטפל בפרצות אבטחה במהירות וביעילות.

## ארכיטקטורה

המערכת מורכבת מהרכיבים הבאים:

- **Web Application**: ממשק משתמש מבוסס Next.js שמאפשר למשתמשים לנהל פרויקטים, ליצור סריקות חדשות ולצפות בתוצאות.
- **Worker Server**: שרת Python שאחראי על הרצת סריקות אבטחה שונות ועיבוד התוצאות.
- **Redis**: משמש לתקשורת בין שרת ה-web לשרת ה-worker ולניהול תורי עבודה.
- **Postgres/Supabase**: מסד נתונים לאחסון מידע של משתמשים, פרויקטים ותוצאות סריקה.

## סוגי סריקות

המערכת תומכת במספר סוגי סריקות:

1. **SAST (Static Application Security Testing)**: ניתוח קוד מקור לזיהוי בעיות אבטחה.
2. **DAST (Dynamic Application Security Testing)**: בדיקת אבטחה דינמית לאפליקציות ואתרים פעילים.
3. **API Security Testing**: סריקת ממשקי API לזיהוי חולשות ובעיות אבטחה.

## התקנה והרצה

### דרישות מקדימות

- Docker ו-Docker Compose
- Supabase Account

### משתני סביבה

צור קובץ `.env` בתיקיית הפרויקט הראשית עם הפרמטרים הבאים:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### הרצה

כדי להריץ את המערכת המלאה:

```bash
docker-compose up -d
```

הממשק יהיה זמין בכתובת: `http://localhost:3000`

### יצירת משתמש ראשון

אחרי הרצת המערכת, יש ליצור משתמש ראשון באמצעות הסקריפט הבא:

```bash
docker-compose exec web pnpm --filter=web run create-hardcoded-user
```

פרטי התחברות ברירת מחדל:
- אימייל: admin@arxio.io
- סיסמה: Aa123456

## פיתוח

### הרצה בסביבת פיתוח

להרצת המערכת בסביבת פיתוח:

```bash
# התקנת חבילות
pnpm install

# הרצת שרת ה-web
pnpm --filter=web dev

# הרצת שרת ה-worker
cd apps/worker
python worker.py
```

## רישיון

הפרויקט מופץ תחת רישיון MIT. 