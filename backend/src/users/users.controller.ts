import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminGuard } from '@/auth/guards/admin.guard';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@/auth/types';
import { OfensivaDto } from '@/ofensiva/dto/ofensiva.dto';
import { OfensivaService } from '@/ofensiva/ofensiva.service';
import { ListUsersQueryDto } from './dto/list-users.dto';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@ApiTags('Usuários')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly ofensivaService: OfensivaService,
  ) {}

  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Listar usuários',
    description:
      'Disponível apenas para administradores. Retorna todos os usuários cadastrados.',
  })
  @ApiOkResponse({
    description: 'Lista de usuários retornada com sucesso.',
    type: UserResponseDto,
    isArray: true,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({
    name: 'all',
    required: false,
    type: Boolean,
    description: 'Quando true, retorna sem paginação.',
  })
  @ApiForbiddenResponse({
    description: 'Usuário autenticado não possui privilégios administrativos.',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  @Get()
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @ApiOperation({
    summary: 'Obter ofensiva do usuário logado',
    description:
      'Retorna o resumo de ofensiva/bloqueios do usuário autenticado. Útil para o front atualizar UI sem depender de outros endpoints.',
  })
  @ApiResponse({ status: 200, type: OfensivaDto })
  @Get('me/ofensiva')
  async meOfensiva(@Req() req: AuthenticatedRequest): Promise<OfensivaDto> {
    const usuario = await this.usersService.findByIdOrThrow(req.user.id);
    return this.ofensivaService.fromUsuario(usuario);
  }

  @ApiOperation({
    summary: 'Buscar usuário por id',
    description: 'Retorna dados do usuário solicitado.',
  })
  @ApiParam({ name: 'id', description: 'Identificador do usuário', example: 1 })
  @ApiOkResponse({ description: 'Usuário localizado.', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.findOne(id);
  }

  @ApiOperation({
    summary: 'Atualizar perfil de usuário',
    description:
      'Permite que o próprio usuário (ou um administrador) atualize dados do perfil.',
  })
  @ApiParam({ name: 'id', description: 'Identificador do usuário', example: 1 })
  @ApiBody({
    type: UpdateUserDto,
    description: 'Campos que serão atualizados.',
  })
  @ApiOkResponse({
    description: 'Usuário atualizado com sucesso.',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos enviados na requisição.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Usuário autenticado não possui permissão para alterar este perfil.',
  })
  @Patch(':id')
  updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.id !== id && !req.user.isAdmin) {
      throw new UnauthorizedException(
        'Você não tem permissão para atualizar este usuário',
      );
    }
    return this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({
    summary: 'Atualizar preferências do cronograma/atraso',
    description:
      'Permite que o próprio usuário (ou um administrador) ajuste limites e regras de atraso do cronograma e revisões.',
  })
  @ApiParam({ name: 'id', description: 'Identificador do usuário', example: 1 })
  @ApiBody({
    type: UpdateUserPreferencesDto,
    description: 'Preferências a serem atualizadas (parcial).',
  })
  @ApiOkResponse({
    description: 'Preferências atualizadas com sucesso.',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Usuário autenticado não possui permissão para alterar este perfil.',
  })
  @Patch(':id/preferences')
  updatePreferences(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserPreferencesDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.id !== id && !req.user.isAdmin) {
      throw new UnauthorizedException(
        'Você não tem permissão para atualizar este usuário',
      );
    }
    return this.usersService.updatePreferences(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({
    summary: 'Definir papel administrativo',
    description:
      'Permite a um administrador conceder ou revogar privilégios administrativos para outro usuário.',
  })
  @ApiParam({ name: 'id', description: 'Identificador do usuário', example: 1 })
  @ApiBody({
    type: UpdateUserRoleDto,
    description: 'Flag indicando se o usuário será administrador.',
  })
  @ApiOkResponse({
    description: 'Papel atualizado com sucesso.',
    type: UserResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Usuário autenticado não possui privilégios administrativos.',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @Patch(':id/role')
  setRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(id, dto.isAdmin);
  }

  @ApiOperation({
    summary: 'Remover usuário',
    description:
      'Permite que o próprio usuário ou um administrador remova a conta selecionada.',
  })
  @ApiParam({ name: 'id', description: 'Identificador do usuário', example: 1 })
  @ApiOkResponse({
    description: 'Usuário removido com sucesso.',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Usuário autenticado não possui permissão para remover esta conta.',
  })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.id != id && !req.user.isAdmin) {
      throw new UnauthorizedException('Você não pode deletar outro usuário');
    }
    return this.usersService.remove(id);
  }
}
