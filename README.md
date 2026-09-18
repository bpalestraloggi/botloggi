# botloggi — Dashboard "Como usamos IA no Viver de IA"

Repositório Prado.

## Dashboard AI Driven

Dashboard interativa que recria o mapa **"Como usamos IA no Viver de IA"** (roda *sunburst*)
e adiciona um guia de **como usar a IA da maneira correta**.

### Abrir

Abra o arquivo [`index.html`](./index.html) no navegador. Não há build — é um único arquivo
HTML que usa [Highcharts](https://www.highcharts.com/) (módulo *sunburst*) via CDN.

### O que mostra

- **Roda de aplicação da IA** — gráfico *sunburst* interativo (clique para explorar) com as 5 áreas:
  - **RH** — Triagem, Novos contratos, Onboarding, PDIs, 1:1 com o time
  - **Marketing** — Gerar vídeos, Copywriting, Campanhas, Sites, Gerar imagens
  - **Vendas** — Reuniões, Negociação, Forecast, Follow up, Propostas, Prospecção
  - **Atendimento** — Automação, Roteamento, Satisfação, Conhecimento, Ligações, Personalização
  - **Financeiro** — Contas a pagar, Fluxo de caixa, Contas a receber, Cálculos
- **KPIs** — áreas, casos de uso e cobertura.
- **Áreas & casos de uso** — lista navegável com os mesmos dados da roda.
- **Como usar a IA da maneira correta** — 6 boas práticas (contexto, humano no comando,
  verificar fatos, proteger dados, iterar, padronizar).

### Personalizar

Os dados ficam no objeto `data` dentro do `<script>` em `index.html`. Edite para incluir
novas áreas ou casos de uso — a roda e a lista são geradas automaticamente.

## Portal OAB SP

Arquivo [`portal-oab-sp.html`](./portal-oab-sp.html) — versão exportada do artifact
**Portal OAB SP (Copy)**. É um HTML autocontido (todos os assets embutidos), sem build
e sem dependência de rede: basta baixar e abrir no navegador (funciona via `file://`).
