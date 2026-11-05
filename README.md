# Gelo Tutóia Controle — manual de continuidade para ChatGPT e equipe

**Atualizado em 05/11/2026.** Este documento existe para que outra conversa, outro GPT ou um desenvolvedor consiga continuar a operação sem perder contexto. **Não executar alterações no aplicativo, banco ou histórico apenas por ler este arquivo.** Primeiro conferir o estado atual e obter autorização do responsável.

## Comece por aqui: procedimento rápido

1. Pergunte/identifique a **data de trabalho** no fuso `America/Sao_Paulo`.
2. Receba a relação de vendas em linguagem natural, inclusive por voz, e despesas; normalize **cliente, tipo de gelo, quantidade, preço unitário, forma de pagamento e data**.
3. **USE OS PREÇOS FIXOS JÁ DEFINIDOS PELO RESPONSÁVEL PARA CADA CLIENTE.** Eles permanecem em vigor até o responsável solicitar expressamente uma alteração. Não reajuste, não escolha preço por frequência de vendas e não use um valor isolado do histórico para substituir a regra vigente. Quando o usuário mencionar um valor na venda, utilize-o para conferir a conta; se ele divergir do preço fixo, confirme se é exceção somente daquela venda ou mudança permanente **antes** de alterar a referência de preço. Uma anotação diária não é ordem automática de atualizar a tabela.
4. “**Pagou**” significa **Dinheiro**, salvo cliente com regra explícita de PIX; “**PIX**” é PIX; “**pagar depois**” é **Fiado**, independentemente do meio habitual de quitação.
5. Mostre resumo com quantidades, dinheiro, PIX, fiado, bruto, despesas, líquido; quando faltar um preço não comprovado, pergunte ou sinalize antes de lançar.
6. **Só grave quando o usuário autorizar**. Consulte antes vendas e despesas da data para evitar duplicações. Separe produtos diferentes em linhas diferentes e use identificadores únicos e estáveis.
7. Depois de gravar, **reconsulte o Supabase** e confira registros, quantidades, valores e pagamentos; só então diga “enviado”. Preserve todos os dias anteriores.
8. Mantenha o usuário informado de pendências e envie o link do aplicativo ao fechar.

## Links e arquitetura verificada

- Aplicativo PWA: https://claudio41cg-max.github.io/gelo-tutoia-controle/
- Repositório: https://github.com/claudio41cg-max/gelo-tutoia-controle
- Supabase: projeto **gelo-tutoia-controle**, referência **eebkuiivyolszarnpjkx**, região São Paulo (`sa-east-1`). Nunca divulgar senhas, tokens ou chaves privadas.
- Arquivos inspecionados em 05/11/2026: `package.json`, `server.js`, `public/index.html`, `public/sw.js`. `server.js` usa Express e disponibiliza `/health`, arquivos em `public/` e proxy **`/api/controle/*` → `GELO_BACKEND_URL/api/control-bridge/*`** com cabeçalho `x-control-token` definido **somente por ambiente** (`GELO_CONTROL_TOKEN`). O proxy requer as duas variáveis, ou retorna 503. Nunca copiar o token para o GitHub.
- No frontend, `loadAll()` consulta `GET /api/controle/sales` e `GET /api/controle/expenses`. `saveSale()` usa `POST /api/controle/sales`; `saveExpense()` usa a API de despesas. A existência do proxy no código **não prova que uma implantação pública específica tenha o backend configurado**; testar cada ambiente.
- PWA: `public/sw.js` guarda arquivos básicos em cache. Se a interface parecer desatualizada, atualizar/confirmar se carregou a versão atual antes de culpar o banco. **Jamais interpretar cache como confirmação de gravação**.

## Telas e operação

- **Vendas do dia**: seletor de data; resumo **bruto, dinheiro, PIX, saídas, líquido, escamas, filtrados**; lista expansível de vendas, inclusão manual, consulta de detalhes, exclusão individual.
- **Caderno de vendas**: visão por **dia, semana e mês**, clientes e histórico por cliente, totais por modalidade, sacos, valores, despesas e líquido.
- **Saídas**: registro de despesas e visão de pagamentos dos ajudantes. Há classificação entre **Despesas da Loja** e **Minhas Despesas**; verificar como cada lançamento é classificado antes de usar números separados de caixa/loja.
- O usuário quer que **“Reiniciar tudo” apague somente a tela/vendas atuais do dia, sem perder caderno ou históricos**. Antes de implementar/usar ação de reinício, confirmar a semântica real no código atual. Nunca executar DELETE no banco para simular “limpar a tela”.
- A ordem dos clientes na rota e apelidos estão codificados em `public/index.html` nas estruturas `ROUTE_CLIENT_ORDER`, `CLIENT_ALIASES` e `canonicalClient()`. **Atenção:** existem apelidos que unificam nomes no caderno, enquanto vendas antigas preservam os nomes gravados; ao reconciliar/evitar duplicatas, considerar apelidos sem alterar registros anteriores automaticamente.

## Política obrigatória de preços fixos

**Ordem expressa do proprietário em 05/11/2026:** todos os preços por cliente definidos anteriormente continuam **fixos e inalterados até que ele peça para mudar**. O GPT que assumir a operação deve aplicar esses valores automaticamente, sem perguntar de novo pelos preços já confirmados, e jamais reajustar valores por conta própria. O histórico do Supabase é fonte de conferência e identificação, mas **não substitui uma lista de preços explicitamente programada**. Antes de presumir que um preço histórico equivale a cadastro vigente, verificar o código/configuração e a tabela de referência abaixo. Se algum cliente não tiver preço programado comprovável, não inventar: conferir com o responsável sem mexer na tabela dos demais.

**Hierarquia:** (1) alteração permanente explicitamente ordenada pelo proprietário; (2) preço fixo já programado e confirmado para o cliente; (3) exceção expressa para uma venda específica, sem alterar o valor fixo; (4) histórico recente apenas para descobrir um preço ainda não documentado, sujeito a confirmação. **Exemplo:** se a venda vier com preço discrepante, não transformar essa discrepância em nova regra do cliente sem autorização. Nunca modificar preços históricos retroativamente.

## Produtos e preços — regras e exceções

| Gelo / caso | Preço por saco | Evidência e cuidado |
|---|---:|---|
| Filtrado de 10 kg | R$ 13 | Regra habitual, salvo exceções confirmadas |
| Escama de 20 kg para peixaria em geral | R$ 7 | Regra comercial informada pelo usuário |
| Escama para Pará | R$ 6 | Exceção expressa; registros históricos confirmam |
| Escama para Tiago/Thiago | R$ 6 | Exceção expressa; registros históricos confirmam |
| Escama Padaria BMG | R$ 8 | Confirmado pelo usuário e histórico |
| Escama Seu Luiz | R$ 8 | Confirmado pelo histórico recente; em 05/11 fiado |
| Escama Caldo da Praça | R$ 8 | Confirmado pelo usuário e venda 05/11 |
| Escama The Best / Debest | R$ 8 | Confirmado pelo usuário e venda 05/11; **existem registros antigos a R$ 7** |
| Escama Capoeira | R$ 8 | Registros recentes e venda 05/11 |
| Escama Chatuba | R$ 8 | Histórico recente |
| Escama Márcio, Ivan, Alex Laranja, Padaria Paciência, Lilian, Custódio, Filomena | R$ 7 | Histórico recente; confirmar se surgir alteração |

**Não atribuir automaticamente R$ 8 a todos os clientes fora de peixarias.** Há registros antigos com valores diferentes, promoções e exceções. O preço fixo confirmado de cada cliente continua valendo; valor excepcional ditado na venda aplica-se àquela operação sem modificar a tabela permanente. Exemplo: há registros históricos de filtrado a R$ 5/R$ 10 para outros produtos/volumes; não substituem a regra do filtrado de 10 kg. Não inferir sacos de 5 kg quando o usuário se refere ao filtrado padrão.

### Clientes, aliases e formas de pagamento

- `Pará` / `Peixaria Pará`, `Tiago` / `Thiago` / `Peixaria Tiago`: R$ 6 por escama; normalmente pagam via **PIX quando quitam**.
- `Padaria Paciência`, `Alex Perninha`, `Seu Gilson` / `Sr. Gilson`, `Custódio`: normalmente **PIX quando pagam**, mas registrar **Fiado** se foi dito “pagar depois”.
- `Márcio`, `Alex Laranja` / `Laranja`, `Lilian`, `Juliana`: normalmente **Dinheiro** quando pago, salvo fala explícita de PIX/fiado.
- `Marcelo` e `Marcelo Cosmos` são clientes distinguíveis; ambos compram habitualmente filtrado de R$ 13. Não fundir sem confirmação.
- `Caldo da Praça` / `Caldo de Cana da Praça` e `The Best` / `Debest` são **dois clientes diferentes**. Cada um pode comprar 1 filtrado + 1 escama em uma mesma entrega.
- `Seu Luiz` aparece em aliases do frontend como `Luiz Peixaria`; manter consistência e evitar duas linhas para a mesma entrega. `Sr. Gilson` e `Seu Gilson` são o mesmo cliente.
- Outros clientes conhecidos incluem Padaria BMG, Gisele, Filomena, Ivan, Seu Pedro, Jonny Feira, Marcão, Tia, Churrasco Lilian, Churrasco da Tia, Peixaria Rua, Chatuba. **Manter valores programados já existentes**; consultar registros para localizar valores ainda não documentados, sem converter automaticamente um histórico isolado em nova regra.
- **Pagamento efetivo e cobrança**: uma venda registrada como `Fiado` não passa a ser `PIX` ou `Dinheiro` apenas porque esse cliente normalmente usa esse meio. A quitação exige fluxo próprio e conferência.

## Como interpretar a fala do usuário

> “Marcelo dois filtrados, pago; Pará dez, pagar depois; Caldo da Praça um filtrado e uma escama, pago; Capoeira dois PIX; Maíra 60 e GNV 30.”

Tratar como:
- Marcelo: **2 x filtrado**, Dinheiro, 2 x R$ 13.
- Pará: **10 x escama**, Fiado, 10 x R$ 6.
- Caldo da Praça: **duas linhas separadas**, 1 x filtrado R$ 13 + 1 x escama R$ 8, ambas Dinheiro; total da entrega R$ 21.
- Capoeira: **2 x escama**, PIX, 2 x R$ 8.
- Despesas: `Ajudante Maíra` R$ 60 e `GNV` R$ 30.

**Nunca duplicar** uma venda ao reapresentar a mesma lista ou receber um print da conversa. Se o usuário corrigir “Laranja” para “Alex Laranja”, tratar como retificação de nome, não venda adicional. Se informar pagamento depois, manter fiado. Quando quantidade ou produto não estiverem claros, cruzar com histórico e pedir esclarecimento.

## Estrutura real do Supabase (verificada em 05/11/2026)

### `public.gelo_control_sales`

Campos: `id` (texto, PK), `message_id` (opcional), `sold_ms` (milissegundos Unix), `sold_at` (timestamptz), `client`, `qty` (número > 0), `product_type` (**`esc`** ou **`filt`**), `payment` (**`Dinheiro`**, **`PIX`** ou **`Fiado`** conforme aplicativo), `unit_price`, `total_value`, `source`, `status` (**`active`** ou **`deleted`**), `created_ms`, `updated_ms`.

**Importante:** esta tabela é de **vendas históricas**, não uma tabela dedicada de cadastro de preços por cliente. Os valores usuais podem ser derivados das vendas recentes, com risco de exceções e alterações de preço.

### `public.gelo_control_expenses`

Campos: `id` (PK texto), `spent_ms`, `spent_at`, `description`, `amount`, `source`, `status`, `created_ms`, `updated_ms`. Não há coluna de categoria nesta tabela; a interface deriva categorias a partir do texto (`[PESSOAL]`, `[LOJA CONFIRMADA]` ou nomes como GNV e ajudantes). Ao registrar despesas diretamente no banco, verificar a classificação esperada pelo aplicativo antes de concluir.

### `public.gelo_deferred_settlements`

Campos `sale_id` (PK e FK para vendas), `settled_at`, `settled_by`. Usada para registrar quitação de venda fiada. Não alterar uma venda antiga como se sempre tivesse sido paga. Verificar no app o fluxo de liquidação e o relatório correspondente.

### `public.gelo_owners`

Tabela de controle de proprietário/autorização. **Não incluir emails, UUIDs particulares nem credenciais neste manual**. As tabelas públicas têm RLS habilitado; nunca desativar RLS para contornar erro de autorização.

## Fechamentos e fórmulas

- `total_value = qty × unit_price`.
- **Escamas** = soma `qty` em vendas `product_type='esc'` ativas do período.
- **Filtrados** = soma `qty` em vendas `product_type='filt'` ativas do período.
- **Sacos** = escamas + filtrados.
- **Dinheiro** = vendas ativas com `payment='Dinheiro'`.
- **PIX** = vendas ativas com `payment='PIX'`.
- **Pagar depois / Fiado** = vendas ativas com `payment='Fiado'` (atentar para quitações em relatório de contas a receber).
- **Bruto** = dinheiro + PIX + fiado = soma `total_value`.
- **Despesas** = soma `amount` ativa do período.
- **Líquido do relatório** = bruto − despesas. **Fluxo de caixa recebido** = dinheiro + PIX − despesas; não confundir com líquido contábil do app.
- Para dia de trabalho, filtrar **00:00 a 00:00 do próximo dia em `America/Sao_Paulo`**, convertendo corretamente para timestamptz. Não agrupar simplesmente pelo dia UTC.
- Excluir registros marcados `status='deleted'` dos totais.

## Exemplo real de conferência: 05/11/2026

O usuário autorizou a gravação, o banco foi consultado antes (**0 registros nesse dia**) e depois da operação foram confirmados:

| Indicador | Confirmado |
|---|---:|
| Entregas/linhas ditadas pelo usuário | 16 |
| Linhas de venda no banco | 18 (dois clientes com 2 produtos cada) |
| Escamas | 51 |
| Filtrados | 7 |
| Total de sacos | 58 |
| Dinheiro | R$ 124 |
| PIX | R$ 16 |
| Fiado | R$ 301 |
| Bruto | R$ 441 |
| 4 despesas: Maíra 60, GNV 30, material de obras 180, sacos para gelo 500 | R$ 770 |
| Líquido (bruto − despesas) | **−R$ 329** |
| Caixa (dinheiro + PIX − despesas) | **−R$ 630** |

Registros foram incluídos na tabela de vendas e despesas no Supabase; **nenhuma alteração de código** foi necessária. Um novo GPT **não deve reenviar esses lançamentos**, salvo identificação comprovada de ausência no banco.

## Procedimento seguro para gravação e verificação

1. Identifique o projeto correto `eebkuiivyolszarnpjkx`, leia o schema atual e confira as vendas e despesas da data; cheque também se há registros existentes com IDs de importação/manual.
2. Normalize nomes, aliases, quantidade, tipo e preço. Uma entrega mista (filtrado+escamas) se desdobra em duas linhas com **IDs diferentes**, sem somar produtos sob um tipo único.
3. Gere IDs estáveis por data/cliente/produto/ocorrência, **sem sobrescrever registros**. Verifique duplicidade não só por ID, mas por data, cliente, produto, quantidade, preço e pagamento, respeitando a possibilidade de **entregas legítimas repetidas**.
4. Preserve o formato real: `sold_at`/`spent_at` timestamptz, `sold_ms`/`spent_ms` em epoch-ms, valores monetários numéricos, `status='active'`, `source` indicando origem. Nunca usar `ON CONFLICT DO UPDATE` para alterar registros já gravados sem instrução.
5. Se a integração existente do app estiver funcional e autorizada, preferir o fluxo oficial da aplicação. Se for necessário lançar via ferramenta Supabase autorizada, seguir schema e políticas vigentes, com escrita limitada às linhas necessárias. **Não enviar dados para qualquer endpoint público não autenticado.**
6. Reconsultar o banco por data, somando cada coluna e verificando despesas e formas de pagamento. Se a escrita falhar, declarar erro e não dizer que concluiu.
7. Confirmar que registros de dias anteriores e histórico do Caderno não foram modificados. Após sucesso, fornecer link do app.

**Consulta SQL de auditoria, somente leitura:**

```sql
select client, product_type, qty, unit_price, total_value, payment, sold_at
from public.gelo_control_sales
where status = 'active'
  and sold_at >= '2026-11-05T00:00:00-03:00'::timestamptz
  and sold_at <  '2026-11-06T00:00:00-03:00'::timestamptz
order by sold_at, client;
```

Antes de operar em outra data, **substituir o intervalo**. Para despesas, usar `gelo_control_expenses`, `spent_at` e `amount`.

## Proteção do histórico e manutenção

- Fazer backup antes de migrações/alterações estruturais; preservar o que já funciona.
- Nunca executar `TRUNCATE`, `DROP`, limpeza geral ou reinserção cega de um dia. Não usar reset para apagar o Caderno.
- Conferir **RLS**, políticas de autorização e segregação entre chave pública do frontend e credenciais privadas.
- Não expor no GitHub credenciais do Supabase, service-role, tokens, senhas, dados pessoais ou a relação completa de vendas.
- O repositório é público: preços aqui são **referências operacionais**; caso se tornem confidenciais, mover tabela comercial detalhada para armazenamento privado, deixando neste README apenas o procedimento.
- Se o botão de salvar, PWA ou backend falhar, separar diagnósticos: interface/cache → proxy `/api/controle` → `/api/control-bridge` → Supabase/RLS. Nunca repetir gravação sem consultar se a primeira tentativa foi salva.
- Quando o usuário pedir uma melhoria no aplicativo, **alterar só o que foi pedido**, testar e evitar regressões.

## Mensagem de partida para outra conversa

> Leia primeiro o arquivo README.md do repositório `claudio41cg-max/gelo-tutoia-controle`. Sou responsável pelo Gelo Tutóia. Vou ditar vendas e despesas do dia; você deve reconhecer clientes, preços e formas de pagamento, mostrar os totais, esperar minha autorização para enviar, evitar duplicidade e conferir no Supabase após a gravação. O projeto Supabase chama-se `gelo-tutoia-controle`. Não recrie o aplicativo e não mexa no histórico de dias anteriores. Se algum detalhe divergente surgir, leia a implementação atual e pergunte antes de escrever.

---

**Atenção para outro GPT:** o usuário não autorizou reajustar nenhum cliente. Os valores já definidos são permanentes até ordem contrária. Não confundir "preço calculado no lançamento" com "alterar cadastro".

**Nota de precisão:** documento compilado com observação do repositório, esquema e dados reais consultados em 05/11/2026 e regras comerciais informadas pelo responsável. Sempre tratar o estado ao vivo do app e instruções mais recentes do responsável como superiores a este registro histórico.
