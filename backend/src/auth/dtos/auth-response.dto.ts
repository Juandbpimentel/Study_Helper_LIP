import { ApiProperty } from '@nestjs/swagger';
import { DiaSemana } from '@prisma/client';
import { UserResponseDto } from '@/users/dto/user-response.dto';

export class AuthSuccessResponseDto {
  @ApiProperty({
    description: 'Mensagem de confirmação da operação',
    example: 'Login Realizado com Sucesso',
  })
  message!: string;

  @ApiProperty({
    name: 'access_token',
    description: 'Token JWT também enviado via cookie httpOnly',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  })
  access_token!: string;

  @ApiProperty({
    description: 'Dados públicos do usuário autenticado',
    type: () => UserResponseDto,
  })
  user!: UserResponseDto;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Mensagem de confirmação do logout',
    example: 'Logout realizado com sucesso',
  })
  message!: string;
}

export class AuthProfileResponseDto {
  @ApiProperty({
    description: 'Identificador do usuário autenticado',
    example: 1,
  })
  id!: number;

  @ApiProperty({
    description: 'Email principal do usuário',
    example: 'john@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Nome completo informado pelo usuário',
    example: 'John Doe',
  })
  nome!: string;

  @ApiProperty({
    description: 'Versão atual do token JWT',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  versaoToken!: string;

  @ApiProperty({
    description: 'Primeiro dia da semana configurado pelo usuário',
    enum: DiaSemana,
    enumName: 'DiaSemana',
    example: DiaSemana.Dom,
  })
  primeiroDiaSemana!: DiaSemana;

  @ApiProperty({
    description: 'Intervalos de revisões automáticas configurados',
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
