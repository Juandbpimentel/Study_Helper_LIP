import { api, ApiResponse } from "@/lib/api";
import { RevisaoNotification } from "@/types/types";

export const notificationService = {
  async getRevisionNotifications(): Promise<
    ApiResponse<RevisaoNotification[]>
  > {
    const result = await api.get<unknown>("/revisoes/notificacoes");
    if (result.error)
      return { error: result.error, statusCode: result.statusCode };

    return {
      data: Array.isArray(result.data)
        ? (result.data as RevisaoNotification[])
        : [],
    };
  },
};
