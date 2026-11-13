const { chromium } = require("playwright");
const OUT = process.argv[2];

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const users = new Set();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("request", (r) => {
    if (r.url().includes("/api/copilotkit") && r.method() === "POST") users.add(r.headers()["x-demo-user"]);
  });
  await p.goto("http://localhost:3123", { waitUntil: "networkidle" });
  const input = p.getByPlaceholder("Type a message...");
  const send = async (msg) => { await input.fill(msg); await input.press("Enter"); };
  const result = {};

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
  await p.screenshot({ path: OUT + "/hitl.png" });
  await btn.click();
  await p.getByText(/RESULTADO: .*Removido/).first().waitFor({ timeout: 30000 });
  const after = await p.locator("main li", { hasText: /^Cálculos$/ }).count();
  result.hitl = { before, after };

  // 4) MCP
  await send("use o mcp");
  await p.getByText(/HEADCOUNT Vendas: 42/).first().waitFor({ timeout: 30000 });
  result.mcp = "ok";
  await p.screenshot({ path: OUT + "/final.png" });

  // 5) Identidade: troca de usuário
  await p.selectOption("select", "carla");
  await p.getByPlaceholder("Type a message...").fill("oi");
  await p.getByPlaceholder("Type a message...").press("Enter");
  await p.getByText("olá").first().waitFor({ timeout: 30000 });
  result.users = [...users];
  result.errors = errs;
  console.log(JSON.stringify(result, null, 2));
  await b.close();
})().catch(async (e) => { console.error("FAIL:", e.message); process.exit(1); });
