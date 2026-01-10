import { api } from "@/lib/api";
import { Revisao } from "@/types/types";

export const reviewService = {
  async getAll() {
    return api.get<Revisao[]>("/revisoes");
  },

  async complete(id: number) {
    return api.patch(`/revisoes/${id}/concluir`);
  },
};
