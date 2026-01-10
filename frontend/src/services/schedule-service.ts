import { api } from "@/lib/api";
import { CronogramaResponse, SlotCronograma } from "@/types/types";

export const scheduleService = {
  async get() {
    const response = await api.get<CronogramaResponse>("/cronograma");

    if (Array.isArray(response.data)) {
      return response.data;
    }
    return (response.data as any)?.slots || [];
  },

  async update(scheduleMap: Record<number, number[]>) {
    return api.put("/cronograma", scheduleMap);
  },
};
