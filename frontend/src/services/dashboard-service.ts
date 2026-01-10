import { api } from "@/lib/api";
// Importamos os tipos centrais
import {
  Revisao,
  SlotCronograma,
  RegistroEstudo,
  TemaDeEstudo,
} from "@/types/types"; // Certifique-se que o caminho está correto (types.ts ou index.ts)

// --- CORREÇÃO: RE-EXPORTAR OS TIPOS ---
// Isso permite que o page.tsx faça: import { Revisao } from "@/services/dashboard-service"
export type { Revisao, SlotCronograma, RegistroEstudo, TemaDeEstudo };

export interface Theme extends TemaDeEstudo {}

export interface DashboardData {
  reviews: Revisao[];
  schedule: SlotCronograma[];
  studyRecords: RegistroEstudo[];
}

export interface CreateStudyData {
  tema_id: number;
  conteudo_estudado: string;
  data_estudo: string;
  tempo_dedicado: number;
  anotacoes?: string;
}

export const dashboardService = {
  // Busca todos os dados necessários em paralelo
  async getDashboardData() {
    try {
      const [reviewsRes, scheduleRes, recordsRes] = await Promise.all([
        api.get<Revisao[]>("/revisoes"),
        api.get<any>("/cronograma"),
        api.get<RegistroEstudo[]>("/registros"),
      ]);

      return {
        reviews: reviewsRes.data || [],
        schedule: Array.isArray(scheduleRes.data)
          ? scheduleRes.data
          : (scheduleRes.data as any)?.slots || [],
        studyRecords: recordsRes.data || [],
      };
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      return { reviews: [], schedule: [], studyRecords: [] };
    }
  },

  async completeReview(id: number) {
    return api.patch(`/revisoes/${id}/concluir`);
  },

  async getThemes() {
    return api.get<TemaDeEstudo[]>("/themes");
  },

  async createStudyRecord(data: CreateStudyData) {
    return api.post("/registros", data);
  },

  async createTheme(data: { tema: string; cor: string; descricao?: string }) {
    return api.post<Theme>("/themes", data);
  },
};
