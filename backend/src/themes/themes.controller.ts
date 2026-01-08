import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ThemesService } from './themes.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@/auth/types';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiCreatedResponse,
  ApiQuery,
} from '@nestjs/swagger';
import {
  ThemeDetailResponseDto,
  ThemeResponseDto,
  ThemeWithCountersResponseDto,
} from './dto/theme-response.dto';
import { ListThemesQueryDto } from './dto/list-themes.dto';

@UseGuards(JwtAuthGuard)
@ApiTags('Temas de Estudo')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('themes')
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @ApiOperation({
    summary: 'Criar tema de estudo',
    description:
      'Registra um novo tema de estudo associado ao usuário autenticado.',
  })
  @ApiBody({ type: CreateThemeDto, description: 'Dados do novo tema.' })
  @ApiCreatedResponse({
    description: 'Tema criado com sucesso.',
    type: ThemeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos enviados na requisição.',
  })
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateThemeDto) {
    return this.themesService.create(req.user.id, dto);
  }

  @ApiOperation({
    summary: 'Listar temas de estudo',
    description:
      'Retorna os temas cadastrados pelo usuário com contadores de uso em slots e registros.',
  })
  @ApiOkResponse({
    description: 'Lista de temas retornada com sucesso.',
    type: ThemeWithCountersResponseDto,
    isArray: true,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'all', required: false, type: Boolean })
  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListThemesQueryDto,
  ) {
    return this.themesService.findAll(req.user.id, query);
  }

  @ApiOperation({
    summary: 'Consultar tema específico',
    description:
      'Retorna detalhes do tema, slots que o utilizam e registros recentes associados.',
  })
  @ApiParam({ name: 'id', description: 'Identificador do tema', example: 5 })
  @ApiOkResponse({
    description: 'Tema localizado com sucesso.',
    type: ThemeDetailResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Tema não encontrado para o usuário.',
  })
  @Get(':id')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.themesService.findOne(req.user.id, id);
  }

  @ApiOperation({
    summary: 'Atualizar tema de estudo',
    description: 'Permite alterar os atributos do tema selecionado.',
  })
  @ApiParam({ name: 'id', description: 'Identificador do tema', example: 5 })
  @ApiBody({ type: UpdateThemeDto, description: 'Campos a serem atualizados.' })
  @ApiOkResponse({
    description: 'Tema atualizado com sucesso.',
    type: ThemeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Valores inválidos informados.',
  })
  @ApiNotFoundResponse({
    description: 'Tema não encontrado para o usuário.',
  })
  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateThemeDto,
  ) {
    return this.themesService.update(req.user.id, id, dto);
  }

  @ApiOperation({
    summary: 'Remover tema de estudo',
    description: 'Exclui o tema selecionado após validar a propriedade.',
  })
  @ApiParam({ name: 'id', description: 'Identificador do tema', example: 5 })
  @ApiOkResponse({
    description: 'Tema removido com sucesso.',
    type: ThemeResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Tema não encontrado para o usuário.',
  })
  @Delete(':id')
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.themesService.remove(req.user.id, id);
  }
}
