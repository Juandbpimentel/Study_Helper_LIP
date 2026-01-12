import { ApiProperty } from '@nestjs/swagger';
import { StatusRevisao } from '@prisma/client';

export class RevisaoNotificationResponseDto {
  @ApiProperty({ example: 12 })
  revisaoId!: number;

  @ApiProperty({ enum: StatusRevisao })
  status!: StatusRevisao;

  @ApiProperty({ format: 'date-time' })
  dataRevisao!: Date;

  @ApiProperty({
    enum: ['hoje', 'em_breve', 'atrasada', 'expirada'],
    example: 'em_breve',
  })
  tipo!: 'hoje' | 'em_breve' | 'atrasada' | 'expirada';

  @ApiProperty({ required: false, example: 'Matemática' })
  tema?: string;

  @ApiProperty({ example: 'Revisão de Matemática nas próximas 48h.' })
  mensagem!: string;
}
