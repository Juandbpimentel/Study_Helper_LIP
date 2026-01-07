import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RegistrosService } from './registros.service';
import {
  CreateRegistroDto,
  ListRegistrosQueryDto,
} from './dto/create-registro.dto';
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
import {
  RegistroCriadoResponseDto,
  RegistroListagemItemDto,
} from './dto/registro-response.dto';

@UseGuards(JwtAuthGuard)
@ApiTags('Registros de Estudo')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('registros')
export class RegistrosController {
  constructor(private readonly registrosService: RegistrosService) {}

  @ApiOperation({
    summary: 'Listar registros de estudo',
    description:
      'Retorna os registros do usuário autenticado, permitindo filtrar por data específica. Inclui tema, slot e revisões geradas.',
  })
  @ApiQuery({
    name: 'data',
    required: false,
    description: 'Filtra registros pelo dia informado (formato ISO).',
    type: String,
    format: 'date-time',
  })
  @ApiOkResponse({
    description: 'Lista de registros retornada com sucesso.',
    type: RegistroListagemItemDto,
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
    @Query() query: ListRegistrosQueryDto,
  ) {
    return this.registrosService.listar(req.user.id, query);
  }

  @ApiOperation({
    summary: 'Registrar novo estudo ou revisão',
    description:
      'Cria um registro validando regras de negócio entre temas, slots e revisões programadas. Pode gerar novas revisões automaticamente.',
  })
  @ApiBody({
    type: CreateRegistroDto,
    description:
      'Informe o tipo do registro, tempo dedicado e, quando necessário, referências ao tema, slot ou revisão programada.',
  })
  @ApiOkResponse({
    description: 'Registro criado com sucesso.',
    type: RegistroCriadoResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Regras de negócio violadas ou dados inválidos.',
  })
  @ApiNotFoundResponse({
    description: 'Tema, slot ou revisão informados não pertencem ao usuário.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente ou inválido.',
  })
  @Post()
  criar(@Req() req: AuthenticatedRequest, @Body() dto: CreateRegistroDto) {
    return this.registrosService.criar(req.user.id, dto);
  }
}
