import { ApiResponse, api } from "@/lib/api";
import { Revisao } from "@/types/types";
import { mapRevisaoFromApi } from "@/lib/mappers";

export const reviewService = {
  async getAll(): Promise<ApiResponse<Revisao[]>> {
    const result = await api.get<unknown>("/revisoes");
    if (result.error)
      return { error: result.error, statusCode: result.statusCode };

    const raw = Array.isArray(result.data) ? result.data : [];
    return { data: raw.map((item) => mapRevisaoFromApi(item)) };
  },

  async complete(id: number): Promise<ApiResponse<Revisao>> {
    // O backend exige tempoDedicado. Mantemos simples com um default.
    const result = await api.patch<unknown>(`/revisoes/${id}/concluir`, {
      tempoDedicado: 30,
    });
    if (result.error)
      return { error: result.error, statusCode: result.statusCode };
    if (!result.data) return { error: "Resposta vazia do servidor." };
    return { data: mapRevisaoFromApi(result.data) };
  },
};
