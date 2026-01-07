import { ApiExtraModels } from '@nestjs/swagger';
import {
  RevisaoProgramadaBaseDto,
  RevisaoProgramadaDetalheDto,
} from '@/common/dto/api-entities.dto';

@ApiExtraModels(RevisaoProgramadaBaseDto, RevisaoProgramadaDetalheDto)
export class RevisaoProgramadaDetalhadaResponseDto extends RevisaoProgramadaDetalheDto {}

@ApiExtraModels(RevisaoProgramadaBaseDto, RevisaoProgramadaDetalheDto)
export class RevisaoProgramadaBasicaResponseDto extends RevisaoProgramadaBaseDto {}
