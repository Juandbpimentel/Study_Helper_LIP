import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@/auth/types';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResumoRelatorioResponseDto } from './dto/resumo-response.dto';

@UseGuards(JwtAuthGuard)
@ApiTags('Relatórios')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

  @ApiOperation({
    summary: 'Resumo consolidado do desempenho',
    description:
      'Retorna métricas agregadas de estudos e revisões do usuário autenticado, além do ranking de temas com melhor desempenho.',
  })
  @ApiOkResponse({
    description: 'Resumo gerado com sucesso.',
    type: ResumoRelatorioResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente ou inválido.',
  })
  @Get('resumo')
  resumo(@Req() req: AuthenticatedRequest) {
    return this.relatoriosService.resumo(req.user.id);
  }
}
