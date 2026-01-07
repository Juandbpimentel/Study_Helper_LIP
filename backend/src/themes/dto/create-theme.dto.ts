import { IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateThemeDto {
  @ApiProperty({ description: 'Nome do tema de estudo', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  tema!: string;

  @ApiPropertyOptional({
    description: 'Detalhes adicionais sobre o tema',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Cor hexadecimal exibida para o tema',
    example: '#3366FF',
  })
  @IsOptional()
  @IsHexColor()
  cor?: string;
}
