-- CreateTable
CREATE TABLE "paymaster_usage" (
    "id" TEXT NOT NULL,
    "privyUserId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "amountWei" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paymaster_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "paymaster_usage_privyUserId_createdAt_idx" ON "paymaster_usage"("privyUserId", "createdAt");
