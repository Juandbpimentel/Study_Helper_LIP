import { api } from "@/lib/api";
import { Usuario } from "@/lib/auth";
import { isAxiosError } from "axios";

type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

export const userService = {
  async getOfensiva(): Promise<ApiResponse<unknown>> {
    try {
      const res = await api.get<unknown>("/users/me/ofensiva");
      return { data: res.data ?? null, error: null };
    } catch (err: unknown) {
      let message = "Erro ao buscar ofensiva";
      if (isAxiosError(err)) {
        message = err.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      return {
        data: null,
        error: message,
      };
    }
  },

  async getById(id: number): Promise<ApiResponse<Usuario>> {
    try {
      const res = await api.get<Usuario>(`/users/${id}`);
      return { data: res.data ?? null, error: null };
    } catch (err: unknown) {
      let message = "Erro ao buscar usuário";
      if (isAxiosError(err)) {
        message = err.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      return {
        data: null,
        error: message,
      };
    }
  },

  async updateProfile(
    id: number,
    data: Partial<Usuario>
  ): Promise<ApiResponse<Usuario>> {
    try {
      const res = await api.patch<Usuario>(`/users/${id}`, data);
      return { data: res.data ?? null, error: null };
    } catch (err: unknown) {
      let message = "Erro ao atualizar perfil";
      if (isAxiosError(err)) {
        message = err.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      return {
        data: null,
        error: message,
      };
    }
  },

  async updatePreferences(
    id: number,
    data: unknown
  ): Promise<ApiResponse<Usuario>> {
    try {
      const res = await api.patch<Usuario>(`/users/${id}/preferences`, data);
      return { data: res.data ?? null, error: null };
    } catch (err: unknown) {
      let message = "Erro ao atualizar preferências";
      if (isAxiosError(err)) {
        message = err.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      return {
        data: null,
        error: message,
      };
    }
  },

  async deleteAccount(id: number): Promise<ApiResponse<void>> {
    try {
      await api.delete<void>(`/users/${id}`);
      return { data: undefined, error: null };
    } catch (err: unknown) {
      let message = "Erro ao excluir conta";
      if (isAxiosError(err)) {
        message = err.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      return {
        data: null,
        error: message,
      };
    }
  },
};
