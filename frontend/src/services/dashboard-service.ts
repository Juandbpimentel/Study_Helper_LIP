import { DashboardData } from "@/types/types";
import { reviewService } from "./review-service";
import { scheduleService } from "./schedule-service";
import { studyService } from "./study-service";

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    try {
      const [reviews, schedule, studyRecords] = await Promise.all([
        reviewService.getAll().then((res) => res.data),
        scheduleService.get(),
        studyService.getAll().then((res) => res.data),
      ]);

      return {
        reviews: reviews || [],
        schedule: schedule || [],
        studyRecords: studyRecords || [],
      };
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      return { reviews: [], schedule: [], studyRecords: [] };
    }
  },
};
