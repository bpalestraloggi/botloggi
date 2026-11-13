const { chromium } = require("playwright");
const OUT = process.argv[2];
const BASE = "http://localhost:3123";

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  const result = {};

  // 0) Sem sessão: página redireciona para o login e a API responde 401,
  //    mesmo com o antigo header de demo.
  const unauth = await p.request.get(`${BASE}/api/copilotkit/info`, {
    headers: { "x-demo-user": "ana" },
  });
  await p.goto(BASE);
  result.unauthenticated = { api: unauth.status(), redirectedTo: new URL(p.url()).pathname };

  const login = async (name) => {
    await p.goto(`${BASE}/api/auth/signin`);
    await p.fill('input[name="username"]', name);
    await p.getByRole("button", { name: /Dev/ }).click();
    await p.waitForURL(`${BASE}/`);
    await p.getByText(`Conectado como ${name}`).waitFor();
  };
  const send = async (msg) => {
    const input = p.getByPlaceholder("Type a message...");
    await input.fill(msg);
    await input.press("Enter");
  };
  const threads = async () =>
    (await (await p.request.get(`${BASE}/api/copilotkit/threads?agentId=default`)).json()).threads.map(
      (t) => t.createdById,
    );

  await login("ana");

  // 1) Tool no servidor
  await send("consulte o catálogo de Financeiro");
  await p.getByText(/RESULTADO: .*Concilia/).first().waitFor({ timeout: 30000 });
  result.serverTool = "ok";

  // 2) Frontend tool + generative UI
  await send("adicione revisão de contratos");
  await p.locator("main li.new", { hasText: "Revisão de contratos" }).waitFor({ timeout: 30000 });
  result.frontendTool = "ok";

  // 3) Human-in-the-loop
  await send("remova cálculos");
  const btn = p.getByRole("button", { name: "Remover" });
  await btn.waitFor({ timeout: 30000 });
  const before = await p.locator("main li", { hasText: /^Cálculos$/ }).count();
  await btn.click();
  await p.getByText(/RESULTADO: .*Removido/).first().waitFor({ timeout: 30000 });
  const after = await p.locator("main li", { hasText: /^Cálculos$/ }).count();
  result.hitl = { before, after };

  // 4) MCP
  await send("use o mcp");
  await p.getByText(/HEADCOUNT Vendas: 42/).first().waitFor({ timeout: 30000 });
  result.mcp = "ok";
  await p.screenshot({ path: OUT + "/final.png" });
  const anaThreads = await threads();

  // 5) Logout + outra conta: só enxerga as próprias threads
  await p.getByRole("button", { name: "Sair" }).click();
  await p.waitForURL(/\/api\/auth\/signin/);
  await login("carla");
  await send("oi");
  await p.getByText("olá").first().waitFor({ timeout: 30000 });
  result.threads = { ana: anaThreads, carla: await threads() };

  result.errors = errs;
  console.log(JSON.stringify(result, null, 2));
  await b.close();
})().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
