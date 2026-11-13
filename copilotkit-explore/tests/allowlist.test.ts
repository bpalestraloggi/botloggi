import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowed, parseAllowedEmails, verifiedEmailsFor } from "../lib/allowlist.ts";

const allowed = parseAllowedEmails(" Ana@Exemplo.com , bob@exemplo.com,, ");

test("parse normaliza, remove vazios", () => {
  assert.deepEqual([...allowed], ["ana@exemplo.com", "bob@exemplo.com"]);
});

test("lista vazia bloqueia todo mundo", () => {
  assert.equal(isAllowed(["ana@exemplo.com"], parseAllowedEmails("")), false);
  assert.equal(isAllowed(["ana@exemplo.com"], parseAllowedEmails(undefined)), false);
});

test("comparação exata, sem diferenciar maiúsculas", () => {
  assert.equal(isAllowed(["ANA@exemplo.com"], allowed), true);
  assert.equal(isAllowed(["ana@exemplo.com.evil.io"], allowed), false);
  assert.equal(isAllowed(["xana@exemplo.com"], allowed), false);
  assert.equal(isAllowed([], allowed), false);
});

test("google: só aceita e-mail verificado", async () => {
  assert.deepEqual(await verifiedEmailsFor("google", { email: "ana@exemplo.com", email_verified: true }, undefined), ["ana@exemplo.com"]);
  assert.deepEqual(await verifiedEmailsFor("google", { email: "ana@exemplo.com", email_verified: false }, undefined), []);
  assert.deepEqual(await verifiedEmailsFor("google", { email: "ana@exemplo.com" }, undefined), []);
});

const fakeFetch = (status: number, body: unknown) =>
  (async (_url: string, init?: RequestInit) => {
    assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer tok");
    return new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;

test("github: usa só e-mails verificados de /user/emails", async () => {
  const f = fakeFetch(200, [
    { email: "ana@exemplo.com", verified: false },
    { email: "pessoal@gmail.com", verified: true },
  ]);
  const emails = await verifiedEmailsFor("github", { email: "ana@exemplo.com" }, "tok", f);
  assert.deepEqual(emails, ["pessoal@gmail.com"]);
  assert.equal(isAllowed(emails, allowed), false); // e-mail do perfil não verificado não conta
});

test("github: erro na API ou sem token bloqueia", async () => {
  assert.deepEqual(await verifiedEmailsFor("github", {}, "tok", fakeFetch(403, {})), []);
  assert.deepEqual(await verifiedEmailsFor("github", {}, undefined), []);
});

test("provedor desconhecido não tem e-mail verificado", async () => {
  assert.deepEqual(await verifiedEmailsFor("outro", { email: "ana@exemplo.com", email_verified: true }, "tok"), []);
});
