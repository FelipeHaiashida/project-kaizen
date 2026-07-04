# Deploy do Kaizen (Vercel + Supabase) — passo a passo mínimo

O código já está **pronto para produção**:

- `build` roda `prisma generate && next build` e `postinstall` regenera o Prisma Client na Vercel.
- NextAuth já usa `trustHost: true` → **não precisa** de `NEXTAUTH_URL` na Vercel (auto-detectado).
- `DATABASE_URL` já usa o pooler pgBouncer (porta 6543), ideal para funções serverless.
- A build de produção foi validada localmente com sucesso.

## O que você precisa fazer (≈3 min)

1. Acesse **https://vercel.com** e faça login com o GitHub.
2. **Add New → Project** e importe o repositório `FelipeHaiashida/project-kaizen`.
3. Na etapa **Environment Variables**, abra o arquivo local **`.env.vercel.local`**
   (gerado na raiz do projeto, já com todos os valores) e **cole o conteúdo inteiro**
   na caixa de import — a Vercel reconhece o formato `CHAVE=valor` e importa tudo de uma vez.
4. Clique em **Deploy**. Pronto.

> Framework/Build/Output: deixe no automático — a Vercel detecta Next.js sozinha.

## Variáveis (já reunidas em `.env.vercel.local`)

| Variável | Origem |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | Supabase (pooler 6543 / direta 5432) |
| `NEXTAUTH_SECRET` | segredo do NextAuth |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase API |
| `RESEND_API_KEY`, `EMAIL_FROM` | Resend (emails de convite) |

`NEXTAUTH_URL` e `GOOGLE_CLIENT_*` **não são necessários** (auto-detect + provider Google não usado).

## Depois do primeiro deploy

- **Email (Resend):** em modo teste só entrega ao email dono da conta Resend. Para convidar
  terceiros, verifique um domínio no Resend e ajuste `EMAIL_FROM`.
- **Domínio:** a Vercel dá um `*.vercel.app` grátis com HTTPS. Domínio próprio é opcional.
- **Supabase free** pausa o projeto após ~1 semana sem uso — basta reativar no painel.

## Deploy automático

Depois de conectado, **todo push na branch `main` re-deploya sozinho** — zero trabalho manual.
