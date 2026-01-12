import { DiaSemana } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Nome que será apresentado nas interfaces',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nome?: string;

  @ApiPropertyOptional({
    description: 'Planejamento personalizado de revisões em dias',
    type: [Number],
    minItems: 1,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  planejamentoRevisoes?: number[];

  @ApiPropertyOptional({
    description: 'Meta de estudo diária em minutos',
    example: 60,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  metaDiaria?: number;

  @ApiPropertyOptional({
    description: 'Primeiro dia da semana para construir o cronograma',
    enum: DiaSemana,
    enumName: 'DiaSemana',
    required: false,
  })
  @IsOptional()
  @IsEnum(DiaSemana)
  primeiroDiaSemana?: DiaSemana;
}
