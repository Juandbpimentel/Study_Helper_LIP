import { api } from "@/lib/api";
import { SlotCronograma, TemaDeEstudo } from "@/types/types";

interface BackendSlot {
  id?: number;
  diaSemana: string;
  temaId: number;
  ordem?: number;
  tema?: {
    id: number;
    tema: string;
    cor: string;
    descricao?: string;
    creatorId?: number;
    created_at?: string;
    updated_at?: string;
  };
}

const dayToIdMap: Record<string, number> = {
  Dom: 0,
  Seg: 1,
  Ter: 2,
  Qua: 3,
  Qui: 4,
  Sex: 5,
  Sab: 6,
  Sáb: 6,
};

const idToDayMap: Record<number, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sab",
};

export const scheduleService = {
  async get() {
    const response = await api.get<any>("/cronograma");

    let rawSlots: BackendSlot[] = [];

    if (response.data?.cronograma?.slots) {
      rawSlots = response.data.cronograma.slots;
    } else if (response.data?.slots) {
      rawSlots = response.data.slots;
    } else if (Array.isArray(response.data)) {
      rawSlots = response.data;
    }

    const frontendSlots: SlotCronograma[] = rawSlots.map((slot) => {
      const temaCompleto: TemaDeEstudo = slot.tema
        ? {
            id: slot.tema.id,
            tema: slot.tema.tema,
            cor: slot.tema.cor,
            descricao: slot.tema.descricao,
            creatorId: slot.tema.creatorId ?? 0,
            created_at: slot.tema.created_at ?? new Date().toISOString(),
            updated_at: slot.tema.updated_at ?? new Date().toISOString(),
          }
        : {
            id: slot.temaId,
            tema: "Carregando...",
            cor: "#ccc",
            creatorId: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

      return {
        id: slot.id || Math.random(),
        dia_semana: dayToIdMap[slot.diaSemana] ?? 0,
        tema_id: slot.temaId,
        ordem: slot.ordem || 0,
        tema: temaCompleto,
        created_at: "",
        updated_at: "",
        creatorId: 0,
        cronograma_id: 0,
      };
    });

    return frontendSlots;
  },

  async update(scheduleMap: Record<number, number[]>) {
    const slotsToSave: Partial<BackendSlot>[] = [];

    for (const [dayIndexStr, subjectIds] of Object.entries(scheduleMap)) {
      const diaNumero = parseInt(dayIndexStr);
      const diaString = idToDayMap[diaNumero];

      if (Array.isArray(subjectIds) && diaString) {
        subjectIds.forEach((temaId, index) => {
          slotsToSave.push({
            diaSemana: diaString,
            temaId: temaId,
            ordem: index,
          });
        });
      }
    }

    return api.put("/cronograma", { slots: slotsToSave });
  },
};
