-- CreateEnum
CREATE TYPE "HomeSection" AS ENUM ('LO_NUEVO', 'NOTICIAS', 'REELS', 'NO_PODES_PERDERTE');

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "homeSection" "HomeSection" NOT NULL DEFAULT 'NOTICIAS',
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Reel" ADD COLUMN     "homeSection" "HomeSection" NOT NULL DEFAULT 'REELS',
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "News_homeSection_sortOrder_idx" ON "News"("homeSection", "sortOrder");

-- CreateIndex
CREATE INDEX "Reel_homeSection_sortOrder_idx" ON "Reel"("homeSection", "sortOrder");
