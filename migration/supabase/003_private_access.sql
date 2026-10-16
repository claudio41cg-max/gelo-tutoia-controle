-- Gelo Tutóia: acesso privado via Supabase Auth.
-- Nenhum usuário ganha acesso só por criar conta. Vinculação manual do proprietário.
create table if not exists public.gelo_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.gelo_owners enable row level security;
revoke all on public.gelo_owners from anon, authenticated;
grant select on public.gelo_owners to authenticated;
create policy "owner_self_read" on public.gelo_owners
for select to authenticated using (user_id = (select auth.uid()));
grant select, insert, update, delete on public.gelo_control_sales to authenticated;
grant select, insert, update, delete on public.gelo_control_expenses to authenticated;
create policy "gelo_owner_select_sales" on public.gelo_control_sales
for select to authenticated using (exists(select 1 from public.gelo_owners where user_id=(select auth.uid())));
create policy "gelo_owner_insert_sales" on public.gelo_control_sales
for insert to authenticated with check (exists(select 1 from public.gelo_owners where user_id=(select auth.uid())));
create policy "gelo_owner_update_sales" on public.gelo_control_sales
for update to authenticated using (exists(select 1 from public.gelo_owners where user_id=(select auth.uid())))
with check (exists(select 1 from public.gelo_owners where user_id=(select auth.uid())));
create policy "gelo_owner_delete_sales" on public.gelo_control_sales
for delete to authenticated using (exists(select 1 from public.gelo_owners where user_id=(select auth.uid())));
create policy "gelo_owner_select_expenses" on public.gelo_control_expenses
for select to authenticated using (exists(select 1 from public.gelo_owners where user_id=(select auth.uid())));
create policy "gelo_owner_insert_expenses" on public.gelo_control_expenses
for insert to authenticated with check (exists(select 1 from public.gelo_owners where user_id=(select auth.uid())));
create policy "gelo_owner_update_expenses" on public.gelo_control_expenses
for update to authenticated using (exists(select 1 from public.gelo_owners where user_id=(select auth.uid())))
with check (exists(select 1 from public.gelo_owners where user_id=(select auth.uid())));
create policy "gelo_owner_delete_expenses" on public.gelo_control_expenses
for delete to authenticated using (exists(select 1 from public.gelo_owners where user_id=(select auth.uid())));
