import { ApiProperty } from '@nestjs/swagger';

export class OfensivaDto {
  @ApiProperty({
    description:
      'Quantidade de dias ativos na ofensiva atual (dias em que houve pelo menos 1 registro).',
    example: 12,
  })
  atual!: number;

  @ApiProperty({
    description: 'Quantidade total de bloqueios disponíveis.',
    example: 2,
  })
  bloqueiosTotais!: number;

  @ApiProperty({
    description: 'Quantidade de bloqueios já consumidos na ofensiva atual.',
    example: 1,
  })
  bloqueiosUsados!: number;

  @ApiProperty({
    description: 'Quantidade de bloqueios restantes.',
    example: 1,
  })
  bloqueiosRestantes!: number;

  @ApiProperty({
    description:
      'Último dia (YYYY-MM-DD) em que houve atividade. Null quando não há registros.',
    nullable: true,
    example: '2026-01-08',
  })
  ultimoDiaAtivo!: string | null;
}
