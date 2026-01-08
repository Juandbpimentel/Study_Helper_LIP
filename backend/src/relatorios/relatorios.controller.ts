import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@/auth/types';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResumoRelatorioResponseDto } from './dto/resumo-response.dto';
import { ResumoRelatorioQueryDto } from './dto/resumo-query.dto';
import type { Response } from 'express';
import { PdfService } from '@/integrations/pdf/pdf.service';

@UseGuards(JwtAuthGuard)
@ApiTags('Relatórios')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('relatorios')
export class RelatoriosController {
  constructor(
    private readonly relatoriosService: RelatoriosService,
    private readonly pdf: PdfService,
  ) {}

  @ApiOperation({
    summary: 'Resumo consolidado do desempenho',
    description:
      'Retorna métricas agregadas de estudos e revisões do usuário autenticado, além do ranking de temas com melhor desempenho.',
  })
  @ApiOkResponse({
    description: 'Resumo gerado com sucesso.',
    type: ResumoRelatorioResponseDto,
  })
  @ApiQuery({
    name: 'dataInicial',
    required: false,
    type: String,
    description:
      'Data inicial (inclusive) do período em formato ISO (date ou date-time).',
  })
  @ApiQuery({
    name: 'dataFinal',
    required: false,
    type: String,
    description:
      'Data final (inclusive) do período em formato ISO (date ou date-time).',
  })
  @ApiQuery({
    name: 'temaId',
    required: false,
    type: Number,
    description: 'Filtra o relatório para um tema específico (id do tema).',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente ou inválido.',
  })
  @Get('resumo')
  resumo(
    @Req() req: AuthenticatedRequest,
    @Query() query: ResumoRelatorioQueryDto,
  ) {
    return this.relatoriosService.resumo(req.user.id, query);
  }

  @ApiOperation({
    summary: 'Resumo consolidado (PDF)',
    description:
      'Gera um PDF do resumo consolidado usando o PDF microservice (opcional).',
  })
  @ApiProduces('application/pdf')
  @ApiOkResponse({
    description: 'PDF gerado com sucesso.',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiQuery({
    name: 'dataInicial',
    required: false,
    type: String,
    description:
      'Data inicial (inclusive) do período em formato ISO (date ou date-time).',
  })
  @ApiQuery({
    name: 'dataFinal',
    required: false,
    type: String,
    description:
      'Data final (inclusive) do período em formato ISO (date ou date-time).',
  })
  @ApiQuery({
    name: 'temaId',
    required: false,
    type: Number,
    description: 'Filtra o relatório para um tema específico (id do tema).',
  })
  @Get('resumo/pdf')
  async resumoPdf(
    @Req() req: AuthenticatedRequest,
    @Query() query: ResumoRelatorioQueryDto,
    @Res() res: Response,
  ) {
    const pdfRequest = await this.relatoriosService.buildResumoPdfRequest(
      req.user.id,
      query,
    );
    const { buffer, contentDisposition } =
      await this.pdf.generatePdf(pdfRequest);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      contentDisposition ?? 'attachment; filename="relatorio_resumo.pdf"',
    );

    return res.send(buffer);
  }
}
