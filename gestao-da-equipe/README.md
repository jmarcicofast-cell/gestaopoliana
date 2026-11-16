# Gestão da Equipe

Aplicação privada construída diretamente a partir do HTML original preservado em `source-reference/`.

Mantém resumo diário, vendas de aço, premiações e metas. Acrescenta gravação em D1, controle de versão contra sobrescritas simultâneas, edição de registros, confirmações, validação no cliente e servidor, CSV, backup e importação JSON, navegação organizada e layout responsivo.

O acesso é restrito pela plataforma à proprietária. A API compartilha os dados dentro deste Site privado. Rever autorização da API antes de ampliar o público. Não existem credenciais no HTML.

O HTML recebido não contém lançamentos embutidos; os dados antes salvos no navegador de origem precisam ser importados por backup completo. Regras, pontos e catálogo iniciais são os do arquivo original. Elegibilidade e pontuação são conferidas pelo gerente; não são geradas premiações automáticas.

`npm run dev`, `npm run db:generate`, `npm run build`. O banco da prévia é separado do banco hospedado. Migrações em `drizzle/`. Backup máximo: 2 MB.

## Relatório para a diretoria

A aba Relatório executivo respeita o período e as unidades selecionados. Incluem visão comercial consolidada e visão de aço/produtos, comparativo com intervalo anterior de mesma duração, gráficos de evolução e contribuição, KPIs de cargas/ticket/área, metas mensais com cobertura explícita e desembolsos de premiações. Não há estimativas de margem ou entregas sem dados, rateio automático de metas ou duplicação do aço no faturamento dos resumos.

O relatório pode ser baixado como HTML autossuficiente ou impresso/salvo como PDF pelo navegador. Métricas em `public/report-metrics.mjs`; apresentação em `public/equipe-report.*`. Testes: `node scripts/check-report.mjs`.

## Visão semanal da diretoria

O relatório abre na visão semanal inspirada na referência: semana anterior, vendas por dia e BU, total e atingimento semanal, acumulado mensal, aço por BU e antecipações fora do faturamento. A data final do filtro define o corte. A opção Ampliar visão aproveita a largura da tela e a impressão usa A4 paisagem.

As cinco BUs do quadro usam identificadores estáveis: Atacado B2B → B2B SP; Televendas → Televendas Porto; Atacado BA → Televendas BA; Lojas Rio → Lojas do Rio; Lojas de Fora é uma nova unidade. Nomes e responsáveis de exibição são editáveis e não renomeiam os lançamentos existentes.

Metas semanais podem ser informadas ou rateadas pela meta mensal, conforme dias de segunda a sexta e datas sem expediente configuradas. Zero informado difere de ausência de dados; “+” sinaliza posições parciais. Um fechamento acumulado de aço cobre os detalhes até sua data; fechamentos diários substituem os detalhes do respectivo dia. O mix por produto permanece baseado no detalhamento. As antecipações são um registro separado de fluxo de caixa e nunca entram em vendas.

Os campos opcionais `diretoria`, `cash` e `steelClosures` preservam compatibilidade com o estado anterior. Não houve mudança de tabelas ou migração de dados. Validação adicional: `node scripts/check-weekly.mjs`.
