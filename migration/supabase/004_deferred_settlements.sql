create table if not exists public.gelo_deferred_settlements (
 sale_id text primary key references public.gelo_control_sales(id) on delete cascade,
 settled_at timestamptz not null default now(),
 settled_by uuid not null references auth.users(id)
);
alter table public.gelo_deferred_settlements enable row level security;
grant select,insert,delete on public.gelo_deferred_settlements to authenticated;
create policy "owner_view_deferred_settlements" on public.gelo_deferred_settlements for select to authenticated using (exists(select 1 from public.gelo_owners where user_id=(select auth.uid())));
create policy "owner_settle_deferred" on public.gelo_deferred_settlements for insert to authenticated with check (settled_by=(select auth.uid()) and exists(select 1 from public.gelo_owners where user_id=(select auth.uid())) and exists(select 1 from public.gelo_control_sales s where s.id=sale_id and lower(s.payment) in ('fiado','pagar depois','pix pagar depois','dinheiro pagar depois')));
create policy "owner_unsettle_deferred" on public.gelo_deferred_settlements for delete to authenticated using (exists(select 1 from public.gelo_owners where user_id=(select auth.uid())));
