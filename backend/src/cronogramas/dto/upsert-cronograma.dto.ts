import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { DiaSemana } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SlotCronogramaInputDto {
  @ApiPropertyOptional({ description: 'Identificador do slot existente' })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({
    description: 'Dia da semana associado ao slot',
    enum: DiaSemana,
    enumName: 'DiaSemana',
  })
  @IsEnum(DiaSemana)
  diaSemana!: DiaSemana;

  @ApiProperty({
    description: 'Ordem do slot no dia, iniciando em zero',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  ordem!: number;

  @ApiProperty({ description: 'Identificador do tema associado ao slot' })
  @IsInt()
  temaId!: number;
}

export class UpsertCronogramaDto {
  @ApiProperty({
    description: 'Lista ordenada de slots que compõem o cronograma semanal',
    type: () => [SlotCronogramaInputDto],
  })
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => SlotCronogramaInputDto)
  slots!: SlotCronogramaInputDto[];
}
