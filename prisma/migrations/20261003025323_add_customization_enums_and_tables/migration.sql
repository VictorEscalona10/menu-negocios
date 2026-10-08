-- CreateEnum
CREATE TYPE "CustomizationMode" AS ENUM ('THEME', 'AVANCED');

-- CreateEnum
CREATE TYPE "TemplateScope" AS ENUM ('FULL_PAGE', 'SECTION');

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "customizationMode" "CustomizationMode" NOT NULL DEFAULT 'THEME';

-- CreateTable
CREATE TABLE "CustomizationLayout" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "layoutJson" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomizationLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomizationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "TemplateScope" NOT NULL,
    "sectionType" TEXT,
    "previewUrl" TEXT NOT NULL,
    "configJson" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "storeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomizationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomizationImage" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "bucketPath" TEXT NOT NULL,
    "altText" TEXT,
    "sectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomizationImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomizationLayout_storeId_key" ON "CustomizationLayout"("storeId");

-- AddForeignKey
ALTER TABLE "CustomizationLayout" ADD CONSTRAINT "CustomizationLayout_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomizationTemplate" ADD CONSTRAINT "CustomizationTemplate_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomizationImage" ADD CONSTRAINT "CustomizationImage_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
