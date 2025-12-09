### Backend – GitHub Actions

#### Development

- Secrets:
  - `DATABASE_URL` (pode ser dummy só para `prisma generate`/`build`).
  - `DIRECT_URL` (opcional em dev; necessária se rodar migrations no runner).
  - `JWT_SECRET`
  - `FRONTEND_URL` (ex.: `http://localhost:3000` ou URL do front dev).
  - `DEV_APP_URL` : `https://study-helper-lip.onrender.com`
  - `BACKEND_DEPLOY_HOOK_URL_DEV` (se usar hook de deploy).
- Passo a passo: Settings → Secrets and variables → Actions → New repository secret → Name/Value → Add secret.

#### Production

- Secrets:
  - `DATABASE_URL` (pool real, porta 6543, `?pgbouncer=true`).
  - `DIRECT_URL` (conexão direta para migrations, porta 5432).
  - `JWT_SECRET`
  - `FRONTEND_URL` (origem do front prod, ex.: `https://app.suaempresa.com`).
  - `PROD_APP_URL`
  - `BACKEND_DEPLOY_HOOK_URL_PROD`
- Mesmo passo a passo para criação.

**Notas CI**

- Em build/test, use `DATABASE_URL` dummy para `prisma generate`/`npm run build`.
- Para migrations no deploy, o runner/serviço precisa das envs reais (`DATABASE_URL` + `DIRECT_URL` ou `PRISMA_MIGRATE_DIRECT_URL`).

---

### Backend – Render (serviço Node/Nest)

#### Development

- Environment:
  - `DATABASE_URL` (pool dev; se usar Supabase: porta 6543 + `?pgbouncer=true`).
  - `DIRECT_URL` (direta 5432, sem pgbouncer; para migrations).
  - `JWT_SECRET`
  - `FRONTEND_URL` (origem do front dev).
  - (Opcional) `NODE_ENV=development`.
- Port: deixe em branco (Render injeta `PORT`).

#### Production

- Environment:
  - `DATABASE_URL` (pool prod; 6543 + `?pgbouncer=true`).
  - `DIRECT_URL` (direta 5432).
  - `JWT_SECRET`
  - `FRONTEND_URL` (origem do front prod).
  - (Opcional) `NODE_ENV=production`.
- Port: deixe em branco.

---

### Frontend – GitHub Actions (Netlify)

#### Development

- Secrets:
  - `API_URL_DEV`
  - `DEV_FRONTEND_URL` (usada como URL do environment do deploy dev).
  - `ANALYTICS_ID_DEV` (se houver)
  - `NETLIFY_SITE_ID_DEV` (site dev no Netlify)
  - `NETLIFY_AUTH_TOKEN` (token com permissão de deploy)
  - Outros `NEXT_PUBLIC_*` que forem necessários em build dev.

#### Production

- Secrets:
  - `API_URL_PROD`
  - `PROD_FRONTEND_URL` (URL do environment do deploy prod)
  - `ANALYTICS_ID_PROD`
  - `SENTRY_DSN_PROD`
  - `NETLIFY_SITE_ID_PROD` (site prod no Netlify)
  - `NETLIFY_AUTH_TOKEN` (mesmo token pode servir para ambos)
  - Demais `NEXT_PUBLIC_*` específicos de prod.

Passos de criação: Settings → Secrets and variables → Actions → New repository secret.

---

### Frontend – Netlify (host)

#### Development (Site Dev ou Deploy Preview)

- Environment variables no Netlify (Site settings → Environment):
  - `NEXT_PUBLIC_API_URL` = URL da API dev
  - Demais `NEXT_PUBLIC_*` (analytics dev, etc.)
- Build/Publish (quando base dir = `frontend`):
  - Build command: `npm run build` (ou `next build` conforme seu package)
  - Publish directory: use `.next` se for SSR com Next no Netlify; use `out` se fizer `next export` (estático)
  - Functions directory: deixe vazio se não usa funções; se usar runtime do Netlify, normalmente `.netlify/functions` (sem prefixar `frontend/` quando o base dir já é `frontend`).

#### Production (Site Prod)

- Environment variables no Netlify:
  - `NEXT_PUBLIC_API_URL` = URL da API prod
  - Outras `NEXT_PUBLIC_*` de prod (analytics, Sentry DSN, etc.)
- Build/Publish: mesma regra — `.next` para SSR ou `out` para export estático.

---

### Dicas rápidas

- Prisma 7: `schema.prisma` sem `url`; `prisma.config.ts` com `datasource.url = env('DATABASE_URL')`. `DIRECT_URL` fica só na env; migrations podem ler `DIRECT_URL`/`PRISMA_MIGRATE_DIRECT_URL`.
- CI sem banco: `DATABASE_URL` dummy em `prisma generate`/`build`; migrations reais só no deploy com envs reais.
- CORS: mantenha `FRONTEND_URL` configurado no backend (`enableCors`).
