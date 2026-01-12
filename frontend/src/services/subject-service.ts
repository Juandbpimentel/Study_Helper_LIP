import { ApiResponse, api } from "@/lib/api";
import { TemaDeEstudo } from "@/types/types";
import { mapThemeFromApi } from "@/lib/mappers";

export const subjectService = {
  async getAll(): Promise<ApiResponse<TemaDeEstudo[]>> {
    const result = await api.get<unknown>("/themes");
    if (result.error)
      return { error: result.error, statusCode: result.statusCode };

    const raw = Array.isArray(result.data) ? result.data : [];
    return { data: raw.map((item) => mapThemeFromApi(item)) };
  },

  async create(data: {
    tema: string;
    cor: string;
    descricao?: string;
  }): Promise<ApiResponse<TemaDeEstudo>> {
    const result = await api.post<unknown>("/themes", data);
    if (result.error)
      return { error: result.error, statusCode: result.statusCode };
    if (!result.data) return { error: "Resposta vazia do servidor." };
    return { data: mapThemeFromApi(result.data) };
  },

  async delete(id: number): Promise<ApiResponse<unknown>> {
    return api.delete(`/themes/${id}`);
  },

  async update(
    id: number,
    data: Partial<TemaDeEstudo>
  ): Promise<ApiResponse<TemaDeEstudo>> {
    const payload: Record<string, unknown> = {};
    if (typeof data.tema === "string") payload.tema = data.tema;
    if (typeof data.cor === "string") payload.cor = data.cor;
    if (typeof data.descricao === "string") payload.descricao = data.descricao;

    const result = await api.patch<unknown>(`/themes/${id}`, payload);
    if (result.error)
      return { error: result.error, statusCode: result.statusCode };
    if (!result.data) return { error: "Resposta vazia do servidor." };
    return { data: mapThemeFromApi(result.data) };
  },
};
