import { api } from "@/lib/api";
import { RegistroEstudo } from "@/types/types";

export const studyService = {
  async getAll() {
    return api.get<RegistroEstudo[]>("/registros");
  },

  async create(data: RegistroEstudo) {
    return api.post<RegistroEstudo>("/registros", data);
  },
};
