-- CreateTable
CREATE TABLE "portfolio_snapshot_cache" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "blockNumber" INTEGER,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_snapshot_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_snapshot_cache_address_key" ON "portfolio_snapshot_cache"("address");

-- CreateIndex
CREATE INDEX "portfolio_snapshot_cache_fetchedAt_idx" ON "portfolio_snapshot_cache"("fetchedAt");

