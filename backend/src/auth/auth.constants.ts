// Legacy: usado quando a autenticação era baseada em cookies.
// Mantido por compatibilidade interna/refs antigas, mas não deve mais ditar o contrato do JSON.
export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'access_token';

// Contrato atual (token-only): nome fixo do campo no JSON de auth.
export const AUTH_ACCESS_TOKEN_FIELD = 'access_token' as const;
