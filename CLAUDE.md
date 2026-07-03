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
