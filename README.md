# Gestão da Equipe — Diretoria Comercial

Aplicação publicada em https://jmarcicofast-cell.github.io/gestaopoliana/.

A raiz deste repositório contém a versão atual para GitHub Pages: tela de login, interface atualizada, relatório executivo, visão semanal por BU, aço, metas, premiações e antecipações.

## Dados e acessos

O Supabase fornece Auth, PostgreSQL e a função `team-api`. O navegador usa apenas a chave publicável em `config.js`; nenhuma chave administrativa pertence ao frontend ou ao GitHub.

Todas as tabelas têm RLS e não concedem acesso direto a `anon` ou `authenticated`. A função valida o token com Supabase Auth e consulta a conta ativa no banco a cada solicitação. Só administradores gerenciam os usuários. Uma conta do Auth sem cadastro em `team_members` não tem acesso aos dados.

O primeiro administrador é ativado com um código privado de uso único. O código não está neste repositório. O administrador pode criar outros administradores, como Poliana, e colaboradores. Novos usuários precisam substituir a senha temporária. Bloqueios e redefinições invalidam o acesso anterior na aplicação.

## Uso diário

Cada pessoa entra com seu e-mail e senha e preenche os lançamentos. Os resultados são compartilhados entre usuários e dispositivos. As telas sem formulários abertos atualizam a cada 15 segundos. Edições em registros diferentes são combinadas; alterações concorrentes no mesmo campo são recusadas e o rascunho pode ser baixado.

Em **Relatório executivo → Visão semanal** estão as vendas por BU/dia, metas, acumulado mensal, aço e antecipações. Use **BUs, metas e calendário** para configurar nomes, responsáveis, metas e dias sem expediente.

## Origem dos dados anteriores

O HTML antigo usava a chave `gp1` do localStorage. Esses lançamentos não são enviados automaticamente ao banco. Exporte um backup no navegador de origem e importe em **Dados e backup**. O ambiente anterior em Sites/D1 também é independente; importe um backup para migrar seus registros. Nunca coloque backups comerciais neste repositório público.

## Backend

`backend/schema.sql` registra o esquema inicial, e `backend/index.ts` é o código da Edge Function. `backend/state.ts` valida os dados e `backend/merge.ts` trata concorrência. A autenticação é verificada dentro da função (`verify_jwt=false` no gateway; chamadas sem usuário válido são negadas pela função).

O SDK Supabase JS é distribuído localmente em `supabase.js`, versão fixa 2.95.0. A função usa a mesma versão e Zod 3.25.76.

## Publicação

GitHub Pages usa `main`, pasta raiz. As URLs dos arquivos são relativas para funcionar sob `/gestaopoliana/`. O arquivo `.nojekyll` impede processamento Jekyll. Alterações no backend precisam ser implantadas também no Supabase.
