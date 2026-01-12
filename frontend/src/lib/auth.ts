import { api } from "./api";
import { clearAccessToken, setAccessToken } from "./token";

export type DiaSemana = "Dom" | "Seg" | "Ter" | "Qua" | "Qui" | "Sex" | "Sab";

export interface Usuario {
  id: number;
  email: string;
  nome?: string | null;
  isAdmin?: boolean;
  versaoToken?: string;
  primeiroDiaSemana: DiaSemana | null;
  planejamentoRevisoes: number[];
  metaDiaria?: number | null;
}

export interface UpdateProfileData {
  nome: string;
  primeiroDiaSemana: DiaSemana;
  planejamentoRevisoes: number[];
  metaDiaria?: number;
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

type AuthSuccessResponse = {
  message: string;
  access_token: string;
  user: Usuario;
  // Campos adicionais vindos do backend (ex.: ofensiva/googleCalendar)
  [key: string]: unknown;
};

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
  // Login - token-only: salva access_token no localStorage
  async login(credentials: LoginCredentials) {
    const result = await api.post<AuthSuccessResponse>(
      "/auth/login",
      credentials
    );
    if (result.data?.access_token) {
      setAccessToken(result.data.access_token);
    }
    return result;
  },

  // Logout - token-only: limpa o token local
  async logout() {
    const result = await api.post<{ message: string }>("/auth/logout");
    clearAccessToken();
    return result;
  },

  // Registro
  async register(data: RegisterData) {
    const result = await api.post<AuthSuccessResponse>("/auth/register", data);
    if (result.data?.access_token) {
      setAccessToken(result.data.access_token);
    }
    return result;
  },

  // Buscar perfil do usuário logado (usa o cookie automaticamente)
  async getProfile() {
    return api.get<Usuario>("/auth/profile").catch((error) => {
      return Promise.reject(error);
    });
  },

  // Trocar senha - Retorna novo cookie automaticamente
  async changePassword(data: ChangePasswordData) {
    const result = await api.patch<AuthSuccessResponse>(
      "/auth/change-password",
      {
        senhaAntiga: data.senhaAtual,
        novaSenha: data.novaSenha,
      }
    );
    if (result.data?.access_token) {
      setAccessToken(result.data.access_token);
    }
    return result;
  },

  // Trocar email - Retorna novo cookie automaticamente
  async changeEmail(data: ChangeEmailData) {
    const result = await api.patch<AuthSuccessResponse>("/auth/change-email", {
      novoEmail: data.novoEmail,
      senha: data.senha,
    });
    if (result.data?.access_token) {
      setAccessToken(result.data.access_token);
    }
    return result;
  },
};

export const userService = {
  async updateProfile(id: number, data: UpdateProfileData) {
    return api.patch<Usuario>(`/users/${id}`, data);
  },
};
