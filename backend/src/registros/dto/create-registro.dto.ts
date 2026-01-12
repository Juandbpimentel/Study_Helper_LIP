import { TipoRegistro } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsNotInFuture } from '@/common/validators/is-not-in-future.validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class CreateRegistroDto {
  @ApiProperty({
    description: 'Tipo do registro a ser criado',
    enum: TipoRegistro,
    enumName: 'TipoRegistro',
  })
  @IsEnum(TipoRegistro)
  tipoRegistro!: TipoRegistro;

  @ApiProperty({
    description: 'Tempo total dedicado ao estudo em minutos',
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  tempoDedicado!: number;

  @ApiPropertyOptional({
    description: 'Resumo do conteúdo estudado (até 1000 caracteres)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  conteudoEstudado?: string;

  @ApiPropertyOptional({
    description: 'Anotações adicionais sobre o registro (até 2000 caracteres)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  anotacoes?: string;

  @ApiPropertyOptional({
    description: 'Identificador do tema vinculado ao registro',
  })
  @IsOptional()
  @IsInt()
  temaId?: number;

  @ApiPropertyOptional({
    description: 'Identificador do slot do cronograma associado',
  })
  @IsOptional()
  @IsInt()
  slotId?: number;

  @ApiPropertyOptional({
    description: 'Identificador da revisão programada concluída',
  })
  @IsOptional()
  @IsInt()
  revisaoProgramadaId?: number;

  @ApiPropertyOptional({
    description: 'Data e hora ISO a ser considerada como data do estudo',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  @IsNotInFuture({ message: 'dataEstudo não pode ser no futuro' })
  dataEstudo?: string;
}

export class ListRegistrosQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Filtra registros pela data informada (considera o dia inteiro)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  data?: string;
}
