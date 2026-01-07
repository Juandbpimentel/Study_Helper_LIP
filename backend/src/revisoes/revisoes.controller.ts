import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RevisoesService } from './revisoes.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@/auth/types';
import { ConcluirRevisaoDto } from './dto/concluir-revisao.dto';
import { AdiarRevisaoDto } from './dto/adiar-revisao.dto';
import { ListarRevisoesQueryDto } from './dto/listar-revisoes.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  RevisaoProgramadaBasicaResponseDto,
  RevisaoProgramadaDetalhadaResponseDto,
} from './dto/revisao-response.dto';

@UseGuards(JwtAuthGuard)
@ApiTags('Revisões Programadas')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('revisoes')
export class RevisoesController {
  constructor(private readonly revisoesService: RevisoesService) {}

  @ApiOperation({
    summary: 'Listar revisões programadas',
    description:
      'Retorna as revisões do usuário, atualizando automaticamente o status com base nas datas. Permite filtros por status e intervalo de datas.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtra revisões por status atual.',
    enum: ['Pendente', 'Concluida', 'Adiada', 'Atrasada'],
  })
  @ApiQuery({
    name: 'dataInicial',
    required: false,
    description: 'Data inicial (inclusive) para o filtro em formato ISO.',
    type: String,
    format: 'date-time',
  })
  @ApiQuery({
    name: 'dataFinal',
    required: false,
    description: 'Data final (inclusive) para o filtro em formato ISO.',
    type: String,
    format: 'date-time',
  })
  @ApiOkResponse({
    description: 'Lista de revisões retornada com sucesso.',
    type: RevisaoProgramadaDetalhadaResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'Parâmetros de filtro inválidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente ou inválido.',
  })
  @Get()
  listar(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListarRevisoesQueryDto,
  ) {
    return this.revisoesService.listar(req.user.id, query);
  }

  @ApiOperation({
    summary: 'Concluir revisão programada',
    description:
      'Registra a conclusão da revisão informada, gerando automaticamente o registro de estudo correspondente e atualizando o status.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador da revisão a ser concluída',
    example: 10,
  })
  @ApiBody({
    type: ConcluirRevisaoDto,
    description: 'Informações referentes à conclusão da revisão.',
  })
  @ApiOkResponse({
    description: 'Revisão concluída com sucesso.',
    type: RevisaoProgramadaDetalhadaResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou revisão já concluída.',
  })
  @ApiNotFoundResponse({
    description: 'Revisão não encontrada para o usuário.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente ou inválido.',
  })
  @Patch(':id/concluir')
  concluir(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConcluirRevisaoDto,
  ) {
    return this.revisoesService.concluir(req.user.id, id, dto);
  }

  @ApiOperation({
    summary: 'Adiar revisão programada',
    description:
      'Atualiza a data planejada da revisão, mantendo a rastreabilidade do status e garantindo que não seja possível adiar revisões já concluídas.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador da revisão a ser adiada',
    example: 12,
  })
  @ApiBody({
    type: AdiarRevisaoDto,
    description: 'Nova data planejada para a revisão.',
  })
  @ApiOkResponse({
    description: 'Revisão adiada com sucesso.',
    type: RevisaoProgramadaBasicaResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Nova data inválida ou revisão já concluída.',
  })
  @ApiNotFoundResponse({
    description: 'Revisão não encontrada para o usuário.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente ou inválido.',
  })
  @Patch(':id/adiar')
  adiar(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdiarRevisaoDto,
  ) {
    return this.revisoesService.adiar(req.user.id, id, dto);
  }
}
