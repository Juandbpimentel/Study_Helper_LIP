import { api } from "@/lib/api";
import { SlotCronograma } from "@/types/types";
import { mapCronogramaSlotFromApi } from "@/lib/mappers";

interface BackendSlot {
  id?: number;
  diaSemana: string;
  temaId?: number;
  ordem?: number;
  createdAt?: string;
  tema?: {
    id: number;
    tema: string;
    cor?: string | null;
    descricao?: string;
    creatorId?: number;
    createdAt?: string;
    updatedAt?: string;
  };
}

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
    const response = await api.get<unknown>("/cronograma");

    let rawSlots: BackendSlot[] = [];

    const data = response.data;
    const record =
      typeof data === "object" && data !== null
        ? (data as Record<string, unknown>)
        : null;

    const cronograma = record?.["cronograma"];
    const cronogramaRecord =
      typeof cronograma === "object" && cronograma !== null
        ? (cronograma as Record<string, unknown>)
        : null;

    const cronogramaSlots = cronogramaRecord?.["slots"];
    const rootSlots = record?.["slots"];

    if (Array.isArray(cronogramaSlots)) {
      rawSlots = cronogramaSlots as BackendSlot[];
    } else if (Array.isArray(rootSlots)) {
      rawSlots = rootSlots as BackendSlot[];
    } else if (Array.isArray(data)) {
      rawSlots = data as BackendSlot[];
    }

    const cronogramaId =
      typeof cronogramaRecord?.["id"] === "number"
        ? (cronogramaRecord["id"] as number)
        : 0;

    const frontendSlots: SlotCronograma[] = rawSlots.map((slot) => {
      // O backend atual retorna tema (com id) mas não retorna temaId no slot.
      // Para manter o front, derivamos temaId de slot.tema.id quando necessário.
      const normalizedSlot: BackendSlot = {
        ...slot,
        temaId: slot.temaId ?? slot.tema?.id,
      };

      return mapCronogramaSlotFromApi(
        {
          id: normalizedSlot.id ?? Math.floor(Math.random() * 1_000_000_000),
          createdAt: normalizedSlot.createdAt ?? new Date().toISOString(),
          diaSemana: normalizedSlot.diaSemana,
          ordem: normalizedSlot.ordem ?? 0,
          tema: normalizedSlot.tema,
        },
        cronogramaId
      );
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
