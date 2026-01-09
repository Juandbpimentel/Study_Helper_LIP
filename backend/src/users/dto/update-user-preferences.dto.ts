import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, ValidateIf } from 'class-validator';

export class UpdateUserPreferencesDto {
  @ApiPropertyOptional({
    description:
      'Limite máximo de slots por dia da semana. Quando null, remove o limite. Quando omitido, não altera.',
    minimum: 1,
    nullable: true,
    example: 5,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxSlotsPorDia?: number | null;

  @ApiPropertyOptional({
    description:
      'Dias de tolerância após a data prevista antes de marcar um slot como atrasado.',
    minimum: 0,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  slotAtrasoToleranciaDias?: number;

  @ApiPropertyOptional({
    description:
      'Quantidade máxima de dias que um slot permanece como atrasado antes de voltar para pendente.',
    minimum: 1,
    example: 7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  slotAtrasoMaxDias?: number;

  @ApiPropertyOptional({
    description:
      'Dias após a data da revisão para ela expirar. Quando null, revisões atrasadas não expiram. Quando omitido, não altera.',
    minimum: 1,
    nullable: true,
    example: 30,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  revisaoAtrasoExpiraDias?: number | null;
}
