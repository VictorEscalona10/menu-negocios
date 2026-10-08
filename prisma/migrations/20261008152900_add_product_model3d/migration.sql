-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "model3dError" TEXT,
ADD COLUMN     "model3dSources" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "model3dStatus" TEXT,
ADD COLUMN     "model3dTaskId" TEXT,
ADD COLUMN     "model3dThumbUrl" TEXT,
ADD COLUMN     "model3dUrl" TEXT;
