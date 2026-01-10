-- =============================================
-- Aufträge-System (Tasks/Geld verdienen)
-- =============================================

-- 1. Tabelle für Auftragsvorlagen
CREATE TABLE public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  compensation DECIMAL(10,2) NOT NULL DEFAULT 0,
  logo_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS für task_templates
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage task_templates" ON public.task_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can view task_templates" ON public.task_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Trigger für updated_at
CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Tabelle für Nutzer-Einschreibungen ins Aufträge-Programm
CREATE TABLE public.user_task_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  enrolled_by UUID REFERENCES public.profiles(id),
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS für user_task_enrollments
ALTER TABLE public.user_task_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage enrollments" ON public.user_task_enrollments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view own enrollment" ON public.user_task_enrollments
  FOR SELECT USING (user_id = auth.uid());

-- 3. Tabelle für zugewiesene Aufträge
CREATE TABLE public.user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
  
  -- Optionale Ident-Felder (vom Admin gesetzt)
  contact_email TEXT,
  contact_phone TEXT,
  ident_code TEXT,
  ident_link TEXT,
  task_password TEXT,
  
  -- Verification Codes (Admin kann mehrfach ändern)
  verification_code TEXT,
  
  -- Status: pending, in_progress, submitted, approved, rejected
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS für user_tasks
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user_tasks" ON public.user_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view own tasks" ON public.user_tasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own tasks" ON public.user_tasks
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger für updated_at
CREATE TRIGGER update_user_tasks_updated_at
  BEFORE UPDATE ON public.user_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Storage Bucket für Auftraggeber-Logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-logos', 'task-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies für task-logos
CREATE POLICY "Anyone can view task logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'task-logos');

CREATE POLICY "Admins can upload task logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'task-logos' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update task logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'task-logos' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete task logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'task-logos' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );