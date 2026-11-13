"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core/v2";

const DEMO_USERS = ["ana", "bruno", "carla"] as const;

type UserCtx = { user: string; setUser: (u: string) => void; users: readonly string[] };
const UserContext = createContext<UserCtx | null>(null);

export function useDemoUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useDemoUser fora de <Providers>");
  return ctx;
}

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string>(DEMO_USERS[0]);
  return (
    <UserContext.Provider value={{ user, setUser, users: DEMO_USERS }}>
      {/* key={user}: trocar de usuário recria o provider e começa uma thread nova,
          já que o runtime recusa threads de outro dono. */}
      <CopilotKit key={user} runtimeUrl="/api/copilotkit" headers={{ "x-demo-user": user }}>
        {children}
      </CopilotKit>
    </UserContext.Provider>
  );
}
