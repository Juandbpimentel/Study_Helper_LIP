# Configuração de Autenticação com Cookies - Frontend

Este guia explica como usar autenticação baseada em cookies no frontend Next.js.

## 🔑 Conceitos Principais

### Por que Cookies?
- **Segurança**: Cookies `HttpOnly` não podem ser acessados por JavaScript, protegendo contra XSS
- **Simplicidade**: O navegador envia o cookie automaticamente em todas as requisições
- **Sem código extra**: Não precisa gerenciar tokens manualmente no `localStorage`

## 📁 Estrutura Criada

```
src/
├── lib/
│   ├── api.ts          # Cliente HTTP com suporte a cookies
│   └── auth.ts         # Serviço de autenticação
└── app/
    ├── login/
    │   └── page.tsx    # Página de login
    └── dashboard/
        └── page.tsx    # Página protegida (exemplo)
```

## 🚀 Como Funciona

### 1. Cliente API (`src/lib/api.ts`)

Usa **Axios** com a opção `withCredentials: true`:

```typescript
axios.create({
  baseURL: API_URL,
  withCredentials: true, // Envia cookies automaticamente
  // ...
});
```

**Vantagens do Axios:**
- ✅ Interceptors para tratamento automático de erros
- ✅ Redirecionamento automático para login em caso de 401
- ✅ Sintaxe mais limpa que fetch
- ✅ Suporte nativo a timeout e cancelamento

### 2. Serviço de Autenticação (`src/lib/auth.ts`)

Métodos disponíveis:
- `login()` - Faz login e recebe o cookie
- `logout()` - Remove o cookie
- `getProfile()` - Busca dados do usuário (usa cookie automaticamente)
- `changePassword()` - Troca senha e recebe novo cookie
- `changeEmail()` - Troca email e recebe novo cookie

### 3. Uso nas Páginas

**Login:**
```typescript
const result = await authService.login({ email, password });
if (!result.error) {
  // Cookie foi definido automaticamente!
  window.location.href = '/dashboard';
}
```

**Página Protegida:**
```typescript
const result = await authService.getProfile();
// O cookie é enviado automaticamente, sem código extra!
```

## ⚙️ Configuração Necessária

### Backend (NestJS)

O backend já está configurado em `src/main.ts`:

```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true, // Permite cookies
});
```

### Frontend (Next.js)

Certifique-se de que o `.env` está configurado:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 🧪 Testando

1. **Inicie o backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Inicie o frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Acesse:**
   - Login: http://localhost:3000/login
   - Dashboard: http://localhost:3000/dashboard

## 🔒 Segurança

### Configuração do Cookie (Backend)

O backend define o cookie com as seguintes flags:

```typescript
res.cookie('access_token', token, {
  httpOnly: true,    // JavaScript não pode ler
  secure: false,     // true em produção (HTTPS)
  sameSite: 'lax',   // Proteção contra CSRF
  expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 dia
});
```

### CORS

O CORS está configurado para aceitar apenas requisições do frontend:

```typescript
origin: 'http://localhost:3000',
credentials: true,
```

## 📝 Diferenças vs LocalStorage

| Aspecto | Cookies (HttpOnly) | LocalStorage |
|---------|-------------------|--------------|
| **Código Frontend** | Mais simples (automático) | Mais complexo (manual) |
| **Segurança XSS** | ✅ Protegido | ❌ Vulnerável |
| **Configuração** | Mais trabalhosa (CORS) | Mais simples |
| **Envio Automático** | ✅ Sim | ❌ Não |

## 🎯 Próximos Passos

1. **Adicionar proteção CSRF** (se necessário)
2. **Implementar refresh tokens** (para sessões longas)
3. **Criar middleware de autenticação** (para proteger rotas automaticamente)
4. **Adicionar loading states globais** (Context API ou Zustand)

## 🐛 Troubleshooting

### Cookie não está sendo salvo

1. Verifique se o CORS está configurado com `credentials: true`
2. Verifique se o frontend usa `credentials: 'include'`
3. Verifique se o domínio/porta estão corretos
4. Abra DevTools → Application → Cookies e veja se o cookie aparece

### Erro de CORS

Certifique-se de que o backend tem:
```typescript
app.enableCors({
  origin: 'http://localhost:3000', // URL exata do frontend
  credentials: true,
});
```
