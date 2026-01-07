import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Status')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({
    summary: 'Verificar saúde da aplicação',
    description:
      'Endpoint simples utilizado para monitoramento e verificação de disponibilidade do serviço.',
  })
  @ApiOkResponse({
    description: 'Mensagem padrão confirmando o funcionamento do serviço.',
    type: String,
  })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
