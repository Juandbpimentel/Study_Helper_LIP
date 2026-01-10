import { api } from "@/lib/api";
import { TemaDeEstudo } from "@/types/types";

export const subjectService = {
  async getAll() {
    return api.get<TemaDeEstudo[]>("/themes");
  },

  async create(data: { tema: string; cor: string; descricao?: string }) {
    return api.post<TemaDeEstudo>("/themes", data);
  },

  async delete(id: number) {
    return api.delete(`/themes/${id}`);
  },

  async update(id: number, data: Partial<TemaDeEstudo>) {
    return api.patch<TemaDeEstudo>(`/themes/${id}`, data);
  },
};
