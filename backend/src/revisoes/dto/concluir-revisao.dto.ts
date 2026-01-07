import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConcluirRevisaoDto {
  @ApiProperty({
    description: 'Tempo dedicado à revisão em minutos',
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  tempoDedicado!: number;

  @ApiPropertyOptional({
    description: 'Resumo do conteúdo revisado',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  conteudoEstudado?: string;

  @ApiPropertyOptional({
    description: 'Data em que a revisão foi concluída (ISO)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  dataEstudo?: string;
}
