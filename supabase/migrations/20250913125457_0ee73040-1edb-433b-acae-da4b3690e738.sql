-- Enable password strength checking and leaked password protection
UPDATE auth.config SET password_min_length = 8;
UPDATE auth.config SET password_require_lower = true;
UPDATE auth.config SET password_require_upper = true;
UPDATE auth.config SET password_require_numbers = true;
UPDATE auth.config SET password_require_symbols = false;
UPDATE auth.config SET password_breach_protection = true;