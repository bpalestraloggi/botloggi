import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

// Agente padrão: roda no servidor e chama o modelo da Anthropic.
// A chave vem de ANTHROPIC_API_KEY (lida automaticamente pelo BuiltInAgent).
const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: process.env.COPILOT_MODEL ?? "anthropic/claude-sonnet-4-6",
      maxSteps: 8,
    }),
  },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handler;
export const POST = handler;
