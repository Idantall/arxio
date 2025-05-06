-- הוספת מדיניות הרשאות INSERT עבור טבלת findings
CREATE POLICY "Allow users to insert findings to their scans" ON public.findings
  FOR INSERT WITH CHECK (
    scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid())
  );

-- לחילופין, אם רוצים הרשאות יותר גמישות, אפשר לבטל את RLS לגמרי
-- ALTER TABLE public.findings DISABLE ROW LEVEL SECURITY; 