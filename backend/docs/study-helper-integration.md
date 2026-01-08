# Integração: Study Helper → PDF Microservice

Este documento descreve uma proposta de integração entre o backend do **Study Helper** e este **pdf-microservice**, com foco em:

- permitir que o usuário escolha **tipos de relatório** no sistema;
- o backend montar um payload no formato do template `builder` (um “template builder” por tipo);
- o microserviço retornar o PDF binário.

## Visão geral (fluxo)

1. Frontend pede um PDF informando o `tipoRelatorio` e filtros (ex.: período, tema).
2. Backend do Study Helper:
   - valida auth/ownership;
   - busca/gera os dados do relatório (ex.: `GET /relatorios/resumo` ou serviço interno equivalente);
   - escolhe um “builder” (template de seções) para o tipo solicitado;
   - monta `{ templateName: "builder", fileName, data: { layout, secoes } }`;
   - chama `POST /generate-pdf` neste microserviço.
3. Backend retorna o binário do PDF (stream) ao frontend, ou armazena (S3/MinIO) e retorna uma URL.

## Tipos de relatório sugeridos (Study Helper)

Mesmo que o Study Helper hoje tenha o endpoint `GET /relatorios/resumo`, é útil pensar em tipos explícitos (extensíveis) para o PDF:

- `RESUMO_CONSOLIDADO` (já existe via `/relatorios/resumo`)
- `CRONOGRAMA_SEMANAL` (cronograma do usuário no período / semana)
- `REVISOES_PENDENTES` (lista priorizada de revisões pendentes/atrasadas)
- `DESEMPENHO_POR_TEMA` (ranking e métricas por tema)

O recomendável é começar com `RESUMO_CONSOLIDADO` e evoluir.

## Builder por tipo (ideia)

No backend do Study Helper, implementar um contrato como:

- `interface RelatorioPdfBuilder<TData> { tipo: string; build(input: TData): BuilderData }`

Onde `BuilderData` é o payload do template `builder`:

- `layout` (margens)
- `secoes[]` (componentes: `header_corporativo`, `info_grid`, `tabela`, `lista`, `grafico`, `qrcode`, `assinaturas`, `texto`, `foto`)

### Exemplo: PDF de Resumo Consolidado

Dados de origem (backend): mesmo shape (ou derivado) do retorno de `/relatorios/resumo`.

Seções sugeridas:

1. `header_corporativo`

- `empresaNome`: "Study Helper"
- `documentoTitulo`: "RELATÓRIO – RESUMO CONSOLIDADO"
- `referencia`: por exemplo `PERIODO_2026-01-01_2026-01-31`
- `dataAtual`: opcional (o microserviço completa automaticamente se faltar)

2. `info_grid` (KPIs)

- totalEstudos, tempoTotalEstudado, diasComEstudo, tempoMedioPorDiaAtivo
- revisoesConcluidas, revisoesPendentes, revisoesAtrasadas, revisoesExpiradas, revisoesHoje
- ofensiva.atual, ofensiva.bloqueiosRestantes

3. `grafico` (Chart.js)

- barras: `registrosPorTipo` (quantidade / tempo)
- pizza/doughnut: distribuição de status de revisões

4. `tabela` (ranking de temas)

- colunas: Tema, Estudos, Tempo total (min)

5. `texto` (observações)

- período aplicado e nota sobre filtros

## Boas práticas

- Prefira imagens embutidas como `data:image/png;base64,...`.
- Evite enviar URLs remotas em `foto.conteudo` (reduz risco de SSRF e falhas de rede).
- Controle de payload: evite PDFs gigantes; use paginação/limites no relatório.

## Próximos passos recomendados

1. Definir o endpoint do Study Helper para PDF (ex.: `GET /relatorios/resumo/pdf`).
2. Implementar o primeiro builder (`RESUMO_CONSOLIDADO`).
3. Padronizar nomes/versões do relatório no `fileName`.
4. Adicionar testes unitários no Study Helper para cada builder.
