-- =====================================================
-- KREDIT-KYC SYSTEM MIGRATION
-- =====================================================

-- 1. Neue Tabelle: credit_requests
CREATE TABLE public.credit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Status & Flow
  -- 'documents_pending' - Nutzer muss Dokumente einreichen
  -- 'documents_submitted' - Dokumente eingereicht, warten auf Prüfung
  -- 'ident_pending' - Identdaten vorhanden, Nutzer muss Verifizierung durchführen
  -- 'ident_submitted' - Nutzer hat Verifizierung bestätigt
  -- 'approved' - Kredit genehmigt
  -- 'rejected' - Abgelehnt
  status TEXT NOT NULL DEFAULT 'documents_pending',
  
  -- Dokumente vom Nutzer (Phase 1)
  bank_statements_paths TEXT[], -- Array für 3 Monate Kontoauszüge
  salary_slips_paths TEXT[], -- Array für 3 Monate Lohnabrechnungen
  health_insurance TEXT, -- Krankenkasse
  tax_number TEXT, -- Steuernummer
  tax_id TEXT, -- Steueridentifikationsnummer
  documents_submitted_at TIMESTAMPTZ,
  
  -- Kredit-Details (vom Admin nach Genehmigung)
  partner_bank TEXT,
  credit_amount DECIMAL(12,2),
  contact_email TEXT,
  contact_phone TEXT,
  identcode TEXT,
  verification_link TEXT,
  sms_code TEXT,
  
  -- Verifizierung
  user_confirmed_at TIMESTAMPTZ,
  
  -- Review
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. RLS aktivieren
ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies für credit_requests
-- Nutzer kann eigene Anfragen lesen
CREATE POLICY "Users can view own credit requests"
  ON public.credit_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Nutzer kann eigene Anfragen aktualisieren (nur bestimmte Felder)
CREATE POLICY "Users can update own credit requests"
  ON public.credit_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins können alles sehen
CREATE POLICY "Admins can view all credit requests"
  ON public.credit_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admins können alles aktualisieren
CREATE POLICY "Admins can update all credit requests"
  ON public.credit_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admins können neue Anfragen erstellen
CREATE POLICY "Admins can insert credit requests"
  ON public.credit_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- 4. Indexes für Performance
CREATE INDEX idx_credit_requests_user_id ON public.credit_requests(user_id);
CREATE INDEX idx_credit_requests_status ON public.credit_requests(status);

-- 5. Trigger für updated_at
CREATE TRIGGER update_credit_requests_updated_at
  BEFORE UPDATE ON public.credit_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Storage Bucket für Kredit-Dokumente erstellen
INSERT INTO storage.buckets (id, name, public)
VALUES ('credit-documents', 'credit-documents', false);

-- 7. Storage RLS Policies
-- Nutzer kann eigene Dokumente hochladen
CREATE POLICY "Users can upload credit documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'credit-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Nutzer kann eigene Dokumente ansehen
CREATE POLICY "Users can view own credit documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'credit-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins können alle Dokumente sehen
CREATE POLICY "Admins can view all credit documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'credit-documents' AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- 8. Telegram Config erweitern für Kredit-Benachrichtigungen
ALTER TABLE public.telegram_config
ADD COLUMN IF NOT EXISTS notify_credit_documents_submitted BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_credit_ident_submitted BOOLEAN DEFAULT TRUE;