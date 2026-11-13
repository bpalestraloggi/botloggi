// Fake Anthropic Messages API (streaming) com respostas roteirizadas.
const http = require("http");
const fs = require("fs");
const LOG = process.argv[2];

function sse(res, events) {
  res.writeHead(200, { "content-type": "text/event-stream" });
  for (const e of events) res.write(`event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`);
  res.end();
}
const start = { type: "message_start", message: { id: "msg_" + Date.now(), type: "message", role: "assistant", model: "fake", content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } } };
const end = (reason) => [
  { type: "message_delta", delta: { stop_reason: reason, stop_sequence: null }, usage: { output_tokens: 1 } },
  { type: "message_stop" },
];
const text = (t) => [start,
  { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
  { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: t } },
  { type: "content_block_stop", index: 0 }, ...end("end_turn")];
const tool = (name, input) => [start,
  { type: "content_block_start", index: 0, content_block: { type: "tool_use", id: "toolu_" + Date.now(), name, input: {} } },
  { type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: JSON.stringify(input) } },
  { type: "content_block_stop", index: 0 }, ...end("tool_use")];

http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const b = JSON.parse(body || "{}");
    const tools = (b.tools || []).map((t) => t.name);
    const last = (b.messages || []).at(-1) || {};
    const blocks = Array.isArray(last.content) ? last.content : [{ type: "text", text: last.content }];
    const toolResult = blocks.find((x) => x.type === "tool_result");
    const userText = blocks.filter((x) => x.type === "text").map((x) => x.text).join(" ").toLowerCase();
    fs.appendFileSync(LOG, JSON.stringify({ tools, hasSystem: !!b.system, last: toolResult ? "tool_result" : userText }) + "\n");

    if (toolResult) {
      const c = typeof toolResult.content === "string" ? toolResult.content : JSON.stringify(toolResult.content);
      return sse(res, text("RESULTADO: " + c.slice(0, 300)));
    }
    if (userText.includes("catálogo")) return sse(res, tool("searchUseCaseCatalog", { area: "Financeiro" }));
    if (userText.includes("remova")) return sse(res, tool("removeUseCase", { area: "Financeiro", useCase: "Cálculos" }));
    if (userText.includes("adicione")) return sse(res, tool("addUseCase", { area: "Jurídico", useCase: "Revisão de contratos" }));
    if (userText.includes("mcp")) {
      const t = tools.find((n) => n.includes("headcount"));
      return t ? sse(res, tool(t, { area: "Vendas" })) : sse(res, text("SEM TOOL MCP"));
    }
    sse(res, text("olá"));
  });
}).listen(4010, () => console.log("fake anthropic on 4010"));
