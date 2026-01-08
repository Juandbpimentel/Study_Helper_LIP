import { ApiProperty } from '@nestjs/swagger';
import { DiaSemana } from '@prisma/client';
import { UserResponseDto } from '@/users/dto/user-response.dto';
import { OfensivaDto } from '@/ofensiva/dto/ofensiva.dto';

export class GoogleCalendarBackendStatusDto {
  @ApiProperty({
    description:
      'Se o backend está com Google Calendar habilitado (envs necessários presentes e válidos).',
    example: false,
  })
  enabled!: boolean;

  @ApiProperty({
    description: 'Se o OAuth (client id/secret/redirect) está configurado.',
    example: false,
  })
  oauthConfigured!: boolean;

  @ApiProperty({
    description:
      'Se a chave de criptografia do token está configurada e válida.',
    example: false,
  })
  encryptionKeyConfigured!: boolean;

  @ApiProperty({
    description:
      'Lista de problemas detectados na configuração (vazia quando enabled=true).',
    type: [String],
    example: [
      'GOOGLE_CLIENT_ID ausente',
      'GOOGLE_CLIENT_SECRET ausente',
      'GOOGLE_TOKEN_ENCRYPTION_KEY ausente',
    ],
  })
  issues!: string[];
}

export class AuthSuccessResponseDto {
  @ApiProperty({
    description: 'Mensagem de confirmação da operação',
    example: 'Login Realizado com Sucesso',
  })
  message!: string;

  @ApiProperty({
    name: 'access_token',
    description: 'Token JWT também enviado via cookie httpOnly',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  })
  access_token!: string;

  @ApiProperty({
    description: 'Dados públicos do usuário autenticado',
    type: () => UserResponseDto,
  })
  user!: UserResponseDto;

  @ApiProperty({
    description:
      'Resumo da ofensiva (streak) e bloqueios do usuário para feedback imediato no frontend.',
    type: () => OfensivaDto,
  })
  ofensiva!: OfensivaDto;

  @ApiProperty({
    description:
      'Status do suporte a Google Calendar neste backend (para feedback no frontend).',
    type: () => GoogleCalendarBackendStatusDto,
  })
  googleCalendar!: GoogleCalendarBackendStatusDto;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Mensagem de confirmação do logout',
    example: 'Logout realizado com sucesso',
  })
  message!: string;
}

export class AuthProfileResponseDto {
  @ApiProperty({
    description: 'Identificador do usuário autenticado',
    example: 1,
  })
  id!: number;

  @ApiProperty({
    description: 'Email principal do usuário',
    example: 'john@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Nome completo informado pelo usuário',
    example: 'John Doe',
  })
  nome!: string;

  @ApiProperty({
    description: 'Versão atual do token JWT',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  versaoToken!: string;

  @ApiProperty({
    description: 'Primeiro dia da semana configurado pelo usuário',
    enum: DiaSemana,
    enumName: 'DiaSemana',
    example: DiaSemana.Dom,
  })
  primeiroDiaSemana!: DiaSemana;

  @ApiProperty({
    description: 'Intervalos de revisões automáticas configurados',
    type: [Number],
    example: [1, 7, 14],
  })
  planejamentoRevisoes!: number[];

  @ApiProperty({
    description: 'Limite máximo de slots por dia da semana (quando definido).',
    required: false,
    nullable: true,
    example: 5,
  })
  maxSlotsPorDia!: number | null;

  @ApiProperty({
    description:
      'Dias de tolerância após a data prevista antes de marcar um slot como atrasado.',
    example: 0,
  })
  slotAtrasoToleranciaDias!: number;

  @ApiProperty({
    description:
      'Quantidade máxima de dias que um slot permanece como atrasado antes de voltar para pendente.',
    example: 7,
  })
  slotAtrasoMaxDias!: number;

  @ApiProperty({
    description:
      'Dias após a data da revisão para ela expirar. Quando null, revisões atrasadas não expiram.',
    required: false,
    nullable: true,
    example: 30,
  })
  revisaoAtrasoExpiraDias!: number | null;

  @ApiProperty({
    description: 'Data de criação do usuário',
    type: String,
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Data da última atualização do usuário',
    type: String,
    format: 'date-time',
  })
  updatedAt!: string;

  @ApiProperty({
    description:
      'Resumo da ofensiva (streak) e bloqueios do usuário para feedback imediato no frontend.',
    type: () => OfensivaDto,
  })
  ofensiva!: OfensivaDto;
}
