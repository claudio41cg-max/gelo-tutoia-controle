-- Conferência da migração Gelo Tutóia Controle
-- Somente leitura: executar no projeto Supabase gelo-tutoia-controle
select 'sales' as tabela, status, count(*) as registros,
       coalesce(sum(total_value),0) as valor_total
from public.gelo_control_sales group by status
union all
select 'expenses',status,count(*),coalesce(sum(amount),0)
from public.gelo_control_expenses group by status
order by tabela,status;

-- Totais de registros ativos por dia para comparar ao Caderno de vendas.
select (sold_at at time zone 'America/Sao_Paulo')::date as dia,
       count(*) as vendas, sum(qty) as sacos,
       sum(total_value) as bruto
from public.gelo_control_sales
where status='active'
group by 1 order by 1 desc;

select (spent_at at time zone 'America/Sao_Paulo')::date as dia,
       count(*) as despesas, sum(amount) as saidas
from public.gelo_control_expenses
where status='active'
group by 1 order by 1 desc;
