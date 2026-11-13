# copilotkit-explore

Protótipo do CopilotKit (API v2, `@copilotkit/*@1.87.1`) com Next.js 15 e Anthropic.
Um copiloto lateral que lê e edita o mapa "Como usamos IA" (mesmos dados do `../index.html`).

## Rodar

```sh
cp .env.example .env.local   # preencha ANTHROPIC_API_KEY, NEXTAUTH_* e um provedor de login
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
| Login + threads por usuário (`identifyUser`) | `lib/auth.ts`, `middleware.ts`, `route.ts` | entre com contas diferentes |

## Login

NextAuth 4 com sessão JWT em cookie assinado (sem banco):

- **Provedores:** GitHub e/ou Google, ativados quando `AUTH_GITHUB_*` / `AUTH_GOOGLE_*` estão definidos.
  Callback OAuth: `<NEXTAUTH_URL>/api/auth/callback/github` (ou `google`).
- **Página:** `middleware.ts` redireciona para `/api/auth/signin` quem não está logado.
- **Runtime:** `/api/copilotkit/*` responde 401 sem sessão; `identifyUser` usa o ID do provedor
  (`github:12345`), então cada conta só vê e continua as próprias threads.
- **Dev:** `AUTH_DEV_LOGIN=true` adiciona um login sem senha (qualquer nome). Usado no e2e; nunca em produção.

## Teste ponta a ponta (sem chave real)

```sh
npm run build && npm run e2e
```

Sobe uma API Anthropic simulada (`e2e/fake-anthropic.js`) e um servidor MCP local
(`e2e/mcp-server.mjs`), e o Playwright (`e2e/drive.js`) exercita os recursos acima, incluindo 401 sem sessão,
login, logout e isolamento de threads entre contas.
