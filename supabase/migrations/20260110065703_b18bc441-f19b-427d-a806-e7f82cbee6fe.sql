-- Allow verification_code to be NULL so it can be sent later by admin
ALTER TABLE eur_deposit_requests 
  ALTER COLUMN verification_code DROP NOT NULL;