import { ApiResponse, api } from "@/lib/api";
import { RegistroEstudo } from "@/types/types";
import { inferTipoRegistro, mapRegistroFromApi } from "@/lib/mappers";
import { isAxiosError } from "axios";

export type CreateRegistroInput = {
  tempo_dedicado: number;
  conteudo_estudado?: string;
  anotacoes?: string;
  data_estudo?: string;
  tipo_registro?: string;
  tema_id?: number;
  slot_id?: number;
  revisao_programada_id?: number;
};

export const studyService = {
  async getAll(): Promise<ApiResponse<RegistroEstudo[]>> {
    const result = await api.get<unknown>("/registros");
    if (result.error)
      return { error: result.error, statusCode: result.statusCode };

    const raw = Array.isArray(result.data) ? result.data : [];
    return { data: raw.map((item) => mapRegistroFromApi(item)) };
  },

  async create(
    data: CreateRegistroInput
  ): Promise<ApiResponse<RegistroEstudo>> {
    const payload: Record<string, unknown> = {
      tipoRegistro: inferTipoRegistro(data.tipo_registro, {
        temaId: data.tema_id,
        slotId: data.slot_id,
        revisaoProgramadaId: data.revisao_programada_id,
      }),
      tempoDedicado: data.tempo_dedicado,
    };

    if (typeof data.conteudo_estudado === "string" && data.conteudo_estudado) {
      payload.conteudoEstudado = data.conteudo_estudado;
    }
    if (typeof data.anotacoes === "string" && data.anotacoes) {
      payload.anotacoes = data.anotacoes;
    }
    if (typeof data.data_estudo === "string" && data.data_estudo) {
      payload.dataEstudo = data.data_estudo;
    }
    if (typeof data.tema_id === "number" && data.tema_id > 0) {
      payload.temaId = data.tema_id;
    }
    if (typeof data.slot_id === "number" && data.slot_id > 0) {
      payload.slotId = data.slot_id;
    }
    if (
      typeof data.revisao_programada_id === "number" &&
      data.revisao_programada_id > 0
    ) {
      payload.revisaoProgramadaId = data.revisao_programada_id;
    }

    const result = await api.post<unknown>("/registros", payload);
    if (result.error)
      return { error: result.error, statusCode: result.statusCode };
    if (!result.data) return { error: "Resposta vazia do servidor." };
    return { data: mapRegistroFromApi(result.data) };
  },

  async getById(id: number): Promise<ApiResponse<RegistroEstudo>> {
    const res = await api.get<unknown>(`/registros/${id}`);
    if (res.error) return { error: res.error, statusCode: res.statusCode };
    if (!res.data) return { error: "Registro não encontrado" };
    return { data: mapRegistroFromApi(res.data) };
  },

  async deleteAll(): Promise<ApiResponse<void>> {
    try {
      await api.delete<void>(`/registros`);
      return { data: undefined, error: null };
    } catch (err: unknown) {
      let message = "Erro ao apagar registros";
      if (isAxiosError(err)) {
        message = err.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      return { data: null, error: message };
    }
  },
};
