#!/usr/bin/env node
/**
 * Importação controlada do Gelo Tutóia Controle para Supabase.
 * Requer export JSON verificado da Railway (sales e expenses) e service role
 * SOMENTE no ambiente de execução; nunca armazenar tokens no repositório.
 *
 * node migration/supabase/import-ledger.mjs ./backup.json          # valida sem gravar
 * node migration/supabase/import-ledger.mjs ./backup.json --apply  # importa
 *
 * JSON: {"sales":[{"id","sold_at","client","qty","product_type","payment","unit_price","total_value"}],
 *        "expenses":[{"id","spent_at","description","amount"}]}
 */
import { readFileSync } from 'node:fs';
import { argv, env, exit } from 'node:process';

const path = argv[2];
const apply = argv.includes('--apply');
if (!path) { console.error('Informe o caminho do arquivo JSON de backup.'); exit(2); }
let backup;
try { backup = JSON.parse(readFileSync(path, 'utf8')); }
catch (e) { console.error('Backup inválido ou ilegível:', e.message); exit(2); }

if (!Array.isArray(backup.sales) || !Array.isArray(backup.expenses)) {
  console.error('Backup precisa conter sales[] e expenses[].'); exit(2);
}
const ms = x => { const t=Date.parse(x); if(!Number.isFinite(t))throw Error('Data inválida: '+x); return t; };
const unique = (rows, kind) => {
  const ids = new Set();
  for (const x of rows) {
    if (typeof x.id!=='string'||!x.id.trim()) throw Error(kind+': ID ausente');
    if (ids.has(x.id)) throw Error(kind+': ID duplicado '+x.id);
    ids.add(x.id);
  }
};
const numeric=(v,name)=>{const n=Number(v); if(!Number.isFinite(n))throw Error(name+' inválido');return n};
let sales,expenses;
try {
  unique(backup.sales,'sales');unique(backup.expenses,'expenses');
  sales=backup.sales.map(x=>{
    const qty=numeric(x.qty,'qty'),unit=numeric(x.unit_price,'unit_price'),total=numeric(x.total_value,'total_value');
    if(!Number.isInteger(qty)||qty<=0||unit<0||total<0) throw Error('Venda inválida '+x.id);
    if(!['esc','filt'].includes(x.product_type))throw Error('Tipo de gelo inválido: '+x.id);
    return {
      id:x.id,message_id:x.message_id??null,sold_ms:ms(x.sold_at),sold_at:new Date(ms(x.sold_at)).toISOString(),
      client:String(x.client||''),qty,product_type:x.product_type,payment:x.payment,
      unit_price:unit,total_value:total,source:String(x.source||'migration'),
      status:x.status==='deleted'?'deleted':'active',created_ms:Number(x.created_ms)||Date.now(),updated_ms:Number(x.updated_ms)||Date.now()
    };
  });
  expenses=backup.expenses.map(x=>{
    const amount=numeric(x.amount,'amount');
    if(amount<=0||!String(x.description||'').trim())throw Error('Despesa inválida '+x.id);
    return {id:x.id,spent_ms:ms(x.spent_at),spent_at:new Date(ms(x.spent_at)).toISOString(),
      description:x.description,amount,source:String(x.source||'migration'),
      status:x.status==='deleted'?'deleted':'active',created_ms:Number(x.created_ms)||Date.now(),updated_ms:Number(x.updated_ms)||Date.now()};
  });
} catch(e){console.error('Falha de validação:',e.message);exit(2)}
const round=x=>Math.round((x+Number.EPSILON)*100)/100;
const totals=()=>({sales:sales.length,expenses:expenses.length,
  salesGross:round(sales.reduce((v,x)=>v+x.total_value,0)),
  expensesGross:round(expenses.reduce((v,x)=>v+x.amount,0))});
console.log('Validado:', JSON.stringify(totals(),null,2));
if(!apply){console.log('Modo conferência: nenhuma alteração feita. Use --apply após conferir.');exit(0)}
const url=env.SUPABASE_URL?.replace(/\/$/,'');
const key=env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key){console.error('Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');exit(2)}
async function request(table,method='GET',body){
  const response=await fetch(url+'/rest/v1/'+table+(method==='GET'?'?select=id&limit=1':'?on_conflict=id'),{
    method,headers:{apikey:key,Authorization:'Bearer '+key,
      ...(body?{'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'}:{})},
    body:body?JSON.stringify(body):undefined
  });
  if(!response.ok) throw Error(table+' HTTP '+response.status+': '+(await response.text()).slice(0,300));
  return response;
}
try {
  for(const [table,rows] of [['gelo_control_sales',sales],['gelo_control_expenses',expenses]]){
    await request(table);
    for(let i=0;i<rows.length;i+=200)await request(table,'POST',rows.slice(i,i+200));
    console.log(table+': enviados '+rows.length+' registros (duplicados preservados sem sobrescrever)');
  }
  // A conferência final consulta o banco de destino; nenhum corte de serviço é automático.
  async function fetchAll(table){
    const all=[];
    for(let offset=0;;offset+=500){
      const res=await fetch(url+'/rest/v1/'+table+'?select=*&order=id.asc&offset='+offset+'&limit=500',{
        headers:{apikey:key,Authorization:'Bearer '+key}
      });
      if(!res.ok)throw Error('Erro ao conferir '+table+': HTTP '+res.status);
      const page=await res.json();
      all.push(...page);
      if(page.length<500)break;
    }
    return all;
  }
  const [remoteSales,remoteExpenses]=await Promise.all([
    fetchAll('gelo_control_sales'),fetchAll('gelo_control_expenses')
  ]);
  const remoteSalesMap=new Map(remoteSales.map(r=>[r.id,r]));
  const remoteExpensesMap=new Map(remoteExpenses.map(r=>[r.id,r]));
  const problems=[];
  for(const x of sales){
    const y=remoteSalesMap.get(x.id);
    if(!y||String(y.status)!==String(x.status)||Math.abs(Number(y.total_value)-x.total_value)>0.001)problems.push('venda: '+x.id);
  }
  for(const x of expenses){
    const y=remoteExpensesMap.get(x.id);
    if(!y||String(y.status)!==String(x.status)||Math.abs(Number(y.amount)-x.amount)>0.001)problems.push('despesa: '+x.id);
  }
  if(problems.length){console.error('Divergências entre origem e destino:',problems.slice(0,20));exit(1)}
  console.log('CONFERÊNCIA OK: '+sales.length+' vendas e '+expenses.length+' despesas do backup presentes no Supabase.');
  console.log('Observação: novos lançamentos feitos na Railway após o backup precisam de sincronização final antes do corte.');
  console.log('Importação finalizada. NÃO desligue a Railway até a sincronização final e o teste do novo app.');
}catch(e){console.error('Importação interrompida:',e.message);exit(1)}
