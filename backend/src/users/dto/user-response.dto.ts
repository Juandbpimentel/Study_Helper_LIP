import { ApiProperty } from '@nestjs/swagger';
import { DiaSemana } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ description: 'Identificador único do usuário', example: 1 })
  id!: number;

  @ApiProperty({
    description: 'Email de autenticação do usuário',
    example: 'john@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Nome completo informado pelo usuário',
    example: 'John Doe',
  })
  nome!: string;

  @ApiProperty({
    description: 'Versão atual do token JWT do usuário',
    example: 'cf23df2207d99a74fbe169e3eba035e633b65d94',
  })
  versaoToken!: string;

  @ApiProperty({
    description: 'Indica se o usuário possui privilégios administrativos',
    example: false,
  })
  isAdmin!: boolean;

  @ApiProperty({
    description: 'Primeiro dia considerado na construção do cronograma semanal',
    enum: DiaSemana,
    enumName: 'DiaSemana',
    example: DiaSemana.Dom,
  })
  primeiroDiaSemana!: DiaSemana;

  @ApiProperty({
    description:
      'Offsets (em dias) utilizados para programar revisões automáticas',
    type: [Number],
    example: [1, 7, 14],
  })
  planejamentoRevisoes!: number[];

  @ApiProperty({
    description: 'Data de criação do usuário',
    type: String,
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Data da última atualização do usuário',
    type: String,
    format: 'date-time',
  })
  updatedAt!: string;
}
