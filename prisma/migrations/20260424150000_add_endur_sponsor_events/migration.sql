-- CreateTable
CREATE TABLE "endur_sponsor_events" (
    "id" TEXT NOT NULL,
    "privyUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endur_sponsor_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "endur_sponsor_events_privyUserId_createdAt_idx" ON "endur_sponsor_events"("privyUserId", "createdAt");
