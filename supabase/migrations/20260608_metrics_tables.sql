-- ─── Tabela: login_logs ──────────────────────────────────────────────────────
create table if not exists public.login_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  user_name   text,
  user_email  text,
  user_role   text,
  logged_at   timestamptz default now()
);

alter table public.login_logs enable row level security;

create policy "Service role acesso total login_logs"
  on public.login_logs for all
  using (true)
  with check (true);

create policy "Usuarios inserem seu proprio login"
  on public.login_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Admins leem todos os logins"
  on public.login_logs for select
  to authenticated
  using (true);

-- ─── Tabela: chat_logs ───────────────────────────────────────────────────────
create table if not exists public.chat_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  user_name   text,
  user_role   text,
  message     text not null,
  sent_at     timestamptz default now()
);

alter table public.chat_logs enable row level security;

create policy "Service role acesso total chat_logs"
  on public.chat_logs for all
  using (true)
  with check (true);

create policy "Usuarios inserem suas proprias mensagens"
  on public.chat_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Admins leem todos os chats"
  on public.chat_logs for select
  to authenticated
  using (true);

-- Índices para performance
create index if not exists login_logs_user_id_idx on public.login_logs(user_id);
create index if not exists login_logs_logged_at_idx on public.login_logs(logged_at desc);
create index if not exists chat_logs_user_id_idx on public.chat_logs(user_id);
create index if not exists chat_logs_sent_at_idx on public.chat_logs(sent_at desc);
