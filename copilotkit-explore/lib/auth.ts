import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

// Login de desenvolvimento: aceita qualquer nome, SEM senha.
// Só existe com AUTH_DEV_LOGIN=true. Nunca habilite em produção.
const devLogin = process.env.AUTH_DEV_LOGIN === "true";
if (devLogin) {
  console.warn("[auth] AUTH_DEV_LOGIN=true: login sem senha habilitado. Não use em produção.");
}

const providers: NextAuthOptions["providers"] = [];

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  );
}

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

if (devLogin) {
  providers.push(
    CredentialsProvider({
      id: "dev",
      name: "Dev (sem senha)",
      credentials: { username: { label: "Usuário", type: "text" } },
      authorize: async (credentials) => {
        const name = credentials?.username?.trim().toLowerCase();
        if (!name || !/^[a-z0-9_-]{1,32}$/.test(name)) return null;
        return { id: name, name };
      },
    }),
  );
}

if (providers.length === 0) {
  console.warn(
    "[auth] Nenhum provedor configurado. Defina AUTH_GITHUB_ID/SECRET ou AUTH_GOOGLE_ID/SECRET.",
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    // No login, grava um ID estável e único por provedor: "github:12345".
    jwt: async ({ token, account }) => {
      if (account) token.uid = `${account.provider}:${account.providerAccountId}`;
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && typeof token.uid === "string") session.user.id = token.uid;
      return session;
    },
  },
};

export type AuthUser = { id: string; name: string };

/** Usuário autenticado da requisição atual, ou null. */
export async function currentUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;
  return { id, name: session.user?.name ?? session.user?.email ?? id };
}
