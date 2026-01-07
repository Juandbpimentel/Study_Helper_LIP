import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CronogramasService } from './cronogramas.service';
import { UpsertCronogramaDto } from './dto/upsert-cronograma.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@/auth/types';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CronogramaComStatusResponseDto } from './dto/cronograma-response.dto';

@UseGuards(JwtAuthGuard)
@ApiTags('Cronogramas')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('cronograma')
export class CronogramasController {
  constructor(private readonly cronogramasService: CronogramasService) {}

  @ApiOperation({
    summary: 'Obter cronograma com status dos slots',
    description:
      'Retorna os slots planejados da semana selecionada, indicando quais foram concluídos, estão pendentes ou atrasados.',
  })
  @ApiQuery({
    name: 'referencia',
    required: false,
    description:
      'Data ISO usada como referência para montar a semana. Caso omitida, considera a data atual.',
    type: String,
    format: 'date-time',
  })
  @ApiOkResponse({
    description: 'Cronograma retornado com sucesso.',
    type: CronogramaComStatusResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente ou inválido.',
  })
  @Get()
  obter(
    @Req() req: AuthenticatedRequest,
    @Query('referencia') referencia?: string,
  ) {
    return this.cronogramasService.obterCronogramaComStatus(
      req.user.id,
      referencia,
    );
  }

  @ApiOperation({
    summary: 'Criar ou atualizar cronograma semanal',
    description:
      'Substitui a configuração atual de slots do cronograma pela lista informada, validando a propriedade dos temas antes de persistir.',
  })
  @ApiBody({
    type: UpsertCronogramaDto,
    description:
      'Lista ordenada de slots. Slots existentes devem informar o id, novos slots são criados automaticamente.',
  })
  @ApiOkResponse({
    description: 'Cronograma salvo e retornado com o status atualizado.',
    type: CronogramaComStatusResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Algum tema não pertence ao usuário autenticado ou dados inválidos.',
  })
  @ApiNotFoundResponse({
    description: 'Algum slot informado não foi localizado para o usuário.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente ou inválido.',
  })
  @Put()
  atualizar(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertCronogramaDto,
  ) {
    return this.cronogramasService.upsert(req.user.id, dto);
  }
}
