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

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  planejamentoRevisoes: number[];

  @IsEnum(DiaSemana)
  primeiroDiaSemana: DiaSemana;
}
