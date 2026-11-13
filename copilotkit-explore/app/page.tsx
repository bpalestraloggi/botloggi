"use client";

import { useState } from "react";
import { z } from "zod";
import {
  CopilotSidebar,
  useAgentContext,
  useFrontendTool,
} from "@copilotkit/react-core/v2";

type UseMap = Record<string, string[]>;

// Mesmo mapa do dashboard estático (../index.html).
const INITIAL: UseMap = {
  RH: ["Triagem", "Novos contratos", "Onboarding", "PDIs", "1:1 com o time"],
  Marketing: ["Gerar vídeos", "Copywriting", "Campanhas", "Sites", "Gerar imagens"],
  Vendas: ["Reuniões", "Negociação", "Forecast", "Follow up", "Propostas", "Prospecção"],
  Atendimento: ["Automação", "Roteamento", "Satisfação", "Conhecimento", "Ligações", "Personalização"],
  Financeiro: ["Contas a pagar", "Fluxo de caixa", "Contas a receber", "Cálculos"],
};

export default function Page() {
  const [map, setMap] = useState<UseMap>(INITIAL);
  const [added, setAdded] = useState<Set<string>>(new Set());

  // 1) Contexto: o agente "enxerga" o estado atual da tela.
  useAgentContext({
    description: "Mapa atual de casos de uso de IA por área da empresa",
    value: map,
  });

  // 2) Ação no frontend: o agente altera o estado da UI.
  useFrontendTool(
    {
      name: "addUseCase",
      description: "Adiciona um caso de uso de IA a uma área (cria a área se não existir).",
      parameters: z.object({
        area: z.string().describe("Nome da área, ex.: Vendas"),
        useCase: z.string().describe("Caso de uso curto, ex.: Qualificação de leads"),
      }),
      handler: async ({ area, useCase }) => {
        setMap((m) => ({ ...m, [area]: [...(m[area] ?? []), useCase] }));
        setAdded((s) => new Set(s).add(`${area}::${useCase}`));
        return `Adicionado "${useCase}" em ${area}.`;
      },
      // 3) Generative UI: como a chamada aparece dentro do chat.
      render: ({ args, status }) => (
        <div className="card">
          {status === "complete" ? "✅" : "⏳"} {args.area} → {args.useCase}
        </div>
      ),
    },
    [],
  );

  useFrontendTool(
    {
      name: "removeUseCase",
      description: "Remove um caso de uso de uma área.",
      parameters: z.object({ area: z.string(), useCase: z.string() }),
      handler: async ({ area, useCase }) => {
        setMap((m) => ({ ...m, [area]: (m[area] ?? []).filter((u) => u !== useCase) }));
        return `Removido "${useCase}" de ${area}.`;
      },
    },
    [],
  );

  return (
    <>
      <main>
        <h1>Como usamos IA</h1>
        <p className="sub">
          Peça ao copiloto: &quot;sugira 3 usos de IA para Financeiro e adicione&quot; ou
          &quot;qual área tem menos casos de uso?&quot;
        </p>
        <div className="grid">
          {Object.entries(map).map(([area, uses]) => (
            <section className="area" key={area}>
              <h2>
                {area} <span>{uses.length}</span>
              </h2>
              <ul>
                {uses.map((u) => (
                  <li key={u} className={added.has(`${area}::${u}`) ? "new" : undefined}>
                    {u}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <CopilotSidebar defaultOpen />
    </>
  );
}
