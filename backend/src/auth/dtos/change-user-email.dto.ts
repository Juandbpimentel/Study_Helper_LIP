import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ChangeUserEmailDto {
  @IsString()
  @IsNotEmpty()
  senha: string;

  @IsEmail()
  novoEmail: string;
}
