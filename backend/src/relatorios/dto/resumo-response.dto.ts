import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ description: 'Quantidade total de registros de estudo' })
  totalEstudos!: number;

  @ApiProperty({ description: 'Tempo total dedicado em minutos' })
  tempoTotalEstudado!: number;

  @ApiProperty({ description: 'Quantidade de revisões concluídas' })
  revisoesConcluidas!: number;

  @ApiProperty({ description: 'Quantidade de revisões pendentes ou adiadas' })
  revisoesPendentes!: number;

  @ApiProperty({ description: 'Quantidade de revisões atrasadas' })
  revisoesAtrasadas!: number;

  @ApiProperty({ description: 'Revisões agendadas para o dia pesquisado' })
  revisoesHoje!: number;

  @ApiProperty({
    description: 'Desempenho consolidado por tema',
    type: () => [DesempenhoTemaDto],
  })
  desempenhoPorTema!: DesempenhoTemaDto[];
}
