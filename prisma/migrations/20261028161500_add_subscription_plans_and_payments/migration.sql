-- CreateTable Plan
CREATE TABLE IF NOT EXISTS "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "trialDays" INTEGER NOT NULL DEFAULT 15,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Plan_code_key" ON "Plan"("code");

-- AlterTable Store: Add planId column
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "planId" TEXT;

-- AddForeignKey Store -> Plan
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Store_planId_fkey'
  ) THEN 
    ALTER TABLE "Store" ADD CONSTRAINT "Store_planId_fkey" 
    FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF; 
END $$;

-- CreateTable SubscriptionPayment
CREATE TABLE IF NOT EXISTS "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amountUsd" DOUBLE PRECISION NOT NULL,
    "amountBs" DOUBLE PRECISION,
    "bcvRate" DOUBLE PRECISION,
    "gateway" TEXT NOT NULL DEFAULT 'SIMULATED',
    "gatewayRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "periodStartsAt" TIMESTAMP(3) NOT NULL,
    "periodEndsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes on SubscriptionPayment
CREATE INDEX IF NOT EXISTS "SubscriptionPayment_storeId_idx" ON "SubscriptionPayment"("storeId");
CREATE INDEX IF NOT EXISTS "SubscriptionPayment_planId_idx" ON "SubscriptionPayment"("planId");

-- AddForeignKeys SubscriptionPayment -> Store, Plan
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SubscriptionPayment_storeId_fkey'
  ) THEN 
    ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_storeId_fkey" 
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; 

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SubscriptionPayment_planId_fkey'
  ) THEN 
    ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_planId_fkey" 
    FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF; 
END $$;
