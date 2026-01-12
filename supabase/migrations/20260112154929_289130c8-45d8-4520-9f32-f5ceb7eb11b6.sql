-- Delete all related data for user admin2@admin.de (430b7501-f865-4f87-a2cf-f23a78b4bc51)

-- First clear all foreign key references where this user is referenced as reviewer/admin
UPDATE eur_deposit_requests SET reviewed_by = NULL WHERE reviewed_by = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
UPDATE credit_requests SET reviewed_by = NULL WHERE reviewed_by = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
UPDATE kyc_submissions SET reviewed_by = NULL WHERE reviewed_by = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
UPDATE user_tasks SET reviewed_by = NULL WHERE reviewed_by = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
UPDATE bank_deposit_requests SET completed_by = NULL WHERE completed_by = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
UPDATE withdrawal_requests SET processed_by = NULL WHERE processed_by = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
UPDATE user_task_enrollments SET enrolled_by = NULL WHERE enrolled_by = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
UPDATE user_transactions SET created_by = NULL WHERE created_by = '430b7501-f865-4f87-a2cf-f23a78b4bc51';

-- Delete from tables where user is the owner
DELETE FROM user_notes WHERE admin_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
DELETE FROM user_notes WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
DELETE FROM eur_deposit_requests WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
DELETE FROM credit_requests WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
DELETE FROM bank_deposit_requests WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
DELETE FROM withdrawal_requests WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
DELETE FROM crypto_deposits WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
DELETE FROM kyc_submissions WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
DELETE FROM support_ticket_messages WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
DELETE FROM support_tickets WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
DELETE FROM user_login_tracking WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
DELETE FROM user_activity_sessions WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
DELETE FROM streak_bot_rewards WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
DELETE FROM notifications WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';

-- Delete referrals
DELETE FROM referral_rewards WHERE referrer_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51' OR referred_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
DELETE FROM user_referrals WHERE referrer_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51' OR referred_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';

-- Delete task enrollments and tasks
DELETE FROM user_task_enrollments WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';
DELETE FROM user_tasks WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';

-- Delete bot_trades first (foreign key to trading_bots)
DELETE FROM bot_trades WHERE bot_id IN (
  SELECT id FROM trading_bots WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51'
);

-- Delete trading_bots
DELETE FROM trading_bots WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';

-- Delete user_transactions
DELETE FROM user_transactions WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';

-- Delete user_roles
DELETE FROM user_roles WHERE user_id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';

-- Finally delete profile
DELETE FROM profiles WHERE id = '430b7501-f865-4f87-a2cf-f23a78b4bc51';