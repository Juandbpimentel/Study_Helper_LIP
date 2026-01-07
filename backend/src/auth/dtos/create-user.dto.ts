import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome completo do usuário' })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({ description: 'Email utilizado para login' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description:
      'Senha com no mínimo 6 caracteres contendo letras maiúsculas, minúsculas, números e símbolos',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @IsStrongPassword({
    minLength: 6,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  senha!: string;
}
