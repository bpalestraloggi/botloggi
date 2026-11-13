// Exige login para a página. As rotas /api/* fazem a própria checagem
// (o runtime do CopilotKit responde 401 sem sessão).
export { default } from "next-auth/middleware";

export const config = { matcher: ["/((?!api|_next|favicon.ico).*)"] };
