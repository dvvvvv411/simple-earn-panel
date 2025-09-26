-- Migrate existing admin_response data to support_ticket_messages table
INSERT INTO support_ticket_messages (ticket_id, user_id, message, is_admin_message, created_at, updated_at)
SELECT 
  id as ticket_id,
  admin_user_id as user_id,
  admin_response as message,
  true as is_admin_message,
  updated_at as created_at,
  updated_at as updated_at
FROM support_tickets 
WHERE admin_response IS NOT NULL 
  AND admin_response != ''
  AND admin_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM support_ticket_messages 
    WHERE ticket_id = support_tickets.id 
    AND is_admin_message = true
  );