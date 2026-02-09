-- CreateTable
CREATE TABLE "privy_wallets" (
    "id" TEXT NOT NULL,
    "privyUserId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "isDeployed" BOOLEAN NOT NULL DEFAULT false,
    "deploymentTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "privy_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "privy_wallets_privyUserId_key" ON "privy_wallets"("privyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "privy_wallets_walletId_key" ON "privy_wallets"("walletId");

-- CreateIndex
CREATE INDEX "privy_wallets_privyUserId_idx" ON "privy_wallets"("privyUserId");

-- CreateIndex
CREATE INDEX "privy_wallets_walletId_idx" ON "privy_wallets"("walletId");
