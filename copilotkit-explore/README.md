# copilotkit-explore

Protótipo do CopilotKit (API v2, `@copilotkit/*@1.87.1`) com Next.js 15 e Anthropic.
Um copiloto lateral que lê e edita o mapa "Como usamos IA" (mesmos dados do `../index.html`).

## Rodar

```sh
cp .env.example .env.local   # preencha ANTHROPIC_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

## O que o exemplo demonstra

| Recurso | Onde | Experimente no chat |
| --- | --- | --- |
| Runtime + agente Anthropic (`BuiltInAgent`) | `app/api/copilotkit/[[...path]]/route.ts` | — |
| Contexto da UI para o agente (`useAgentContext`) | `app/page.tsx` | "qual área tem menos casos de uso?" |
| Ação no frontend + generative UI (`useFrontendTool`) | `addUseCase` em `app/page.tsx` | "adicione Revisão de contratos em Jurídico" |
| Human-in-the-loop (`useHumanInTheLoop`) | `removeUseCase` em `app/page.tsx` | "remova Cálculos de Financeiro" |
| Tool no servidor (`defineTool`) | `searchUseCaseCatalog` + `lib/catalog.ts` | "consulte o catálogo e sugira usos de alto impacto para Financeiro" |
| MCP (`mcpServers`) | `route.ts`, ativado por `MCP_SERVER_URL` | depende das tools do servidor MCP |
| Threads por usuário (`identifyUser`) | `route.ts` + seletor em `app/providers.tsx` | troque o usuário no topo da página |

> `identifyUser` aqui confia no header `x-demo-user`, só para demonstração.
> Em produção, derive o usuário de uma sessão validada (NextAuth, Clerk, Auth0, JWT).

## Teste ponta a ponta (sem chave real)

```sh
npm run build && npm run e2e
```

Sobe uma API Anthropic simulada (`e2e/fake-anthropic.js`) e um servidor MCP local
(`e2e/mcp-server.mjs`), e o Playwright (`e2e/drive.js`) exercita os sete recursos acima.
