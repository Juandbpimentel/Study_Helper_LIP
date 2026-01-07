import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdiarRevisaoDto {
  @ApiProperty({
    description:
      'Nova data da revisão em formato ISO (considera o início do dia)',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  novaData!: string;
}
