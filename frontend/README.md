# Frontend - Study Helper 🎨

Interface web com Next.js 15, React 19 e TypeScript.

## Quick Start

```bash
npm install
npm run dev
```

**Acesso:** http://localhost:3000

## Estrutura

```
frontend/
├── src/app/
│   ├── layout.tsx           # Layout raiz
│   ├── page.tsx             # Página inicial
│   └── globals.css          # Estilos globais
├── public/                  # Arquivos estáticos
├── .env.example            # Variáveis de ambiente
└── next.config.ts          # Configuração
```

## Comandos

```bash
# Desenvolvimento
npm run dev                  # Hot reload
npm run build               # Build produção
npm run start               # Executar build
npm run lint                # Verificar código
```

## Configuração

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

Para customizar:
```bash
cp .env.example .env.local
# Edite .env.local
```

## Tecnologias

- Next.js 15
- React 19
- TypeScript 5
- Tailwind CSS 3
- ESLint 9

## CI/CD

Workflows automáticos em `.github/workflows/`:
- ✅ Lint e build em PRs
- ✅ Deploy automático no Netlify
- ✅ Preview em PRs

**Deploy:**
- `dev` → Netlify DEV
- `main` → Netlify PROD

## Troubleshooting

```bash
# Limpar cache
rm -rf .next node_modules
npm install

# Porta 3000 ocupada
PORT=3001 npm run dev

# Verificar tipos
npx tsc --noEmit

# Fix lint
npm run lint -- --fix
```

## Docs

- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
