## Estado verificado em 15/10/2026
- Cópia consolidada do SQLite passou em PRAGMA integrity_check.
- Importação no Supabase eebkuiivyolszarnpjkx concluída: 240 vendas ativas (R$ 6.529,00) e 50 despesas ativas (R$ 2.567,00).
- IDs distintos confirmados: 240 vendas e 50 despesas; datas de 01/10/2026 a 15/10/2026.
- Dados foram importados por conexão administrativa segura; arquivo SQL privado NÃO está no GitHub.
- ATENÇÃO: a origem Railway segue em uso. É necessário sincronizar lançamentos posteriores ao snapshot antes de redirecionar o aplicativo.
- Falta implementar autenticação, API de leitura/escrita e hospedagem antes da troca. NÃO desligar a Railway.

# Procedimento de migração controlada — Gelo Tutóia Controle

## Estado inicial
- O projeto Supabase `gelo-tutoia-controle` foi criado com tabelas `gelo_control_sales` e `gelo_control_expenses` e RLS ativa sem acesso anônimo.
- A Railway mantém em execução `painel-clientes` (SQLite no volume) e `gelo-tutoia-controle` (interface e proxy).
- A versão de produção da Railway ainda é anterior à rota protegida `/api/control-bridge/export`.
- O acesso conectado à Railway omite os valores dos tokens. Não colocar senhas, tokens ou exportações contendo vendas no GitHub.

## Etapas obrigatórias
1. Disponibilizar uma exportação autenticada **de toda a tabela** (ativos e excluídos) diretamente do servidor de origem. Não confiar em registros de exemplo nem em captura de tela.
2. Guardar backup bruto em local privado antes de qualquer alteração. Calcular quantidade de linhas, totais por status e somatórios por data.
3. Executar `node migration/supabase/import-ledger.mjs backup.json` (modo validação). Corrigir quaisquer erros antes de importar.
4. Executar importação com `--apply` em ambiente que tenha `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` apenas como variáveis privadas. Nunca revelar a chave no navegador ou no repositório.
5. Rodar as consultas de `002_verify_ledger.sql`, comparar registros ativos e excluídos por ID, data e valor.
6. Como novas vendas podem ter entrado na Railway durante a transferência, fazer **segunda exportação e sincronização de delta** antes da mudança definitiva.
7. Só depois desenvolver e testar a interface hospedada em outro provedor e a escrita autenticada no Supabase, inclusive gravação/exclusão de vendas e despesas.
8. Após confirmar funcionamento e backup em outro local, decidir separadamente sobre desligar o serviço antigo.

## Regras de segurança
- Não desligar nem reiniciar o banco SQLite da Railway sem backup confirmado.
- Não publicar token de serviço Supabase em HTML/JavaScript do cliente.
- Não substituir o histórico por vendas lembradas ou importadas de conversas anteriores.
- Não confundir GitHub (código) com banco online e hospedagem.
- Não migrar o Turbo Agent nesta operação.
