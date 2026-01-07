import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import {
  RegistroEstudoBaseDto,
  SlotCronogramaDto,
  TemaDeEstudoDto,
} from '@/common/dto/api-entities.dto';

export class ThemeResponseDto extends TemaDeEstudoDto {}

export class ThemeCountersDto {
  @ApiProperty({
    description: 'Quantidade de slots do cronograma associados ao tema',
  })
  slots!: number;

  @ApiProperty({
    description: 'Quantidade de registros de estudo associados ao tema',
  })
  registros!: number;
}

@ApiExtraModels(ThemeResponseDto, SlotCronogramaDto, RegistroEstudoBaseDto)
export class ThemeWithCountersResponseDto extends ThemeResponseDto {
  @ApiProperty({
    description: 'Contadores de uso do tema',
    type: () => ThemeCountersDto,
  })
  _count!: ThemeCountersDto;
}

@ApiExtraModels(ThemeResponseDto, SlotCronogramaDto, RegistroEstudoBaseDto)
export class ThemeDetailResponseDto extends ThemeResponseDto {
  @ApiProperty({
    description: 'Slots do cronograma que utilizam este tema',
    type: () => [SlotCronogramaDto],
  })
  slots!: SlotCronogramaDto[];

  @ApiProperty({
    description: 'Registros mais recentes que utilizaram o tema',
    type: () => [RegistroEstudoBaseDto],
  })
  registros!: RegistroEstudoBaseDto[];
}
