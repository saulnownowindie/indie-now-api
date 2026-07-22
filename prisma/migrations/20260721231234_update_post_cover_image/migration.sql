/*
  Warnings:

  - You are about to drop the column `coverImage` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `coverVideo` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "coverImage",
DROP COLUMN "coverVideo",
ADD COLUMN     "coverImageId" INTEGER;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
