export interface Usuario {
  id: number;
  email: string;
  senha?: string;
  nome: string;
  versao_token: string;
  created_at: string;
  updated_at: string;
  primeiro_dia_semana: string;
  planejamento_revisoes: number[];
  max_slots_por_dia: number;
  revisao_atraso_expira_dias: number;
  slot_atraso_max_dias: number;
  slot_atraso_tolerancia_dias: number;
  ofensiva_atual: number;
  ofensiva_bloqueios_totais: number;
  ofensiva_bloqueios_usados: number;
  ofensiva_ultimo_dia_ativo?: string;
  ofensiva_atualizada_em?: string;
}

export interface TemaDeEstudo {
  id: number;
  tema: string;
  descricao?: string;
  cor: string;
  creatorId: number;
  created_at: string;
  updated_at: string;
}

export interface RegistroEstudo {
  id: number;
  tema_id: number;
  slot_id?: number;
  tempo_dedicado: number;
  conteudo_estudado: string;
  anotacoes?: string;
  tipo_registro: string;
  data_estudo: string;
  creatorId: number;
  created_at: string;
  updated_at: string;
  tema?: TemaDeEstudo;

  // detalhes opcionais retornados pela API
  slotCronograma?: SlotCronograma;
  revisoesGeradas?: Revisao[];
  revisaoConcluida?: Revisao | null;
}

export interface Revisao {
  id: number;
  slot_id?: number;
  registro_origem_id: number;
  registro_conclusao_id?: number;
  data_revisao: string;
  status_revisao: "PENDENTE" | "CONCLUIDA" | "ATRASADA" | "ADIADA" | "EXPIRADA";
  google_event_id?: string;
  creatorId: number;
  created_at: string;
  updated_at: string;
  registro_origem?: RegistroEstudo;
  tema?: TemaDeEstudo;
}

export interface RevisaoNotification {
  revisaoId: number;
  status: Revisao["status_revisao"];
  dataRevisao: string;
  tipo: "hoje" | "em_breve" | "atrasada" | "expirada";
  tema?: string;
  mensagem: string;
}

export interface OfensivaResumo {
  atual: number;
  bloqueiosTotais: number;
  bloqueiosUsados: number;
  bloqueiosRestantes: number;
  ultimoDiaAtivo: string | null;
}

export interface SlotCronograma {
  id: number;
  creatorId: number;
  dia_semana: number;
  ordem: number;
  cronograma_id: number;
  tema_id: number;
  google_event_id?: string;
  created_at: string;
  updated_at: string;
  tema?: TemaDeEstudo;
}

export interface CronogramaSemanal {
  id: number;
  creatorId: number;
  created_at: string;
  updated_at: string;
  slots?: SlotCronograma[];
}

export interface GoogleCalendarIntegration {
  id: number;
  creatorId: number;
  calendar_id: string;
  access_token: string;
  refresh_token_encrypted: string;
  token_type: string;
  scope: string;
  expiry_date: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  reviews: Revisao[];
  schedule: SlotCronograma[];
  studyRecords: RegistroEstudo[];
}

export type CronogramaResponse = SlotCronograma[] | { slots: SlotCronograma[] };
