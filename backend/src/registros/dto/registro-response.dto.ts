import { ApiExtraModels } from '@nestjs/swagger';
import {
  RegistroEstudoComDetalhesDto,
  RegistroEstudoCompletoDto,
} from '@/common/dto/api-entities.dto';

@ApiExtraModels(RegistroEstudoComDetalhesDto, RegistroEstudoCompletoDto)
export class RegistroCriadoResponseDto extends RegistroEstudoComDetalhesDto {}

@ApiExtraModels(RegistroEstudoComDetalhesDto, RegistroEstudoCompletoDto)
export class RegistroListagemItemDto extends RegistroEstudoCompletoDto {}
