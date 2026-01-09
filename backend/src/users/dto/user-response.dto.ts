import { ApiProperty } from '@nestjs/swagger';
import { DiaSemana } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ description: 'Identificador único do usuário', example: 1 })
  id!: number;

  @ApiProperty({
    description: 'Email de autenticação do usuário',
    example: 'john@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Nome completo informado pelo usuário',
    example: 'John Doe',
  })
  nome!: string;

  @ApiProperty({
    description: 'Versão atual do token JWT do usuário',
    example: 'cf23df2207d99a74fbe169e3eba035e633b65d94',
  })
  versaoToken!: string;

  @ApiProperty({
    description: 'Primeiro dia considerado na construção do cronograma semanal',
    enum: DiaSemana,
    enumName: 'DiaSemana',
    example: DiaSemana.Dom,
  })
  primeiroDiaSemana!: DiaSemana;

  @ApiProperty({
    description:
      'Offsets (em dias) utilizados para programar revisões automáticas',
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
}
