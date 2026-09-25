-- Single active session per account (kick previous device on new login)
-- Run in Supabase SQL Editor after 001 + 002.

alter table public.profiles
  add column if not exists active_session_id text;

-- Realtime so other tabs/devices drop when session is claimed elsewhere
do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
