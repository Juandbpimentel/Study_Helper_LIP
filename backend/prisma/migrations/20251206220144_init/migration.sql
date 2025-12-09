-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab');

-- CreateEnum
CREATE TYPE "TipoRegistro" AS ENUM ('EstudoDeTema', 'Revisao', 'EstudoAberto');

-- CreateEnum
CREATE TYPE "StatusRevisao" AS ENUM ('Pendente', 'Concluida', 'Adiada', 'Atrasada');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "versao_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "primeiro_dia_semana" "DiaSemana" NOT NULL DEFAULT 'Dom',
    "planejamento_revisoes" INTEGER[] DEFAULT ARRAY[1, 7, 14]::INTEGER[],

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cronogramas" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3) NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cronogramas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temas_de_estudo" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tema" VARCHAR(255) NOT NULL,
    "descricao" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temas_de_estudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slots_estudo" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "cronograma_id" INTEGER NOT NULL,
    "tema_id" INTEGER NOT NULL,
    "dia_semana" "DiaSemana" NOT NULL,
    "ordem" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slots_estudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_estudo" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tema_id" INTEGER NOT NULL,
    "slot_id" INTEGER,
    "tempo_dedicado" INTEGER NOT NULL,
    "conteudo_estudado" VARCHAR(1000),
    "tipo_registro" "TipoRegistro" NOT NULL DEFAULT 'EstudoDeTema',
    "data_estudo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_estudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revisoes" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tema_id" INTEGER NOT NULL,
    "slot_id" INTEGER,
    "registro_origem_id" INTEGER NOT NULL,
    "registro_conclusao_id" INTEGER,
    "data_revisao" TIMESTAMP(3) NOT NULL,
    "status_revisao" "StatusRevisao" NOT NULL DEFAULT 'Pendente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revisoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "slots_estudo_usuario_id_dia_semana_idx" ON "slots_estudo"("usuario_id", "dia_semana");

-- CreateIndex
CREATE INDEX "registros_estudo_usuario_id_data_estudo_idx" ON "registros_estudo"("usuario_id", "data_estudo");

-- CreateIndex
CREATE UNIQUE INDEX "revisoes_registro_conclusao_id_key" ON "revisoes"("registro_conclusao_id");

-- CreateIndex
CREATE INDEX "revisoes_usuario_id_data_revisao_idx" ON "revisoes"("usuario_id", "data_revisao");

-- AddForeignKey
ALTER TABLE "cronogramas" ADD CONSTRAINT "cronogramas_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temas_de_estudo" ADD CONSTRAINT "temas_de_estudo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots_estudo" ADD CONSTRAINT "slots_estudo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots_estudo" ADD CONSTRAINT "slots_estudo_cronograma_id_fkey" FOREIGN KEY ("cronograma_id") REFERENCES "cronogramas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots_estudo" ADD CONSTRAINT "slots_estudo_tema_id_fkey" FOREIGN KEY ("tema_id") REFERENCES "temas_de_estudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_estudo" ADD CONSTRAINT "registros_estudo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_estudo" ADD CONSTRAINT "registros_estudo_tema_id_fkey" FOREIGN KEY ("tema_id") REFERENCES "temas_de_estudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_estudo" ADD CONSTRAINT "registros_estudo_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "slots_estudo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisoes" ADD CONSTRAINT "revisoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisoes" ADD CONSTRAINT "revisoes_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "slots_estudo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisoes" ADD CONSTRAINT "revisoes_registro_origem_id_fkey" FOREIGN KEY ("registro_origem_id") REFERENCES "registros_estudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisoes" ADD CONSTRAINT "revisoes_registro_conclusao_id_fkey" FOREIGN KEY ("registro_conclusao_id") REFERENCES "registros_estudo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
