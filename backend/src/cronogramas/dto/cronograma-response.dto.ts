import { ApiProperty } from '@nestjs/swagger';
import { DiaSemana } from '@prisma/client';
import { TemaDeEstudoDto } from '@/common/dto/api-entities.dto';

type SlotStatus = 'concluido' | 'pendente' | 'atrasado';

export class CronogramaSemanaDto {
  @ApiProperty({
    description: 'Data de referência utilizada para montar a semana',
    type: String,
    format: 'date-time',
  })
  referencia!: string;

  @ApiProperty({
    description: 'Data de início da semana (inclusive)',
    type: String,
    format: 'date-time',
  })
  inicio!: string;

  @ApiProperty({
    description: 'Data de término da semana (inclusive)',
    type: String,
    format: 'date-time',
  })
  fim!: string;
}

export class CronogramaSlotResponseDto {
  @ApiProperty({ description: 'Identificador do slot', example: 45 })
  id!: number;

  @ApiProperty({
    description: 'Dia da semana planejado',
    enum: DiaSemana,
    enumName: 'DiaSemana',
  })
  diaSemana!: DiaSemana;

  @ApiProperty({ description: 'Posição do slot dentro do dia', example: 0 })
  ordem!: number;

  @ApiProperty({
    description: 'Data estimada para execução do slot',
    type: String,
    format: 'date-time',
  })
  dataAlvo!: string;

  @ApiProperty({
    description: 'Situação do slot em relação aos registros',
    enum: ['concluido', 'pendente', 'atrasado'],
  })
  status!: SlotStatus;

  @ApiProperty({
    description: 'Tema associado ao slot, quando existente',
    type: () => TemaDeEstudoDto,
  })
  tema!: TemaDeEstudoDto | null;
}

export class CronogramaDetalheDto {
  @ApiProperty({
    description: 'Identificador do cronograma semanal',
    example: 10,
  })
  id!: number;

  @ApiProperty({
    description: 'Lista de slots planejados para a semana',
    type: () => [CronogramaSlotResponseDto],
  })
  slots!: CronogramaSlotResponseDto[];
}

export class CronogramaComStatusResponseDto {
  @ApiProperty({
    description: 'Informações da semana consultada',
    type: () => CronogramaSemanaDto,
  })
  semana!: CronogramaSemanaDto;

  @ApiProperty({
    description: 'Estrutura do cronograma com o status de cada slot',
    type: () => CronogramaDetalheDto,
  })
  cronograma!: CronogramaDetalheDto;
}
