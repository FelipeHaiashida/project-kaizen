# Kaizen — Guia para desenvolvimento

Plataforma de gerenciamento de projetos/tarefas estilo ClickUp (Next.js). O PRD é a
fonte da verdade: `kaizen-prd.json` (implementar stories por prioridade, marcar `passes: true`).
Registrar aprendizados em `progress.txt` (ler a seção **Codebase Patterns** no topo).

## Stack (versões fixadas — não atualizar sem motivo)

- **Next.js 14.2** (App Router) + React 18 + TypeScript. Não migrar para Next 15 / React 19.
- **Tailwind CSS v3.4** + **shadcn/ui no estilo clássico** (Radix + variáveis HSL). Não é Tailwind v4.
- **Prisma v6** (`prisma-client-js`, provider postgresql). Não é Prisma 7.
- Auth: NextAuth.js v5 · Realtime/Storage: Supabase · Email: Resend · Deploy: Vercel.

## Convenções

- Rotas autenticadas em `app/(app)/`; públicas: `/login`, `/register`, `/invite/[token]`.
- Mutations via **Server Actions** (não REST). Validação com **Zod**.
- Cliente Prisma: importar `{ db }` de `lib/db.ts` (singleton). Nunca `new PrismaClient()` avulso.
- Tipos globais: importar de `@/types`. UI reutilizável em `components/ui/` (shadcn) e `components/`.
- Arquivos em kebab-case; componentes em PascalCase. Cor da marca: `#7C3AED`.

## Autenticação (NextAuth v5)

- Sessão: em Server Component use `const session = await auth()` (de `@/lib/auth`). Logout: `signOut({ redirectTo: "/login" })`.
- `lib/auth.config.ts` é edge-safe (usado no `middleware.ts`) — não importe Prisma/bcrypt nele. Provider de credenciais fica em `lib/auth.ts`.
- Rotas públicas: `/`, `/login`, `/register`, `/invite/*`. Todo o resto exige login (ver callback `authorized`). Área logada em `app/(app)/`.
- Senhas com `bcryptjs`. Componentes shadcn: escrever à mão no estilo clássico (não usar `npx shadcn add`).

## Workspaces (multi-tenant)

- "Workspace ativo" = cookie `kaizen.ws` (slug). Em Server Component use `getActiveWorkspace()` de `@/lib/workspace` → `{ workspace, role, memberships }` (ou `null` se o usuário não tem workspace).
- O shell logado (`app/(app)/layout.tsx`) redireciona pra `/onboarding` quem não tem workspace.
- Papéis: use `canManageWorkspaceRole`/`ROLE_LABELS` de `@/lib/roles` (puro, ok no client). `lib/workspace.ts` é server-only.
- Upload de imagem: `uploadImage(bucket, path, file)` de `@/lib/storage`. Buckets públicos: `avatars`, `workspace-logos`.
- Convites: `Invitation.email` null = link aberto (reusável); com email = uso único. Actions em `@/lib/actions/invitation`. Página pública `/invite/[token]`.
- Email: `sendInvitationEmail` de `@/lib/email` (Resend). **Modo teste só entrega ao email dono da conta Resend** — pra terceiros, verificar domínio e ajustar `EMAIL_FROM`. Nunca lança; sempre cheque `{ sent }`.

## Variáveis de ambiente

- `.env` → `DATABASE_URL`, `DIRECT_URL` (**o Prisma CLI só lê `.env`**).
- `.env.local` → segredos de app (NextAuth, Supabase, Resend), lido pelo Next.
- `.env.example` (versionado) documenta tudo. `.env`/`.env.local` são gitignored.

## Checks antes de commitar

```
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm run build       # next build
npm run format      # prettier --write .
```

Commits no formato: `feat: [S0X] - Título da story`.
