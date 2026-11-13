import type { ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import "./globals.css";

export const metadata = {
  title: "Mapa de IA — Copiloto",
  description: "Exploração do CopilotKit sobre o mapa 'Como usamos IA'",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <CopilotKit runtimeUrl="/api/copilotkit">{children}</CopilotKit>
      </body>
    </html>
  );
}
