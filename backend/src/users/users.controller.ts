import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@/auth/types';
import { OfensivaDto } from '@/ofensiva/dto/ofensiva.dto';
import { OfensivaService } from '@/ofensiva/ofensiva.service';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService, type PublicUser } from './users.service';

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

  @ApiOperation({
    summary: 'Obter ofensiva do usuário logado',
    description:
      'Retorna o resumo de ofensiva/bloqueios do usuário autenticado. Útil para o front atualizar UI sem depender de outros endpoints.',
  })
  @ApiResponse({ status: 200, type: OfensivaDto })
  @Get('me/ofensiva')
  meOfensiva(@Req() req: AuthenticatedRequest): OfensivaDto {
    return this.ofensivaService.fromUsuario(req.user);
  }

  @ApiOperation({
    summary: 'Buscar usuário por id',
    description:
      'Retorna os dados do próprio usuário autenticado (não permite consultar outros usuários).',
  })
  @ApiParam({ name: 'id', description: 'Identificador do usuário', example: 1 })
  @ApiOkResponse({ description: 'Usuário localizado.', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<PublicUser> {
    if (req.user.id !== id) {
      throw new UnauthorizedException(
        'Você não tem permissão para acessar este usuário',
      );
    }
    return await this.usersService.findByIdOrThrowPublic(id);
  }

  @ApiOperation({
    summary: 'Atualizar perfil de usuário',
    description: 'Permite que o próprio usuário atualize dados do perfil.',
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
    @Body(new ValidationPipe({ skipMissingProperties: true, transform: true }))
    updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<PublicUser> {
    if (req.user.id !== id) {
      throw new UnauthorizedException(
        'Você não tem permissão para atualizar este usuário',
      );
    }
    return this.usersService.updatePublic(id, updateUserDto);
  }

  @ApiOperation({
    summary: 'Atualizar preferências do cronograma/atraso',
    description:
      'Permite que o próprio usuário ajuste limites e regras de atraso do cronograma e revisões.',
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
  ): Promise<PublicUser> {
    if (req.user.id !== id) {
      throw new UnauthorizedException(
        'Você não tem permissão para atualizar este usuário',
      );
    }
    return this.usersService.updatePreferencesPublic(id, dto);
  }

  @ApiOperation({
    summary: 'Remover usuário',
    description: 'Permite que o próprio usuário remova a própria conta.',
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
  ): Promise<PublicUser> {
    if (req.user.id != id) {
      throw new UnauthorizedException('Você não pode deletar outro usuário');
    }
    return this.usersService.removePublic(id);
  }
}
