-- CreateTable
CREATE TABLE "google_calendar_integrations" (
    "id" SERIAL NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "calendar_id" TEXT,
    "access_token" TEXT,
    "refresh_token_encrypted" TEXT,
    "token_type" TEXT,
    "scope" TEXT,
    "expiry_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_calendar_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_calendar_integrations_creatorId_key" ON "google_calendar_integrations"("creatorId");

-- AlterTable
ALTER TABLE "slots_cronograma" ADD COLUMN "google_event_id" TEXT;

-- AlterTable
ALTER TABLE "revisoes" ADD COLUMN "google_event_id" TEXT;

-- AddForeignKey
ALTER TABLE "google_calendar_integrations" ADD CONSTRAINT "google_calendar_integrations_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
