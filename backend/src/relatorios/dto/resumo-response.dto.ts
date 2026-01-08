import { ApiProperty } from '@nestjs/swagger';
import { OfensivaDto } from '@/common/dto/ofensiva.dto';

export class PeriodoRelatorioDto {
  @ApiProperty({
    description:
      'Data inicial (inclusive) do período no formato ISO (YYYY-MM-DD).',
    nullable: true,
    example: '2026-01-01',
  })
  dataInicial!: string | null;

  @ApiProperty({
    description:
      'Data final (inclusive) do período no formato ISO (YYYY-MM-DD).',
    nullable: true,
    example: '2026-01-31',
  })
  dataFinal!: string | null;
}

export class RegistroPorTipoDto {
  @ApiProperty({
    description: 'Tipo do registro.',
    example: 'EstudoDeTema',
  })
  tipoRegistro!: string;

  @ApiProperty({ description: 'Quantidade de registros desse tipo.' })
  quantidade!: number;

  @ApiProperty({ description: 'Tempo total (min) acumulado nesse tipo.' })
  tempoTotal!: number;
}

export class DesempenhoTemaDto {
  @ApiProperty({
    description: 'Identificador do tema, quando disponível',
    nullable: true,
  })
  temaId!: number | null;

  @ApiProperty({ description: 'Nome do tema ou rótulo descritivo' })
  tema!: string;

  @ApiProperty({
    description: 'Cor associada ao tema',
    nullable: true,
    example: '#3366FF',
  })
  cor!: string | null;

  @ApiProperty({
    description: 'Quantidade de registros de estudo associados ao tema',
  })
  quantidadeEstudos!: number;

  @ApiProperty({ description: 'Tempo total acumulado em minutos' })
  tempoTotal!: number;
}

export class ResumoRelatorioResponseDto {
  @ApiProperty({
    description:
      'Período utilizado para gerar o relatório. Quando null, indica período aberto (sem filtro).',
    type: () => PeriodoRelatorioDto,
  })
  periodo!: PeriodoRelatorioDto;

  @ApiProperty({
    description:
      'Resumo da ofensiva (streak) do usuário, com até 2 bloqueios (faltas toleradas entre dias ativos).',
    type: () => OfensivaDto,
  })
  ofensiva!: OfensivaDto;

  @ApiProperty({ description: 'Quantidade total de registros de estudo' })
  totalEstudos!: number;

  @ApiProperty({ description: 'Tempo total dedicado em minutos' })
  tempoTotalEstudado!: number;

  @ApiProperty({
    description:
      'Quantidade de dias distintos com pelo menos 1 registro dentro do período.',
  })
  diasComEstudo!: number;

  @ApiProperty({
    description:
      'Média de minutos estudados por dia ativo (diasComEstudo > 0) dentro do período.',
  })
  tempoMedioPorDiaAtivo!: number;

  @ApiProperty({
    description: 'Distribuição de registros por tipo dentro do período.',
    type: () => [RegistroPorTipoDto],
  })
  registrosPorTipo!: RegistroPorTipoDto[];

  @ApiProperty({ description: 'Quantidade de revisões concluídas' })
  revisoesConcluidas!: number;

  @ApiProperty({ description: 'Quantidade de revisões pendentes ou adiadas' })
  revisoesPendentes!: number;

  @ApiProperty({ description: 'Quantidade de revisões atrasadas' })
  revisoesAtrasadas!: number;

  @ApiProperty({ description: 'Quantidade de revisões expiradas' })
  revisoesExpiradas!: number;

  @ApiProperty({ description: 'Revisões agendadas para o dia pesquisado' })
  revisoesHoje!: number;

  @ApiProperty({
    description: 'Desempenho consolidado por tema',
    type: () => [DesempenhoTemaDto],
  })
  desempenhoPorTema!: DesempenhoTemaDto[];
}
