-- Preparação para migrar Gelo Tutóia Controle do SQLite para Supabase.
-- Executar SOMENTE no projeto Supabase dedicado ao Gelo Tutóia.
-- Dados existentes NÃO são importados por esta migração.
-- Acesso direto público bloqueado por RLS; usar backend seguro autenticado.

create table if not exists public.gelo_control_sales (
  id text primary key,
  message_id text,
  sold_ms bigint not null,
  sold_at timestamptz not null,
  client text not null,
  qty integer not null check (qty > 0),
  product_type text not null check (product_type in ('esc','filt')),
  payment text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total_value numeric(12,2) not null check (total_value >= 0),
  source text not null default 'manual',
  status text not null default 'active' check (status in ('active','deleted')),
  created_ms bigint not null,
  updated_ms bigint not null
);
create index if not exists gelo_sales_status_sold_idx
  on public.gelo_control_sales (status,sold_ms);

create table if not exists public.gelo_control_expenses (
  id text primary key,
  spent_ms bigint not null,
  spent_at timestamptz not null,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  source text not null default 'manual',
  status text not null default 'active' check (status in ('active','deleted')),
  created_ms bigint not null,
  updated_ms bigint not null
);
create index if not exists gelo_expenses_status_spent_idx
  on public.gelo_control_expenses (status,spent_ms);

alter table public.gelo_control_sales enable row level security;
alter table public.gelo_control_expenses enable row level security;

-- Sem policies públicas: nenhum usuário anônimo tem acesso direto.
-- Acesso pelo serviço seguro apenas com autorização no servidor.
