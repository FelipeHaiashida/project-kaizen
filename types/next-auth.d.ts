import type { DefaultSession } from "next-auth";

// Adiciona o `id` do usuário à sessão e ao JWT.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
