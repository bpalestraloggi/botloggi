import { z } from "zod";
import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
  defineTool,
  type MCPClientConfig,
} from "@copilotkit/runtime/v2";
import { searchCatalog } from "@/lib/catalog";

// --- Tools no servidor -------------------------------------------------------
// Rodam no backend: acesso a dados, segredos e APIs que o navegador não deve ver.
const searchUseCaseCatalog = defineTool({
  name: "searchUseCaseCatalog",
  description:
    "Busca no catálogo interno de casos de uso de IA (com esforço e impacto). " +
    "Use antes de sugerir novos casos de uso.",
  parameters: z.object({
    area: z.string().optional().describe("Filtra por área, ex.: Financeiro"),
    query: z.string().optional().describe("Palavra-chave, ex.: contratos"),
  }),
  execute: async ({ area, query }) => searchCatalog(area, query),
});

// --- MCP ---------------------------------------------------------------------
// Opcional: MCP_SERVER_URL aponta para um servidor MCP (Streamable HTTP).
// As tools dele entram no agente com o prefixo "external_" se houver conflito.
const mcpServers: MCPClientConfig[] = process.env.MCP_SERVER_URL
  ? [
      {
        type: "http",
        name: "external",
        url: process.env.MCP_SERVER_URL,
        ...(process.env.MCP_SERVER_TOKEN && {
          options: {
            requestInit: {
              headers: { Authorization: `Bearer ${process.env.MCP_SERVER_TOKEN}` },
            },
          },
        }),
      },
    ]
  : [];

// --- Runtime -----------------------------------------------------------------
const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: process.env.COPILOT_MODEL ?? "anthropic/claude-sonnet-4-6",
      maxSteps: 8,
      prompt:
        "Você é o copiloto do mapa 'Como usamos IA'. Responda em português. " +
        "Para sugerir casos de uso, consulte searchUseCaseCatalog e cite esforço/impacto. " +
        "Para remover itens use removeUseCase: o usuário confirma na tela.",
      tools: [searchUseCaseCatalog],
      mcpServers,
    }),
  },
  // Identidade por requisição: cada usuário só vê e continua as próprias threads.
  // DEMO: lê o header enviado pelo seletor da página. Em produção, troque por
  // validação de sessão/JWT (ex.: cookie do NextAuth, Clerk, Auth0).
  identifyUser: (request) => {
    const id = request.headers.get("x-demo-user")?.trim() || "anonimo";
    return { id, name: id };
  },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handler;
export const POST = handler;
