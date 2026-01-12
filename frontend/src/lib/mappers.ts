import type {
  RegistroEstudo,
  Revisao,
  SlotCronograma,
  TemaDeEstudo,
} from "@/types/types";

type UnknownRecord = Record<string, unknown>;

const MIDNIGHT_UTC_ISO_REGEX = /T00:00:00(\.000)?Z$/;

function normalizeIsoForLocalDay(value: string): string {
  // Caso clássico: backend salva "date-only" como 00:00Z.
  // Para quem está em fuso negativo (ex.: -03), isso aparece como dia anterior.
  // Normalizamos para meio-dia no fuso local (mesmo dia do YYYY-MM-DD) para
  // manter o agrupamento por dia correto no UI.
  if (!MIDNIGHT_UTC_ISO_REGEX.test(value)) return value;

  const datePart = value.slice(0, 10); // YYYY-MM-DD
  const [yRaw, mRaw, dRaw] = datePart.split("-");
  const year = Number(yRaw);
  const month = Number(mRaw);
  const day = Number(dRaw);
  if (!year || !month || !day) return value;

  const localNoon = new Date(year, month - 1, day, 12, 0, 0, 0);
  return localNoon.toISOString();
}

function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== "object" || value === null) return null;
  return value as UnknownRecord;
}

function getString(obj: UnknownRecord, key: string): string | undefined {
  const value = obj[key];
  return typeof value === "string" ? value : undefined;
}

function getNumber(obj: UnknownRecord, key: string): number | undefined {
  const value = obj[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function getNullableString(
  obj: UnknownRecord,
  key: string
): string | null | undefined {
  const value = obj[key];
  if (typeof value === "string") return value;
  if (value === null) return null;
  return undefined;
}

export function mapThemeFromApi(value: unknown): TemaDeEstudo {
  const obj = asRecord(value) ?? {};

  const id = getNumber(obj, "id") ?? 0;
  const tema = getString(obj, "tema") ?? "";

  const creatorId =
    getNumber(obj, "creatorId") ?? getNumber(obj, "creator_id") ?? 0;

  const createdAt =
    getString(obj, "createdAt") ??
    getString(obj, "created_at") ??
    new Date().toISOString();

  const updatedAt =
    getString(obj, "updatedAt") ??
    getString(obj, "updated_at") ??
    new Date().toISOString();

  const corRaw = getNullableString(obj, "cor");
  const descricaoRaw = getNullableString(obj, "descricao");

  return {
    id,
    tema,
    descricao: descricaoRaw ?? undefined,
    cor: corRaw ?? "#6366f1",
    creatorId,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

export function mapRegistroFromApi(value: unknown): RegistroEstudo {
  const obj = asRecord(value) ?? {};

  const id = getNumber(obj, "id") ?? 0;
  const tempoDedicado =
    getNumber(obj, "tempoDedicado") ?? getNumber(obj, "tempo_dedicado") ?? 0;
  const conteudoEstudado =
    getString(obj, "conteudoEstudado") ?? getString(obj, "conteudo_estudado");
  const anotacoes = getString(obj, "anotacoes");
  const tipoRegistro =
    getString(obj, "tipoRegistro") ?? getString(obj, "tipo_registro") ?? "";
  const dataEstudo =
    getString(obj, "dataEstudo") ??
    getString(obj, "data_estudo") ??
    new Date().toISOString();

  const temaId = getNumber(obj, "temaId") ?? getNumber(obj, "tema_id") ?? 0;
  const slotId =
    getNumber(obj, "slotId") ?? getNumber(obj, "slot_id") ?? undefined;
  const creatorId =
    getNumber(obj, "creatorId") ?? getNumber(obj, "creator_id") ?? 0;
  const createdAt =
    getString(obj, "createdAt") ??
    getString(obj, "created_at") ??
    new Date().toISOString();
  const updatedAt =
    getString(obj, "updatedAt") ??
    getString(obj, "updated_at") ??
    new Date().toISOString();

  const tema = obj["tema"];
  const slotCronogramaRaw = obj["slotCronograma"] ?? obj["slot_cronograma"];
  const revisoesGeradasRaw = obj["revisoesGeradas"] ?? obj["revisoes_geradas"];
  const revisaoConcluidaRaw = obj["revisaoConcluida"] ?? obj["revisao_concluida"];

  const slotCronograma = slotCronogramaRaw
    ? mapCronogramaSlotFromApi(
        slotCronogramaRaw,
        (function () {
          const slotObj = asRecord(slotCronogramaRaw) ?? {};
          return (
            getNumber(slotObj, "cronogramaId") ??
            getNumber(slotObj, "cronograma_id") ??
            0
          );
        })()
      )
    : undefined;

  const revisoesGeradas = Array.isArray(revisoesGeradasRaw)
    ? revisoesGeradasRaw.map((r) => mapRevisaoFromApi(r))
    : undefined;

  const revisaoConcluida = revisaoConcluidaRaw
    ? mapRevisaoFromApi(revisaoConcluidaRaw)
    : undefined;

  return {
    id,
    tema_id: temaId,
    slot_id: slotId,
    tempo_dedicado: tempoDedicado,
    conteudo_estudado: conteudoEstudado ?? "",
    anotacoes: anotacoes ?? undefined,
    tipo_registro: tipoRegistro,
    data_estudo: normalizeIsoForLocalDay(dataEstudo),
    creatorId,
    created_at: createdAt,
    updated_at: updatedAt,
    tema: tema ? mapThemeFromApi(tema) : undefined,
    slotCronograma: slotCronograma,
    revisoesGeradas: revisoesGeradas,
    revisaoConcluida: revisaoConcluida,
  };
}

const statusMap: Record<string, Revisao["status_revisao"]> = {
  Pendente: "PENDENTE",
  Concluida: "CONCLUIDA",
  Adiada: "ADIADA",
  Atrasada: "ATRASADA",
  Expirada: "ATRASADA",
  PENDENTE: "PENDENTE",
  CONCLUIDA: "CONCLUIDA",
  ADIADA: "ADIADA",
  ATRASADA: "ATRASADA",
};

export function mapRevisaoFromApi(value: unknown): Revisao {
  const obj = asRecord(value) ?? {};

  const id = getNumber(obj, "id") ?? 0;
  const dataRevisao =
    getString(obj, "dataRevisao") ??
    getString(obj, "data_revisao") ??
    new Date().toISOString();
  const statusRevisao =
    getString(obj, "statusRevisao") ?? getString(obj, "status_revisao") ?? "";
  const registroOrigemId =
    getNumber(obj, "registroOrigemId") ??
    getNumber(obj, "registro_origem_id") ??
    0;
  const registroConclusaoId =
    getNumber(obj, "registroConclusaoId") ??
    getNumber(obj, "registro_conclusao_id") ??
    undefined;
  const slotCronogramaId =
    getNumber(obj, "slotCronogramaId") ??
    getNumber(obj, "slot_id") ??
    undefined;
  const creatorId =
    getNumber(obj, "creatorId") ?? getNumber(obj, "creator_id") ?? 0;
  const createdAt =
    getString(obj, "createdAt") ??
    getString(obj, "created_at") ??
    new Date().toISOString();
  const updatedAt =
    getString(obj, "updatedAt") ??
    getString(obj, "updated_at") ??
    new Date().toISOString();

  const registroOrigemRaw = obj["registroOrigem"] ?? obj["registro_origem"];
  const registroOrigem = registroOrigemRaw
    ? mapRegistroFromApi(registroOrigemRaw)
    : undefined;

  return {
    id,
    slot_id: slotCronogramaId,
    registro_origem_id: registroOrigemId,
    registro_conclusao_id: registroConclusaoId,
    data_revisao: normalizeIsoForLocalDay(dataRevisao),
    status_revisao: statusMap[statusRevisao] ?? "PENDENTE",
    creatorId,
    created_at: createdAt,
    updated_at: updatedAt,
    registro_origem: registroOrigem,
    tema: registroOrigem?.tema,
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

export function mapCronogramaSlotFromApi(
  value: unknown,
  cronogramaId: number
): SlotCronograma {
  const obj = asRecord(value) ?? {};
  const temaRaw = obj["tema"];
  const temaObj = asRecord(temaRaw);
  const temaId = temaObj ? getNumber(temaObj, "id") ?? 0 : 0;

  const createdAt =
    getString(obj, "createdAt") ??
    getString(obj, "created_at") ??
    new Date().toISOString();

  const diaSemana = getString(obj, "diaSemana") ?? "Dom";
  const ordem = getNumber(obj, "ordem") ?? 0;
  const id = getNumber(obj, "id") ?? Math.floor(Math.random() * 1_000_000_000);

  return {
    id,
    creatorId: 0,
    dia_semana: dayToIdMap[diaSemana] ?? 0,
    ordem,
    cronograma_id: cronogramaId,
    tema_id: temaId,
    created_at: createdAt,
    updated_at: "",
    tema: temaRaw ? mapThemeFromApi(temaRaw) : undefined,
  };
}

export function inferTipoRegistro(
  input: unknown,
  temaIdOrOptions?:
    | number
    | { temaId?: number; slotId?: number; revisaoProgramadaId?: number }
): string {
  const raw = typeof input === "string" ? input.trim() : "";
  const allowed = new Set(["EstudoDeTema", "Revisao", "EstudoAberto"]);
  if (allowed.has(raw)) return raw;

  const options =
    typeof temaIdOrOptions === "object" && temaIdOrOptions !== null
      ? temaIdOrOptions
      : {
          temaId:
            typeof temaIdOrOptions === "number" ? temaIdOrOptions : undefined,
        };

  // Regra de negócio do backend: EstudoDeTema exige slot.
  if (options.slotId) return "EstudoDeTema";
  if (options.revisaoProgramadaId) return "Revisao";

  // Se não há slot nem revisão, o default mais seguro é EstudoAberto.
  return "EstudoAberto";
}
