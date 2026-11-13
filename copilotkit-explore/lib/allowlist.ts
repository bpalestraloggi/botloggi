// Lista de e-mails autorizados a entrar via OAuth.
// Regras: comparação exata (sem diferenciar maiúsculas) e somente e-mails
// verificados pelo provedor. Lista vazia = ninguém entra (fail closed).

export function parseAllowedEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAllowed(verifiedEmails: string[], allowed: Set<string>): boolean {
  return verifiedEmails.some((e) => allowed.has(e.trim().toLowerCase()));
}

type GitHubEmail = { email: string; verified: boolean };

/**
 * E-mails verificados do usuário, conforme o provedor.
 * - Google: o `email` do perfil, só se `email_verified` for true.
 * - GitHub: o e-mail do perfil pode ser privado ou não verificado, então
 *   consulta /user/emails (escopo user:email, padrão do provider) e usa só os verificados.
 */
export async function verifiedEmailsFor(
  provider: string,
  profile: Record<string, unknown> | undefined,
  accessToken: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<string[]> {
  if (provider === "google") {
    const email = profile?.email;
    return profile?.email_verified === true && typeof email === "string" ? [email] : [];
  }
  if (provider === "github") {
    if (!accessToken) return [];
    const res = await fetchImpl("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "copilotkit-explore",
      },
    });
    if (!res.ok) return [];
    const emails = (await res.json()) as GitHubEmail[];
    return emails.filter((e) => e.verified).map((e) => e.email);
  }
  return [];
}
