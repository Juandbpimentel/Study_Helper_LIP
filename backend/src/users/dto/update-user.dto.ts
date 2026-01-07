import { DiaSemana } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ description: 'Nome que será apresentado nas interfaces' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    description: 'Planejamento personalizado de revisões em dias',
    type: [Number],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  planejamentoRevisoes: number[];

  @ApiProperty({
    description: 'Primeiro dia da semana para construir o cronograma',
    enum: DiaSemana,
    enumName: 'DiaSemana',
  })
  @IsEnum(DiaSemana)
  primeiroDiaSemana: DiaSemana;
}
