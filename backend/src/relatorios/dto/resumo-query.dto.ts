import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ResumoRelatorioQueryDto {
  @ApiPropertyOptional({
    description:
      'Data inicial (inclusive) do período em formato ISO (date ou date-time). Quando omitida, considera desde o início.',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  dataInicial?: string;

  @ApiPropertyOptional({
    description:
      'Data final (inclusive) do período em formato ISO (date ou date-time). Quando omitida, considera até o fim.',
    example: '2026-01-31',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  dataFinal?: string;

  @ApiPropertyOptional({
    description:
      'Filtra o relatório para um tema específico (id do tema do usuário).',
    minimum: 1,
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  temaId?: number;
}
