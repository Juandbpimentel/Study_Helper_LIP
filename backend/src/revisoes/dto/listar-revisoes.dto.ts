import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { StatusRevisao } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListarRevisoesQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra revisões por status atual',
    enum: StatusRevisao,
    enumName: 'StatusRevisao',
  })
  @IsOptional()
  @IsEnum(StatusRevisao)
  status?: StatusRevisao;

  @ApiPropertyOptional({
    description: 'Define limite inferior de data para busca',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  dataInicial?: string;

  @ApiPropertyOptional({
    description: 'Define limite superior de data para busca',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  dataFinal?: string;
}
