-- Extender las plataformas disponibles para playlists manuales.
ALTER TYPE "MusicPlatform" ADD VALUE IF NOT EXISTS 'TIKTOK';

-- La URL genérica y los campos de Spotify pasan a ser opcionales.
ALTER TABLE "Playlist" ADD COLUMN "url" TEXT;
ALTER TABLE "Playlist" ALTER COLUMN "spotifyId" DROP NOT NULL;
ALTER TABLE "Playlist" ALTER COLUMN "spotifyUrl" DROP NOT NULL;
ALTER TABLE "Playlist" ALTER COLUMN "spotifySyncedAt" DROP NOT NULL;

-- Los registros existentes son de Spotify: se reutiliza su URL.
UPDATE "Playlist"
SET "url" = "spotifyUrl"
WHERE "url" IS NULL;

CREATE UNIQUE INDEX "Playlist_url_key" ON "Playlist"("url");
