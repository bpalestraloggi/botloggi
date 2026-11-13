"use client";

import { useState } from "react";
import { z } from "zod";
import {
  CopilotSidebar,
  useAgentContext,
  useFrontendTool,
  useHumanInTheLoop,
} from "@copilotkit/react-core/v2";
import { useDemoUser } from "./providers";

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
  const { user, setUser, users } = useDemoUser();

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

  // 4) Human-in-the-loop: o agente pede, o usuário decide na tela.
  useHumanInTheLoop(
    {
      name: "removeUseCase",
      description:
        "Remove um caso de uso de uma área. Exige confirmação do usuário; " +
        "se ele recusar, não insista.",
      parameters: z.object({ area: z.string(), useCase: z.string() }),
      render: ({ args, respond, result }) => {
        if (result) return <div className="card">{result}</div>;
        if (!respond) return <div className="card">⏳ Preparando remoção…</div>;
        return (
          <div className="card confirm">
            Remover <b>{args.useCase}</b> de <b>{args.area}</b>?
            <div className="actions">
              <button
                onClick={() => {
                  setMap((m) => ({
                    ...m,
                    [args.area]: (m[args.area] ?? []).filter((u) => u !== args.useCase),
                  }));
                  respond(`Removido "${args.useCase}" de ${args.area}.`);
                }}
              >
                Remover
              </button>
              <button className="ghost" onClick={() => respond("Usuário cancelou a remoção.")}>
                Cancelar
              </button>
            </div>
          </div>
        );
      },
    },
    [],
  );

  return (
    <>
      <main>
        <div className="userbar">
          Usuário (demo):{" "}
          <select value={user} onChange={(e) => setUser(e.target.value)}>
            {users.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <h1>Como usamos IA</h1>
        <p className="sub">
          Experimente: &quot;consulte o catálogo e sugira usos de alto impacto para
          Financeiro&quot;, &quot;remova Cálculos de Financeiro&quot; ou &quot;qual área tem menos
          casos de uso?&quot;
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
