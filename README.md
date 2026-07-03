# Kaizen 改善

Plataforma de gerenciamento de projetos e tarefas estilo ClickUp, para equipes internas. Multi-tenant (workspaces), com quadros Kanban, listas, calendário, comentários em tempo real, notificações e mais.

> **Status:** em desenvolvimento ativo. 18 de 19 histórias do PRD concluídas (relatórios e polish visual pendentes).

## ✨ Funcionalidades

- **Autenticação** por email/senha (NextAuth.js v5, senhas com bcrypt)
- **Workspaces multi-tenant** com papéis (Owner/Admin/Member) e convites por email ou link
- **Projetos** com listas, status customizáveis, tags, campos customizados e **épicos**
- **Tarefas**: prioridade, responsáveis, vencimento, subtarefas, descrição rich-text (TipTap), anexos
- **Visualizações**: Lista (agrupável, filtros, ordenação, seleção em lote), **Board Kanban** (drag-and-drop) e **Calendário**
- **Colaboração**: comentários com menções `@`, reações e **realtime** (Supabase Realtime)
- **Notificações** in-app em tempo real + preferências
- **Dashboard pessoal** ("Meu Trabalho"), **busca global** (Ctrl/Cmd+K) e **mural de avisos**

## 🛠️ Stack

- [Next.js 14](https://nextjs.org) (App Router) + TypeScript + React 18
- [Tailwind CSS](https://tailwindcss.com) v3 + [shadcn/ui](https://ui.shadcn.com) (estilo clássico, Radix)
- [Prisma](https://www.prisma.io) v6 + PostgreSQL ([Supabase](https://supabase.com))
- [NextAuth.js](https://authjs.dev) v5 · [Supabase](https://supabase.com) (Realtime + Storage) · [Resend](https://resend.com) (emails)
- Mutations via **Server Actions**, validação com **Zod**

## 🚀 Rodando localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente (ver .env.example)
#    - .env       → DATABASE_URL, DIRECT_URL (o Prisma CLI só lê .env)
#    - .env.local  → NextAuth, Supabase, Resend
cp .env.example .env.local

# 3. Sincronizar o schema com o banco
npx prisma db push

# 4. Rodar em desenvolvimento
npm run dev
```

Abre em [http://localhost:3000](http://localhost:3000).

### Variáveis de ambiente

Veja [`.env.example`](./.env.example) para a lista completa. Resumo:

| Variável | Onde | Descrição |
|----------|------|-----------|
| `DATABASE_URL`, `DIRECT_URL` | `.env` | Conexão PostgreSQL (pooler + direta) |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | `.env.local` | NextAuth.js |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` | Supabase (Realtime + Storage) |
| `RESEND_API_KEY`, `EMAIL_FROM` | `.env.local` | Envio de emails de convite |

## 🧰 Scripts

```bash
npm run dev         # servidor de desenvolvimento
npm run build       # build de produção
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm run format      # prettier --write .
npm run db:push     # prisma db push
```

## 📄 Licença

Uso interno. Todos os direitos reservados.
