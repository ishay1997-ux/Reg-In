-- reset must be authenticated-only: revoke the direct anon grant that Supabase default
-- privileges add (auth.email() is NULL for anon so it was already a no-op, but least-privilege).
revoke execute on function reset_login_attempts() from anon;
