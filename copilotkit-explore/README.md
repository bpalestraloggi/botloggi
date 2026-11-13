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

| Recurso | Onde |
| --- | --- |
| Runtime + agente Anthropic (`BuiltInAgent`) | `app/api/copilotkit/[[...path]]/route.ts` |
| Provider `<CopilotKit runtimeUrl>` | `app/layout.tsx` |
| Contexto da UI para o agente (`useAgentContext`) | `app/page.tsx` |
| Ações no frontend (`useFrontendTool` + zod) | `addUseCase`, `removeUseCase` |
| Generative UI (`render` da tool no chat) | card ✅/⏳ em `addUseCase` |
| Chat (`CopilotSidebar`) | `app/page.tsx` |

## Próximos passos possíveis

- `useHumanInTheLoop`: pedir confirmação antes de remover itens.
- Tools no servidor (`defineTool` no `BuiltInAgent`) para consultar APIs/bancos.
- `mcpClients` no agente para plugar servidores MCP.
- `identifyUser` no `CopilotRuntime` para threads por usuário.
