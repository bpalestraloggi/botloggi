import type { ReactNode } from "react";
import "@copilotkit/react-core/v2/styles.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Mapa de IA — Copiloto",
  description: "Exploração do CopilotKit sobre o mapa 'Como usamos IA'",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
