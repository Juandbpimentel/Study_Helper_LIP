import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiaSemana, StatusRevisao, TipoRegistro } from '@prisma/client';

export class TemaDeEstudoDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ description: 'Nome do tema de estudo' })
  tema!: string;

  @ApiPropertyOptional({
    description: 'Descrição resumida do tema',
    nullable: true,
  })
  descricao?: string | null;

  @ApiPropertyOptional({
    description: 'Cor representativa no formato hexadecimal',
    example: '#3366FF',
    nullable: true,
  })
  cor?: string | null;

  @ApiProperty({ description: 'Identificador do criador' })
  creatorId!: number;

  @ApiProperty({
    description: 'Data de criação',
    type: String,
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Data da última atualização',
    type: String,
    format: 'date-time',
  })
  updatedAt!: string;
}

export class SlotCronogramaDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ description: 'Identificador do usuário dono do slot' })
  creatorId!: number;

  @ApiProperty({
    description: 'Dia da semana do slot',
    enum: DiaSemana,
    enumName: 'DiaSemana',
  })
  diaSemana!: DiaSemana;

  @ApiProperty({ description: 'Ordem do slot dentro do dia', example: 0 })
  ordem!: number | null;

  @ApiProperty({ description: 'Identificador do cronograma semanal' })
  cronogramaId!: number;

  @ApiProperty({ description: 'Identificador do tema vinculado' })
  temaId!: number;

  @ApiProperty({
    description: 'Data de criação',
    type: String,
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Data da última atualização',
    type: String,
    format: 'date-time',
  })
  updatedAt!: string;

  @ApiPropertyOptional({
    description: 'Tema associado ao slot',
    type: () => TemaDeEstudoDto,
    nullable: true,
  })
  tema?: TemaDeEstudoDto | null;
}

export class RegistroEstudoBaseDto {
  @ApiProperty({ example: 40 })
  id!: number;

  @ApiProperty({ description: 'Tempo dedicado em minutos', example: 90 })
  tempoDedicado!: number;

  @ApiPropertyOptional({
    description: 'Resumo do conteúdo estudado',
    nullable: true,
  })
  conteudoEstudado?: string | null;

  @ApiProperty({
    description: 'Tipo do registro',
    enum: TipoRegistro,
    enumName: 'TipoRegistro',
  })
  tipoRegistro!: TipoRegistro;

  @ApiProperty({
    description: 'Data e hora em que o estudo ocorreu',
    type: String,
    format: 'date-time',
  })
  dataEstudo!: string;

  @ApiPropertyOptional({
    description: 'Identificador do tema associado',
    nullable: true,
  })
  temaId?: number | null;

  @ApiPropertyOptional({
    description: 'Identificador do slot utilizado',
    nullable: true,
  })
  slotId?: number | null;

  @ApiProperty({ description: 'Identificador do usuário que criou o registro' })
  creatorId!: number;

  @ApiProperty({
    description: 'Data de criação',
    type: String,
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Data da última atualização',
    type: String,
    format: 'date-time',
  })
  updatedAt!: string;
}

export class RegistroEstudoComDetalhesDto extends RegistroEstudoBaseDto {
  @ApiPropertyOptional({
    description: 'Tema associado ao registro',
    type: () => TemaDeEstudoDto,
    nullable: true,
  })
  tema?: TemaDeEstudoDto | null;

  @ApiPropertyOptional({
    description: 'Slot do cronograma associado',
    type: () => SlotCronogramaDto,
    nullable: true,
  })
  slotCronograma?: SlotCronogramaDto | null;
}

export class RevisaoProgramadaBaseDto {
  @ApiProperty({ example: 22 })
  id!: number;

  @ApiProperty({
    description: 'Data planejada para a revisão',
    type: String,
    format: 'date-time',
  })
  dataRevisao!: string;

  @ApiProperty({
    description: 'Status atual da revisão',
    enum: StatusRevisao,
    enumName: 'StatusRevisao',
  })
  statusRevisao!: StatusRevisao;

  @ApiProperty({ description: 'Identificador do registro de origem' })
  registroOrigemId!: number;

  @ApiPropertyOptional({
    description: 'Identificador do registro de conclusão',
    nullable: true,
  })
  registroConclusaoId?: number | null;

  @ApiPropertyOptional({
    description: 'Identificador do slot associado',
    nullable: true,
  })
  slotCronogramaId?: number | null;

  @ApiProperty({ description: 'Identificador do usuário dono da revisão' })
  creatorId!: number;

  @ApiProperty({
    description: 'Data de criação',
    type: String,
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Data da última atualização',
    type: String,
    format: 'date-time',
  })
  updatedAt!: string;
}

export class RevisaoProgramadaDetalheDto extends RevisaoProgramadaBaseDto {
  @ApiPropertyOptional({
    description: 'Registro que originou a revisão',
    type: () => RegistroEstudoComDetalhesDto,
    nullable: true,
  })
  registroOrigem?: RegistroEstudoComDetalhesDto | null;

  @ApiPropertyOptional({
    description: 'Registro que concluiu a revisão',
    type: () => RegistroEstudoBaseDto,
    nullable: true,
  })
  registroConclusao?: RegistroEstudoBaseDto | null;
}

export class RegistroEstudoCompletoDto extends RegistroEstudoComDetalhesDto {
  @ApiProperty({
    description: 'Revisões programadas geradas a partir do registro',
    type: () => [RevisaoProgramadaBaseDto],
  })
  revisoesGeradas!: RevisaoProgramadaBaseDto[];

  @ApiPropertyOptional({
    description: 'Revisão programada concluída por este registro',
    type: () => RevisaoProgramadaBaseDto,
    nullable: true,
  })
  revisaoConcluida?: RevisaoProgramadaBaseDto | null;
}
