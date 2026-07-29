-- DropForeignKey
ALTER TABLE "Playlist" DROP CONSTRAINT "Playlist_coverImageId_fkey";

-- AlterTable
ALTER TABLE "Playlist" DROP COLUMN "coverImageId",
DROP COLUMN "url",
ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "ownerName" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "spotifyId" TEXT NOT NULL,
ADD COLUMN     "spotifySnapshotId" TEXT,
ADD COLUMN     "spotifySyncedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "spotifyUrl" TEXT NOT NULL,
ADD COLUMN     "tracksCount" INTEGER,
ALTER COLUMN "platform" SET DEFAULT 'SPOTIFY';

-- CreateIndex
CREATE UNIQUE INDEX "Playlist_spotifyId_key" ON "Playlist"("spotifyId");

-- CreateIndex
CREATE UNIQUE INDEX "Playlist_spotifyUrl_key" ON "Playlist"("spotifyUrl");

-- CreateIndex
CREATE INDEX "Playlist_status_isVisible_featured_sortOrder_idx" ON "Playlist"("status", "isVisible", "featured", "sortOrder");
