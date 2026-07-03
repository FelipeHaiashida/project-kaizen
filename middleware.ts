import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Middleware de proteção de rotas — usa a config edge-safe (sem Prisma/bcrypt).
// A lógica de quais rotas são públicas/protegidas está no callback `authorized`.
export default NextAuth(authConfig).auth;

export const config = {
  // Roda em todas as rotas, exceto assets estáticos, imagens e a API de auth.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
