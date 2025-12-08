import { api } from "./api";

export type DiaSemana = "Dom" | "Seg" | "Ter" | "Qua" | "Qui" | "Sex" | "Sab";

export interface Usuario {
  id: number;
  email: string;
  nome?: string | null;
  isAdmin?: boolean;
  versaoToken?: string;
  primeiroDiaSemana: DiaSemana | null;
  planejamentoRevisoes: number[];
}

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface RegisterData {
  email: string;
  senha: string;
  nome?: string;
}

export interface ChangePasswordData {
  senhaAtual: string;
  novaSenha: string;
}

export interface ChangeEmailData {
  novoEmail: string;
  senha: string;
}

export interface UpdateProfileData {
  nome: string;
  primeiroDiaSemana: DiaSemana;
  planejamentoRevisoes: number[];
}

const mapDiaSemanaLabel: Record<string, DiaSemana> = {
  Domingo: "Dom",
  Segunda: "Seg",
  Terça: "Ter",
  Quarta: "Qua",
  Quinta: "Qui",
  Sexta: "Sex",
  Sábado: "Sab",
};

export function toDiaSemana(value: string): DiaSemana | null {
  if (!value) return null;
  const normalized = value.trim();
  return (
    (mapDiaSemanaLabel[normalized] as DiaSemana) ?? (normalized as DiaSemana)
  );
}

export const authService = {
  // Login - O cookie é definido automaticamente pelo backend
  async login(credentials: LoginCredentials) {
    return api.post<{ message: string }>("/auth/login", credentials);
  },

  // Logout - Remove o cookie
  async logout() {
    return api.post<{ message: string }>("/auth/logout");
  },

  // Registro
  async register(data: RegisterData) {
    return api.post<Usuario>("/auth/register", data);
  },

  // Buscar perfil do usuário logado (usa o cookie automaticamente)
  async getProfile() {
    return api.get<Usuario>("/auth/profile").catch((error) => {
      return Promise.reject(error);
    });
  },

  // Trocar senha - Retorna novo cookie automaticamente
  async changePassword(data: ChangePasswordData) {
    return api.patch<{ message: string }>("/auth/change-password", {
      senhaAntiga: data.senhaAtual,
      novaSenha: data.novaSenha,
    });
  },

  // Trocar email - Retorna novo cookie automaticamente
  async changeEmail(data: ChangeEmailData) {
    return api.patch<{ message: string }>("/auth/change-email", {
      novoEmail: data.novoEmail,
      senha: data.senha,
    });
  },
};

export const userService = {
  async updateProfile(id: number, data: UpdateProfileData) {
    return api.patch<Usuario>(`/users/${id}`, data);
  },
};
