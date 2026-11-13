// Servidor MCP mínimo (Streamable HTTP, stateless) com uma tool.
const NM = process.argv[2]; // caminho do node_modules do projeto
const { McpServer } = await import(`${NM}/@modelcontextprotocol/sdk/dist/esm/server/mcp.js`);
const { StreamableHTTPServerTransport } = await import(`${NM}/@modelcontextprotocol/sdk/dist/esm/server/streamableHttp.js`);
const { z } = await import(`${NM}/zod/index.js`);
const http = await import("node:http");

function build() {
  const server = new McpServer({ name: "demo", version: "1.0.0" });
  server.registerTool(
    "get_headcount",
    { description: "Retorna o número de pessoas de uma área", inputSchema: { area: z.string() } },
    async ({ area }) => ({ content: [{ type: "text", text: `HEADCOUNT ${area}: 42` }] }),
  );
  return server;
}

http.createServer(async (req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", async () => {
    const server = build();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => { transport.close(); server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, body ? JSON.parse(body) : undefined);
  });
}).listen(4020, () => console.log("mcp on 4020"));
