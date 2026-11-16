# Verificação

- Build de produção concluído.
- Validação do servidor: estado vazio, lançamento válido, rejeição de negativos, cargas fracionadas, datas impossíveis, gerente vazio, resumo duplicado, aço com quantidade zero e status inválido.
- Navegador: resumo com 2 trucks (R$ 70.000), 1 carreta (R$ 75.000) e 2.400 m²; total R$ 145.000 e 3 cargas.
- Edição: outras vendas de R$ 5.000 resultam em R$ 150.000. Persistência confirmada após recarregar.
- Filtro: desmarcar Televendas remove o lançamento dos totais e da tabela.
- Relatório: totais conferidos com o lançamento editado.
- Aço: 100 peças por R$ 1.200, preço médio R$ 12 e mix 100%.
- Premiação: Cliente novo × 2 = R$ 100; status Pago resulta em desembolso pendente zero.
- Meta: salvamento explícito de R$ 300.000 e painel exibindo 50% para o realizado de R$ 150.000.
- Backup JSON disponível; reimportação completa via navegador não verificada por indisponibilidade do ambiente de transferência. O conteúdo importado passa pelo mesmo esquema validado no servidor antes de gravar.

Dados de teste apenas na prévia local; nenhuma carga inicial ou seed de resultados em produção.

## Relatório executivo

- Substituição dos blocos de texto por relatório visual com KPIs, gráficos SVG, tabela por unidade, análise mensal de metas, produtos de aço e premiações.
- Modelo de cálculo validado em `scripts/check-report.mjs`: consolidado sem duplicidade de aço, ticket somente de cargas, filtros, período anterior de igual duração, ausência de base, metas mensais/parciais, agregação das séries e ano bissexto. O cálculo não modifica o estado.
- Navegador: abertura pelo botão Gerar e pela navegação, visão geral/aço, filtros por unidade, gráfico acumulado/diário e detalhamento dos pontos conferidos com os registros da prévia.
- Exportação HTML: download concluído e conteúdo conferido; gráficos, consolidado e metas incluídos, sem scripts nem folhas de estilo externas.
- A impressão usa a caixa nativa do navegador com estilo A4; a prévia de impressão nativa não é exibida pelo navegador remoto de teste.
- O relatório é calculado localmente a partir dos dados já carregados; não grava lançamentos nem altera permissões.

## Limpeza dos relatórios antigos

Removidos da interface e dos scripts de produção os dois blocos antigos de relatório em texto, seus campos Gerar/Copiar e geradores legados. O relatório executivo permanece como a única área de relatórios. O arquivo em source-reference preserva o HTML original apenas como referência histórica.

## Quadro semanal por BU

- Testes de calendário e metas: semanas no mês, 19 dias configurados no cenário de teste, rateio semanal, meta manual, dias parciais, fins de semana e virada de mês.
- Testes de dados: cinco BUs, nomes editáveis sem renomear chaves, filtros, soma por dia/semana/mês, pendente versus zero informado, “+” em totais parciais, antecipação fora do faturamento e conciliação de aço entre acumulado, diário e produtos.
- Compatibilidade do estado legado validada, com rejeição de antecipação zero/negativa, fechamento de aço negativo ou duplicado e datas inválidas.
- Navegador: configuração e calendário salvos/recarregados, antecipação registrada sem alterar vendas, fechamento acumulado de aço zero exibido como informado, troca de semana e preservação das demais visões.
- Os dados de teste pertencem apenas ao banco local da prévia. Não há seed ou importação de valores da imagem no banco de produção.
