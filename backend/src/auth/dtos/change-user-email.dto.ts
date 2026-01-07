import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeUserEmailDto {
  @ApiProperty({ description: 'Senha atual do usuário para confirmação' })
  @IsString()
  @IsNotEmpty()
  senha: string;

  @ApiProperty({ description: 'Novo email que substituirá o email atual' })
  @IsEmail()
  novoEmail: string;
}
