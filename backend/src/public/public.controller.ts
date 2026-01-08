import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

@ApiTags('Público')
@Controller()
export class PublicController {
  @ApiExcludeEndpoint()
  @Get('privacy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  privacy(@Res() res: Response) {
    return res.send(`<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Política de Privacidade - Study Helper</title>
  </head>
  <body>
    <h1>Política de Privacidade - Study Helper</h1>
    <p>
      Esta é uma página de política de privacidade para uso em desenvolvimento/testes do
      aplicativo Study Helper.
    </p>
    <p>
      Dados coletados: o aplicativo pode armazenar dados de conta e informações necessárias
      para sincronização com o Google Calendar (tokens de acesso/refresh e IDs de eventos).
    </p>
    <p>
      Finalidade: permitir autenticação e sincronização automática de cronogramas/revisões no
      Google Calendar.
    </p>
    <p>
      Contato: juandbpimentel@gmail.com
    </p>
  </body>
</html>`);
  }

  @ApiExcludeEndpoint()
  @Get('terms')
  @Header('Content-Type', 'text/html; charset=utf-8')
  terms(@Res() res: Response) {
    return res.send(`<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Termos de Serviço - Study Helper</title>
  </head>
  <body>
        <h1>Termos de Serviço - Study Helper</h1>
        <p>
        Estes termos são fornecidos para uso em desenvolvimento/testes do aplicativo Study Helper.
        </p>
        
        <p>
            Ao utilizar o serviço, você concorda com estes termos.
        </p>

        <p>
            O serviço é fornecido “como está”, sem garantias, e pode sofrer alterações a qualquer momento. 
        </p>
        <p>
            Não iremos usar nenhuma informação pessoal para fins comerciais.
        </p>
        <p>
            Você é responsável por manter a segurança de sua conta e dados.
        </p>
        <p>
            Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos.
        </p>
        <p>
            Estes termos podem ser atualizados periodicamente; recomendamos revisá-los regularmente.
        </p>
        <p>
            Contato: juandbpimentel@gmail.com
        </p>
    </body>
</html>`);
  }

  @ApiExcludeEndpoint()
  @Get('home')
  home(@Res() res: Response) {
    return res.redirect('/docs');
  }
}
