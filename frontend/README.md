# Study Helper - Frontend

Frontend da aplicação Study Helper, desenvolvido com **Next.js 15** e **Node.js 24**.

## 🛠️ Tecnologias

-   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
-   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
-   **Runtime:** [Node.js 24](https://nodejs.org/)
-   **Estilização:** [Tailwind CSS 4](https://tailwindcss.com/)
-   **Biblioteca UI:** [React 19](https://react.dev/)

## 📁 Estrutura do Projeto

```
src/
└── app/                 # App Router (Páginas e Layouts)
    ├── layout.tsx       # Layout raiz
    └── page.tsx         # Página inicial
```

## 🚀 Como Rodar

### Pré-requisitos
-   Node.js 24+

### Passo a Passo

1.  **Configurar Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do diretório `frontend`:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8080
    ```

2.  **Instalar Dependências:**
    ```bash
    npm install
    ```

3.  **Iniciar o Servidor de Desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em: `http://localhost:3000`

## 🧪 Testes e Qualidade

-   **Linting:** `npm run lint`
-   **Type Check:** `npx tsc --noEmit`
-   **Build:** `npm run build`
-   **CI/CD:** Pipelines configurados no GitHub Actions para validação de Pull Requests e Deploy automático.

## 📦 Scripts

-   `npm run dev`: Inicia o servidor de desenvolvimento.
-   `npm run build`: Cria o build de produção.
-   `npm run start`: Inicia o servidor de produção.
-   `npm run lint`: Executa a verificação de lint.
