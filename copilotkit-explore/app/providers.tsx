"use client";

import type { ReactNode } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { CopilotKit } from "@copilotkit/react-core/v2";

function CopilotForUser({ children }: { children: ReactNode }) {
  const { data } = useSession();
  // key: trocar de conta recria o provider e começa uma thread nova,
  // já que o runtime recusa threads de outro dono. O cookie de sessão
  // segue automaticamente nas chamadas (mesma origem).
  return (
    <CopilotKit key={data?.user?.id ?? "anon"} runtimeUrl="/api/copilotkit">
      {children}
    </CopilotKit>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CopilotForUser>{children}</CopilotForUser>
    </SessionProvider>
  );
}
