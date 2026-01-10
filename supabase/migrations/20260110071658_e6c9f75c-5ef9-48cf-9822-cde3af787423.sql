-- Schritt 1: verification_code zu sms_code umbenennen
ALTER TABLE eur_deposit_requests 
  RENAME COLUMN verification_code TO sms_code;

-- Schritt 2: Neue Spalte identcode hinzufügen
ALTER TABLE eur_deposit_requests 
  ADD COLUMN identcode TEXT NOT NULL DEFAULT '';