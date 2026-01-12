import { api, ApiResponse } from "@/lib/api";
import { OfensivaResumo } from "@/types/types";

export const offensivaService = {
  async getMe(): Promise<ApiResponse<OfensivaResumo>> {
    const result = await api.get<unknown>("/users/me/ofensiva");
    if (result.error)
      return { error: result.error, statusCode: result.statusCode };
    return { data: result.data as OfensivaResumo };
  },
};
