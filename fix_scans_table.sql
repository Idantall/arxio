-- SQL לעדכון טבלת הסריקות

-- שלב 1: הסרת ערך ברירת המחדל
ALTER TABLE public.scans 
  ALTER COLUMN findings_count DROP DEFAULT;

-- שלב 2: עדכון הטיפוס מ-INTEGER ל-JSONB
ALTER TABLE public.scans 
  ALTER COLUMN findings_count TYPE JSONB USING jsonb_build_object('medium', COALESCE(findings_count, 0));

-- שלב 3: הגדרת ערך ברירת מחדל חדש מתאים ל-JSONB
ALTER TABLE public.scans 
  ALTER COLUMN findings_count SET DEFAULT '{"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}'::jsonb;

-- הוספת הערה (COMMENT) על השדה
COMMENT ON COLUMN public.scans.findings_count IS 'מספר ממצאים לפי רמת חומרה כ-JSONB { critical, high, medium, low, info }';

-- עדכון רשומות קיימות ששדה findings_count שלהן הוא NULL
UPDATE public.scans
SET findings_count = '{"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}'::jsonb
WHERE findings_count IS NULL; 