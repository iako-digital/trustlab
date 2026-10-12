-- Make an existing Supabase Auth user an admin.
-- 1. Supabase dashboard -> Authentication -> Users -> "Add user" (email + password, auto-confirm).
-- 2. Run this in the SQL editor with that user's email and the name that should
--    appear as "Verified by" on published checks.

insert into public.admin_users (user_id, email, display_name)
select id, email, 'Replace With Display Name'
from auth.users
where email = 'admin@example.com';
