-- Tabelle für Admin-Notizen zu Benutzern
CREATE TABLE user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- Nur Admins können Notizen sehen
CREATE POLICY "Admins can view all notes"
  ON user_notes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Nur Admins können Notizen erstellen
CREATE POLICY "Admins can create notes"
  ON user_notes FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Nur Admins können Notizen löschen
CREATE POLICY "Admins can delete notes"
  ON user_notes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes für Performance
CREATE INDEX idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX idx_user_notes_created_at ON user_notes(created_at DESC);