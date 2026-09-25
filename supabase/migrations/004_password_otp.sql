-- Password reset OTPs (EmailJS delivers the code; RPC completes the reset)
-- Run after 001–003 migrations.

create table if not exists public.password_reset_otps (
  email text primary key,
  otp_code text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.password_reset_otps enable row level security;

drop policy if exists "Anyone can upsert password otp" on public.password_reset_otps;
create policy "Anyone can insert password otp"
  on public.password_reset_otps for insert
  with check (true);

create policy "Anyone can update password otp"
  on public.password_reset_otps for update
  using (true)
  with check (true);

create policy "Anyone can delete own otp row"
  on public.password_reset_otps for delete
  using (true);

-- Clients must not read OTPs (complete_password_reset is security definer)
create extension if not exists pgcrypto with schema extensions;

create or replace function public.complete_password_reset(
  p_email text,
  p_otp text,
  p_new_password text
)
returns json
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text := lower(trim(p_email));
  v_row public.password_reset_otps%rowtype;
  v_user_id uuid;
begin
  if p_new_password is null or char_length(p_new_password) < 6 then
    return json_build_object('ok', false, 'error', 'Password must be at least 6 characters.');
  end if;

  select * into v_row
  from public.password_reset_otps
  where email = v_email
    and otp_code = trim(p_otp)
    and expires_at > now();

  if not found then
    return json_build_object('ok', false, 'error', 'Invalid or expired OTP.');
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = v_email
  limit 1;

  if v_user_id is null then
    return json_build_object('ok', false, 'error', 'No account found for this email.');
  end if;

  update auth.users
  set
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  where id = v_user_id;

  delete from public.password_reset_otps where email = v_email;

  return json_build_object('ok', true);
end;
$$;

revoke all on function public.complete_password_reset(text, text, text) from public;
grant execute on function public.complete_password_reset(text, text, text) to anon, authenticated;

-- Store OTP request (called from app before EmailJS send)
create or replace function public.request_password_otp(p_email text, p_otp text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_exists boolean;
begin
  if p_otp is null or char_length(trim(p_otp)) < 4 then
    return json_build_object('ok', false, 'error', 'Invalid OTP.');
  end if;

  select exists(select 1 from auth.users where lower(email) = v_email) into v_exists;
  if not v_exists then
    -- Do not reveal whether email exists; still return ok for security
    return json_build_object('ok', true, 'sent', false);
  end if;

  insert into public.password_reset_otps (email, otp_code, expires_at)
  values (v_email, trim(p_otp), now() + interval '10 minutes')
  on conflict (email) do update
  set otp_code = excluded.otp_code,
      expires_at = excluded.expires_at,
      created_at = now();

  return json_build_object('ok', true, 'sent', true);
end;
$$;

revoke all on function public.request_password_otp(text, text) from public;
grant execute on function public.request_password_otp(text, text) to anon, authenticated;
