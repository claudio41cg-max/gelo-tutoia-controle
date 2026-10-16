#!/usr/bin/env node
// Converte uma cópia do SQLite da Railway para JSON verificável (sem alterar o SQLite).
// Uso: node migration/supabase/sqlite-to-json.mjs ./sales.sqlite ./backup-gelo.json
import {DatabaseSync} from 'node:sqlite';
import {writeFileSync,existsSync} from 'node:fs';
import {argv,exit} from 'node:process';
const [src,out]=argv.slice(2);
if(!src||!out||!existsSync(src)){console.error('Uso: node migration/supabase/sqlite-to-json.mjs sales.sqlite backup.json');exit(2)}
let db;
try{
 db=new DatabaseSync(src,{readOnly:true});
 const required=['control_sales','control_expenses'];
 const tables=new Set(db.prepare("select name from sqlite_master where type='table'").all().map(r=>r.name));
 for(const t of required)if(!tables.has(t))throw Error('Tabela ausente: '+t);
 // Inclui registros active e deleted, preservando colunas e IDs originais.
 const sales=db.prepare("select * from control_sales order by sold_ms,id").all();
 const expenses=db.prepare("select * from control_expenses order by spent_ms,id").all();
 const data={schema_version:1,exported_at:new Date().toISOString(),source:'railway-sqlite-readonly',counts:{sales:sales.length,expenses:expenses.length},sales,expenses};
 writeFileSync(out,JSON.stringify(data,null,2),{flag:'wx',mode:0o600});
 const sum=(rows,k)=>Math.round(rows.reduce((v,x)=>v+Number(x[k]||0),0)*100)/100;
 console.log(JSON.stringify({sales:sales.length,expenses:expenses.length,salesTotal:sum(sales.filter(x=>x.status==='active'),'total_value'),expensesTotal:sum(expenses.filter(x=>x.status==='active'),'amount'),output:out},null,2));
 console.log('Dados privados: não envie este JSON ao GitHub público.');
} catch(e){console.error('Conversão não concluída:',e.message);exit(1)}
finally{db?.close()}
