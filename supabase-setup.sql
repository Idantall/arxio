-- הגדרת הרחבות נדרשות
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- יצירת טבלת פרויקטים
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  repository_type TEXT,
  repository_url TEXT,
  repository_provider TEXT,
  branch TEXT DEFAULT 'main',
  deployment_url TEXT,
  local_path TEXT,
  target TEXT,
  status TEXT DEFAULT 'active',
  security_status TEXT DEFAULT 'medium',
  scan_interval TEXT DEFAULT 'weekly',
  auto_scan BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- יצירת טבלת סריקות
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID,
  name TEXT,
  scan_type TEXT NOT NULL,
  target TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  user_id UUID,
  message TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  results JSONB DEFAULT '{}'::jsonb,
  findings_count JSONB DEFAULT '{"critical":0,"high":0,"medium":0,"low":0,"info":0}'::jsonb,
  parameters JSONB DEFAULT '{}'::jsonb,
  progress INTEGER DEFAULT 0
);

-- יצירת טבלת ממצאים
CREATE TABLE IF NOT EXISTS public.findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID,
  rule_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL, 
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- יצירת טבלת תור סריקות
CREATE TABLE IF NOT EXISTS public.scan_queue (
  id UUID PRIMARY KEY,
  scan_type TEXT NOT NULL,
  target TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE
);

-- הגדרת Row-Level Security (RLS) על הטבלאות
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_queue ENABLE ROW LEVEL SECURITY;

-- יצירת מדיניות הרשאות לטבלת פרויקטים
CREATE POLICY "Allow users to view their own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create their own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

-- יצירת מדיניות הרשאות לטבלת סריקות
CREATE POLICY "Allow users to view their own scans" ON public.scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create their own scans" ON public.scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own scans" ON public.scans
  FOR UPDATE USING (auth.uid() = user_id);

-- יצירת מדיניות הרשאות לטבלת ממצאים (דרך הקשר לסריקה)
CREATE POLICY "Allow users to view findings from their scans" ON public.findings
  FOR SELECT USING (
    scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid())
  );

-- יצירת אינדקסים לשיפור ביצועים
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS scans_project_id_idx ON public.scans(project_id);
CREATE INDEX IF NOT EXISTS scans_user_id_idx ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS findings_scan_id_idx ON public.findings(scan_id);
CREATE INDEX IF NOT EXISTS findings_severity_idx ON public.findings(severity);

-- יצירת פונקצית טריגר לעדכון שדה updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- יצירת טריגר לטבלת פרויקטים
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- הגדרת קשרים זרים
ALTER TABLE public.scans 
  ADD CONSTRAINT fk_scans_project 
  FOREIGN KEY (project_id) 
  REFERENCES public.projects(id) 
  ON DELETE CASCADE;

ALTER TABLE public.findings 
  ADD CONSTRAINT fk_findings_scan 
  FOREIGN KEY (scan_id) 
  REFERENCES public.scans(id) 
  ON DELETE CASCADE; 