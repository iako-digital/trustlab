-- Make an existing Supabase Auth user an admin.
-- 1. Create the user: Authentication -> Users -> "Add user" (email + password, auto-confirm),
--    OR let them click "Sign in with Google" on /admin/login once (they are refused, but the user now exists).
-- 2. Run this in the SQL editor with that user's email and the name that should
--    appear as "Verified by" on published checks.

insert into public.admin_users (user_id, email, display_name)
select id, email, 'Replace With Display Name'
from auth.users
where email = 'admin@example.com';
