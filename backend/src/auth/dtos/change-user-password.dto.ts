import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeUserPasswordDto {
  @ApiProperty({ description: 'Senha atual para validação antes da troca' })
  @IsString()
  @IsNotEmpty()
  senhaAntiga: string;

  @ApiProperty({
    description:
      'Nova senha com no mínimo 6 caracteres, contendo letras, números e símbolos',
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
  novaSenha: string;
}
