import type { NextAuthConfig } from "next-auth";

/**
 * Configuração base do NextAuth — segura para o Edge Runtime (middleware).
 * NÃO importar Prisma nem bcrypt aqui: o provider de credenciais (que usa ambos)
 * é adicionado apenas em `lib/auth.ts`, usado no runtime Node.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      const isAuthPage = pathname === "/login" || pathname === "/register";
      const isPublic = pathname === "/" || isAuthPage || pathname.startsWith("/invite");

      // Já logado tentando acessar login/registro → manda para o dashboard
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      if (isPublic) return true;

      // Rota protegida: exige login (NextAuth redireciona para a página signIn)
      return isLoggedIn;
    },
    // Propaga o id do usuário para o token e a sessão
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
