// Catálogo de casos de uso que vive só no servidor.
// Em produção, isto seria um banco, uma API interna ou uma base de conhecimento.
export type CatalogEntry = {
  area: string;
  useCase: string;
  effort: "baixo" | "médio" | "alto";
  impact: "baixo" | "médio" | "alto";
  description: string;
};

export const CATALOG: CatalogEntry[] = [
  { area: "Financeiro", useCase: "Conciliação bancária", effort: "médio", impact: "alto", description: "Casar extratos com lançamentos e apontar divergências." },
  { area: "Financeiro", useCase: "Análise de inadimplência", effort: "médio", impact: "alto", description: "Prever clientes com risco de atraso a partir do histórico." },
  { area: "Financeiro", useCase: "Classificação de despesas", effort: "baixo", impact: "médio", description: "Categorizar notas e recibos automaticamente." },
  { area: "Vendas", useCase: "Qualificação de leads", effort: "baixo", impact: "alto", description: "Pontuar leads com base em perfil e interações." },
  { area: "Vendas", useCase: "Resumo de calls", effort: "baixo", impact: "médio", description: "Gerar resumo e próximos passos após cada reunião." },
  { area: "Marketing", useCase: "Testes A/B de copy", effort: "baixo", impact: "médio", description: "Gerar variações de texto para testes." },
  { area: "Marketing", useCase: "Análise de sentimento", effort: "médio", impact: "médio", description: "Monitorar menções e comentários da marca." },
  { area: "RH", useCase: "Pesquisa de clima", effort: "médio", impact: "médio", description: "Analisar respostas abertas e agrupar temas." },
  { area: "RH", useCase: "Descrição de vagas", effort: "baixo", impact: "baixo", description: "Redigir vagas a partir de requisitos." },
  { area: "Atendimento", useCase: "Sugestão de respostas", effort: "baixo", impact: "alto", description: "Propor resposta ao agente humano com base na base de conhecimento." },
  { area: "Atendimento", useCase: "Detecção de churn", effort: "alto", impact: "alto", description: "Identificar clientes insatisfeitos nas conversas." },
  { area: "Jurídico", useCase: "Revisão de contratos", effort: "médio", impact: "alto", description: "Destacar cláusulas de risco e desvios do padrão." },
];

export function searchCatalog(area?: string, query?: string): CatalogEntry[] {
  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  return CATALOG.filter(
    (e) =>
      (!area || norm(e.area) === norm(area)) &&
      (!query || norm(`${e.useCase} ${e.description}`).includes(norm(query))),
  );
}
